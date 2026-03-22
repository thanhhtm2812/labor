const express = require('express');
const router  = express.Router();
const Job     = require('../models/Job');
const Application = require('../models/Application');
const User    = require('../models/User'); // Import User model để tìm ứng viên
const { protect, authorize } = require('../middleware/auth');
const { uploadImage, uploadToCloudinary } = require('../middleware/upload');

// ==========================================
// QUAN TRỌNG: Route tĩnh phải đặt TRƯỚC route động /:id
// ==========================================

// GET /api/jobs/employer/my-jobs — Tin của employer hiện tại
// Đặt TRƯỚC /:id để tránh Express hiểu "employer" là :id
router.get('/employer/my-jobs', protect, authorize('employer'), async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .populate('province',  'name slug districts')
      .populate('workTypes', 'name slug icon')
      .sort('-createdAt');
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs/:id/suggestions — Gợi ý ứng viên phù hợp (Smart Match)
router.get('/:id/suggestions', protect, authorize('employer'), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Tin không tồn tại' });

    // 1. Lấy tất cả ứng viên có CV công khai
    // (Trong thực tế nên dùng ElasticSearch hoặc query filter bớt để tối ưu hiệu năng)
    const candidates = await User.find({
      role: 'candidate',
      isActive: true,
      'candidateProfile.cvList.isPublic': true
    })
    .select('email candidateProfile')
    .lean();

    // 2. Thuật toán chấm điểm Match Score
    const jobText = (job.title + ' ' + job.description + ' ' + job.requirements).toLowerCase();
    
    const scoredCandidates = candidates.map(c => {
      const p = c.candidateProfile || {};
      // Lấy CV công khai mới nhất để so sánh
      const cv = (p.cvList || []).find(cv => cv.isPublic) || {};
      let score = 0;
      const details = [];

      // Tiêu chí 1: Địa điểm (Max 30đ)
      if (job.province && p.province && job.province.toString() === p.province.toString()) {
        score += 20;
        if (job.district && p.district === job.district) {
          score += 10;
          details.push('🎯 Cùng khu vực');
        } else details.push('✅ Cùng tỉnh/thành');
      }

      // Tiêu chí 2: Kỹ năng (Max 40đ)
      const skills = cv.skills || [];
      let matchedSkills = 0;
      skills.forEach(s => {
        const sName = (typeof s === 'object' ? s.name : s).toLowerCase();
        if (jobText.includes(sName)) matchedSkills++;
      });
      if (matchedSkills > 0) {
        const sScore = Math.min(matchedSkills * 10, 40);
        score += sScore;
        details.push(`🛠 Khớp ${matchedSkills} kỹ năng`);
      }

      // Tiêu chí 3: Kinh nghiệm làm việc (Max 30đ)
      // Tính tổng số năm kinh nghiệm
      const expList = (cv.experience && cv.experience.length > 0) ? cv.experience : (p.experience || []);
      let totalYears = 0;
      expList.forEach(e => {
        if (e.from) {
          const start = new Date(e.from);
          const end   = e.to ? new Date(e.to) : (e.isCurrent ? new Date() : new Date());
          if (!isNaN(start) && !isNaN(end) && end > start) {
            totalYears += (end - start) / (1000 * 60 * 60 * 24 * 365.25);
          }
        }
      });

      // Map yêu cầu từ Job
      const expMap = { 'under-1-year': 0.5, '1-3-years': 1, '3-5-years': 3, 'over-5-years': 5 };
      const requiredYears = expMap[job.experience] || 0;

      if (requiredYears > 0) {
        if (totalYears >= requiredYears) {
          score += 30;
          details.push(`🏆 Đủ kinh nghiệm (${totalYears.toFixed(1)} năm)`);
        } else if (totalYears >= requiredYears * 0.5) {
          score += 15;
          details.push(`⚠️ Kinh nghiệm gần đạt (${totalYears.toFixed(1)} năm)`);
        }
      } else {
        score += 10; // Không yêu cầu kinh nghiệm -> cộng điểm nền
        details.push('✅ Phù hợp yêu cầu KN');
      }

      return {
        _id: c._id,
        name: p.fullName || c.email,
        avatar: p.avatar,
        matchScore: score,
        matchDetails: details,
        jobTitle: cv.title // Tiêu đề CV để tham khảo
      };
    }).filter(c => c.matchScore >= 20); // Chỉ lấy những người có điểm > 20

    // 3. Sắp xếp điểm cao xuống thấp và lấy Top 10
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
    
    res.json({ success: true, candidates: scoredCandidates.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs — Danh sách + lọc
router.get('/', async (req, res) => {
  try {
    const {
      keyword, province, district, workTypes,
      category, experience, salaryMin, salaryMax,
      page = 1, limit = 12, sort = '-createdAt'
    } = req.query;

    const filter = { status: 'approved' };
    if (keyword)   filter.$text      = { $search: keyword };
    if (province)  filter.province   = province;
    if (district)  filter.district   = district;
    if (workTypes) {
      const arr = workTypes.split(',').map(id => id.trim()).filter(Boolean);
      if (arr.length) filter.workTypes = { $in: arr };
    }
    if (category)   filter.category   = new RegExp(category, 'i');
    if (experience) filter.experience = experience;
    if (salaryMin || salaryMax) {
      filter['salary.isNegotiate'] = false;
      if (salaryMin) filter['salary.max'] = { $gte: Number(salaryMin) };
      if (salaryMax) filter['salary.min'] = { $lte: Number(salaryMax) };
    }
    filter.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gte: new Date() } }
    ];

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Job.countDocuments(filter);
    const jobs  = await Job.find(filter)
      .populate('employer',  'employerProfile.companyName employerProfile.logo')
      .populate('province',  'name slug districts')
      .populate('workTypes', 'name slug icon')
      .sort(sort).skip(skip).limit(Number(limit)).lean();

    res.json({ success: true, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)), jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs/:id — Chi tiết (route động — đặt SAU route tĩnh)
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'approved' })
      .populate('employer',  'employerProfile email createdAt')
      .populate('province',  'name slug districts')
      .populate('workTypes', 'name slug icon');
    if (!job) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng' });
    await Job.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/jobs — Đăng tin (Employer)
router.post('/', protect, authorize('employer'), async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, employer: req.user._id, status: 'pending' });
    res.status(201).json({ success: true, message: 'Đăng tin thành công, đang chờ Admin duyệt', job });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/jobs/:id — Sửa tin (Employer)
router.put('/:id', protect, authorize('employer'), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Không tìm thấy tin hoặc bạn không có quyền sửa' });
    const updated = await Job.findByIdAndUpdate(req.params.id, { ...req.body, status: 'pending' }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Cập nhật tin thành công, đang chờ duyệt lại', job: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/jobs/:id — Xóa tin
router.delete('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, employer: req.user._id };
    
    // Nếu là employer, kiểm tra trạng thái tin trước khi xóa
    if (req.user.role === 'employer') {
      const jobCheck = await Job.findOne(query);
      if (!jobCheck) return res.status(404).json({ success: false, message: 'Không tìm thấy tin' });
      if (jobCheck.status !== 'rejected') {
        return res.status(403).json({ success: false, message: 'Bạn chỉ được xóa tin khi tin bị từ chối' });
      }
    }

    const job   = await Job.findOneAndDelete(query);
    if (!job) return res.status(404).json({ success: false, message: 'Không tìm thấy tin' });
    res.json({ success: true, message: 'Xóa tin tuyển dụng thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs/:id/application — Kiểm tra trạng thái ứng tuyển của user hiện tại
router.get('/:id/application', protect, authorize('candidate'), async (req, res) => {
  try {
    const application = await Application.findOne({ job: req.params.id, candidate: req.user._id });
    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/jobs/:id/apply — Ứng tuyển (Candidate)
router.post('/:id/apply', protect, authorize('candidate'), uploadImage.array('images', 3), async (req, res) => {
  try {
    const { cvId, resumeUrl, coverLetter } = req.body;
    const job = await Job.findOne({ _id: req.params.id, status: 'approved' });
    if (!job) return res.status(404).json({ success: false, message: 'Tin tuyển dụng không tồn tại' });

    const existing = await Application.findOne({ job: req.params.id, candidate: req.user._id });
    if (existing) {
      if (existing.status === 'rejected') {
        // Nếu hồ sơ trước đó bị từ chối -> Cho phép nộp lại (Xóa đơn cũ)
        await Application.findByIdAndDelete(existing._id);
        // Giảm số lượng apply cũ để tránh tính thừa khi tạo mới
        await Job.findByIdAndUpdate(req.params.id, { $inc: { applyCount: -1 } });
      } else {
        return res.status(409).json({ success: false, message: 'Bạn đã ứng tuyển vị trí này rồi' });
      }
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer, 'labor-connect/applications')));
    }

    const application = await Application.create({
      job: req.params.id, candidate: req.user._id,
      cvId, coverLetter, resumeUrl,
      images: imageUrls
    });
    await Job.findByIdAndUpdate(req.params.id, { $inc: { applyCount: 1 } });
    res.status(201).json({ success: true, message: 'Nộp hồ sơ thành công', application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
