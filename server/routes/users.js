const express    = require('express');
const router     = express.Router();
const adminVerifyRouter = express.Router();
const User       = require('../models/User');
const Application = require('../models/Application');
const Invitation  = require('../models/Invitation'); // Import Invitation Model
const { protect, authorize, generateToken } = require('../middleware/auth');
const { uploadImage, uploadToCloudinary } = require('../middleware/upload');

// ================================================================
// QUY TẮC: route TĨNH phải đặt TRƯỚC route ĐỘNG /:id
// ================================================================

// ----------------------------------------------------------------
// EMPLOYER — static routes trước /employer/:id
// ----------------------------------------------------------------

router.put('/employer/profile', protect, authorize('employer'), async (req, res) => {
  try {
    // Bắt buộc và xác thực Mã số thuế khi có trong request body
    if (req.body.taxCode !== undefined) {
      const taxCode = String(req.body.taxCode || '').trim();
      if (taxCode.length < 10 || taxCode.length > 13) {
        return res.status(400).json({ success: false, message: 'Mã số thuế là bắt buộc và phải có từ 10 đến 13 ký tự.' });
      }
    }

    const allowed = ['companyName','phone','website','industry','companySize',
      'description','videoUrl','address','province','district','taxCode','founded','galleryImages'];
    const update = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[`employerProfile.${f}`] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: true })
      .populate('employerProfile.province', 'name slug');
    res.json({ success: true, message: 'Cập nhật hồ sơ thành công', user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post('/employer/logo', protect, authorize('employer'), uploadImage.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh' });
    const logoUrl = await uploadToCloudinary(req.file.buffer, 'labor-connect/logos');
    await User.findByIdAndUpdate(req.user._id, { $set: { 'employerProfile.logo': logoUrl } });
    res.json({ success: true, message: 'Upload logo thành công', logoUrl });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/employer/gallery', protect, authorize('employer'), uploadImage.array('images', 6), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 ảnh' });
    const urls = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer, 'labor-connect/gallery')));
    const user = await User.findByIdAndUpdate(req.user._id,
      { $push: { 'employerProfile.galleryImages': { $each: urls } } }, { new: true });
    res.json({ success: true, galleryImages: user.employerProfile.galleryImages });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/employer/applications — phải trước /employer/:id
router.get('/employer/applications', protect, authorize('employer'), async (req, res) => {
  try {
    const { jobId, status, appId, page = 1, limit = 20 } = req.query;
    const Job = require('../models/Job');
    const myJobs   = await Job.find({ employer: req.user._id }).select('_id title');
    const myJobIds = myJobs.map(j => j._id);
    const filter   = { job: { $in: myJobIds } };
    if (jobId)  filter.job    = jobId;
    if (status) {
      const statuses = status.toString().split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 0) filter.status = { $in: statuses };
    }
    if (appId)  filter._id    = appId;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Application.countDocuments(filter);
    const apps  = await Application.find(filter)
      .populate('candidate', 'email candidateProfile.fullName candidateProfile.avatar candidateProfile.phone candidateProfile.skills candidateProfile.cvList candidateProfile.province candidateProfile.district')
      .populate('job', 'title')
      .sort('-createdAt').skip(skip).limit(Number(limit));
    res.json({ success: true, total, applications: apps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/employer/applications/:appId/status — phải trước /employer/:id
router.put('/employer/applications/:appId/status', protect, authorize('employer'), async (req, res) => {
  try {
    const { status, employerNote } = req.body;
    const allowed = ['viewed','accepted','rejected'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `Trạng thái không hợp lệ. Chọn: ${allowed.join(', ')}` });
    const app = await Application.findById(req.params.appId).populate('job', 'employer');
    if (!app) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn ứng tuyển' });
    if (app.job.employer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật đơn này' });
    const update = { status };
    if (employerNote !== undefined)               update.employerNote = employerNote;
    if (status === 'viewed' && !app.viewedAt)     update.viewedAt     = new Date();
    if (['accepted','rejected'].includes(status)) update.respondedAt  = new Date();
    const updated = await Application.findByIdAndUpdate(req.params.appId, update, { new: true })
      .populate('candidate', 'email candidateProfile.fullName');
    res.json({ success: true, message: 'Cập nhật trạng thái thành công', application: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/employer/invite — Gửi lời mời ứng tuyển
router.post('/employer/invite', protect, authorize('employer'), async (req, res) => {
  try {
    const { candidateId, jobId, message } = req.body;
    const Job = require('../models/Job');

    // 1. Kiểm tra Job có thuộc về Employer này không
    const job = await Job.findOne({ _id: jobId, employer: req.user._id });
    if (!job) return res.status(403).json({ success: false, message: 'Tin tuyển dụng không hợp lệ' });

    // 2. Kiểm tra Candidate tồn tại
    const candidate = await User.findOne({ _id: candidateId, role: 'candidate' });
    if (!candidate) return res.status(404).json({ success: false, message: 'Ứng viên không tồn tại' });

    // 3. Kiểm tra xem đã mời chưa (hoặc đã ứng tuyển chưa - tùy logic, ở đây check duplicate invite)
    const existingInvite = await Invitation.findOne({ job: jobId, candidate: candidateId });
    if (existingInvite) return res.status(409).json({ success: false, message: 'Bạn đã gửi lời mời cho ứng viên này vào tin này rồi' });

    // 4. Kiểm tra xem ứng viên đã nộp đơn chưa
    const existingApp = await Application.findOne({ job: jobId, candidate: candidateId });
    if (existingApp) return res.status(409).json({ success: false, message: 'Ứng viên này đã nộp hồ sơ vào tin này rồi' });

    const invitation = await Invitation.create({
      employer: req.user._id,
      candidate: candidateId,
      job: jobId,
      message
    });

    res.json({ success: true, message: 'Đã gửi lời mời thành công', invitation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/employer/invitations — Xem lịch sử lời mời đã gửi
router.get('/employer/invitations', protect, authorize('employer'), async (req, res) => {
  try {
    const invites = await Invitation.find({ employer: req.user._id })
      .populate('candidate', 'email candidateProfile.fullName candidateProfile.avatar candidateProfile.phone')
      .populate('job', 'title status')
      .sort('-createdAt');
    res.json({ success: true, invitations: invites });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/employer/verify-requests — phải trước /employer/:id
router.get('/employer/verify-requests', protect, authorize('employer'), async (req, res) => {
  try {
    const empId = req.user._id.toString();

    // Lấy đầy đủ candidateProfile để scan cả cvList
    const candidates = await User.find({ role: 'candidate' })
      .select('email candidateProfile.fullName candidateProfile.experience candidateProfile.cvList');

    const result = [];
    candidates.forEach(c => {
      const cp   = c.candidateProfile || {};
      const name = cp.fullName || c.email;

      // Scan candidateProfile.experience trực tiếp
      (cp.experience || [])
        .filter(e => e.verifyStatus === 'pending_employer' && e.assignedEmployer?.toString() === empId)
        .forEach(e => result.push({ candidateId: c._id, candidateName: name, experience: e }));

      // Scan cvList[].experience
      (cp.cvList || []).forEach(cv => {
        (cv.experience || [])
          .filter(e => e.verifyStatus === 'pending_employer' && e.assignedEmployer?.toString() === empId)
          .forEach(e => result.push({ candidateId: c._id, candidateName: name, experience: e }));
      });
    });

    // Loại trùng lặp theo experience._id
    const seen = new Set();
    const unique = result.filter(r => {
      const key = r.experience._id?.toString();
      if (!key || seen.has(key)) return false;
      seen.add(key); return true;
    });

    res.json({ success: true, total: unique.length, items: unique });
  } catch (err) {
    console.error('[verify-requests]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/employer/verify-experience/:candidateId/:expId — phải trước /employer/:id
router.put('/employer/verify-experience/:candidateId/:expId', protect, authorize('employer'), async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!['verify','reject'].includes(action))
      return res.status(400).json({ success: false, message: 'action phải là verify hoặc reject' });

    const mongoose   = require('mongoose');
    const oid        = new mongoose.Types.ObjectId(req.params.expId);
    const empId      = req.user._id;
    const newStatus  = action === 'verify' ? 'verified' : 'rejected';
    const setFields  = { verifyStatus: newStatus, verifyNote: note || '', verifiedAt: new Date(), verifiedBy: empId };

    // Kiểm tra quyền: experience phải được assign cho employer này
    const candidate = await User.findById(req.params.candidateId).select('candidateProfile.experience candidateProfile.cvList');
    if (!candidate) return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên' });

    const cp = candidate.candidateProfile || {};
    let isAssigned = false;

    // Kiểm tra trong candidateProfile.experience
    const directExp = (cp.experience || []).find(e => e._id?.toString() === req.params.expId);
    if (directExp && directExp.assignedEmployer?.toString() === empId.toString()) isAssigned = true;

    // Kiểm tra trong cvList[].experience
    if (!isAssigned) {
      for (const cv of (cp.cvList || [])) {
        const cvExp = (cv.experience || []).find(e => e._id?.toString() === req.params.expId);
        if (cvExp && cvExp.assignedEmployer?.toString() === empId.toString()) { isAssigned = true; break; }
      }
    }
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Không có quyền xác minh mục này' });

    // Cập nhật trong candidateProfile.experience trực tiếp
    const setDirect = {};
    for (const [k,v] of Object.entries(setFields)) setDirect[`candidateProfile.experience.$.${k}`] = v;

    let updated = await User.findOneAndUpdate(
      { _id: req.params.candidateId, 'candidateProfile.experience._id': oid },
      { $set: setDirect }, { new: true, runValidators: false }
    );

    // Fallback: cập nhật trong cvList[].experience
    if (!updated) {
      const setCvList = {};
      for (const [k,v] of Object.entries(setFields)) setCvList[`candidateProfile.cvList.$[].experience.$[exp].${k}`] = v;
      updated = await User.findOneAndUpdate(
        { _id: req.params.candidateId, 'candidateProfile.cvList.experience._id': oid },
        { $set: setCvList },
        { new: true, runValidators: false, arrayFilters: [{ 'exp._id': oid }] }
      );
    }

    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy kinh nghiệm' });
    res.json({ success: true, message: action === 'verify' ? 'Đã xác minh kinh nghiệm' : 'Đã từ chối kinh nghiệm' });
  } catch (err) {
    console.error('[verify-experience]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/employer/search-cvs — phải trước /employer/:id
// Fix: không dùng 'candidateProfile.cvList.isPublic' làm filter MongoDB
// vì Mongoose không hỗ trợ query nested array field trực tiếp như vậy
router.get('/employer/search-cvs', protect, authorize('employer'), async (req, res) => {
  try {
    const { keyword, skill, province, district, page = 1, limit = 12 } = req.query;

    // Chỉ filter những field top-level, lọc cvList.isPublic ở JS
    const filter = { role: 'candidate', isActive: true };
    if (province) filter['candidateProfile.province'] = province;
    if (district) filter['candidateProfile.district'] = district;

    let candidates = await User.find(filter)
      .select('email candidateProfile.fullName candidateProfile.avatar candidateProfile.skills candidateProfile.province candidateProfile.district candidateProfile.desiredSalary candidateProfile.cvList')
      .populate('candidateProfile.province', 'name')
      .lean();

    // Chỉ giữ candidate có ít nhất 1 CV công khai
    candidates = candidates.filter(c =>
      (c.candidateProfile?.cvList || []).some(cv => cv.isPublic === true)
    );

    // Lọc theo keyword (CHỈ TÊN HOẶC EMAIL)
    if (keyword) {
      const kw = keyword.toLowerCase();
      candidates = candidates.filter(c => {
        const name   = (c.candidateProfile?.fullName || c.email || '').toLowerCase();
        return name.includes(kw);
      });
    }

    // Lọc theo kỹ năng cụ thể (Tìm trong cả Profile và CV public)
    if (skill) {
      const sk = skill.toLowerCase();
      candidates = candidates.filter(c => {
        // Kỹ năng từ hồ sơ
        const profileSkills = (c.candidateProfile?.skills || []).map(s => (typeof s === 'object' ? s.name : s || '').toLowerCase());
        // Kỹ năng từ CV công khai
        const cvSkills = (c.candidateProfile?.cvList || [])
          .filter(cv => cv.isPublic)
          .flatMap(cv => (cv.skills || []).map(s => (typeof s === 'object' ? s.name : s || '').toLowerCase()));
        
        return profileSkills.some(s => s.includes(sk)) || cvSkills.some(s => s.includes(sk));
      });
    }

    const total = candidates.length;
    const skip  = (Number(page) - 1) * Number(limit);
    const paged = candidates.slice(skip, skip + Number(limit));

    // Chỉ trả CV isPublic = true cho mỗi candidate
    const result = paged.map(c => ({
      _id:   c._id,
      email: c.email,
      candidateProfile: {
        ...c.candidateProfile,
        cvList: (c.candidateProfile?.cvList || []).filter(cv => cv.isPublic === true),
      }
    }));

    res.json({
      success: true, total,
      totalPages: Math.ceil(total / Number(limit)),
      page: Number(page),
      candidates: result
    });
  } catch (err) {
    console.error('[search-cvs error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/employers — Public list of employers
router.get('/employers', async (req, res) => {
  try {
    const { keyword, province, district, page = 1, limit = 12 } = req.query;
    const filter = { role: 'employer', isActive: true };

    if (keyword) {
      filter['employerProfile.companyName'] = { $regex: keyword, $options: 'i' };
    }
    if (province) filter['employerProfile.province'] = province;
    if (district) filter['employerProfile.district'] = district;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('employerProfile email')
      .populate('employerProfile.province', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, totalPages: Math.ceil(total / Number(limit)), employers: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// WALK-IN CANDIDATES (Ứng viên vãng lai)
// ================================================================

// POST /api/employer/walk-in-candidates — Tạo ứng viên vãng lai
router.post('/employer/walk-in-candidates', protect, authorize('employer'), async (req, res) => {
  try {
    const { fullName, email } = req.body;
    // Nếu không có email, tự sinh email giả lập
    const finalEmail = email || `walkin_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@labor.local`;
    // Mật khẩu ngẫu nhiên (Employer không cần biết)
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    const user = await User.create({
      email: finalEmail,
      password, 
      role: 'candidate',
      candidateProfile: { fullName: fullName || 'Ứng viên vãng lai' },
      createdBy: req.user._id // Lưu ID Employer đã tạo (cần đảm bảo Schema User cho phép field này hoặc dùng strict: false)
    });

    res.json({ success: true, user: { _id: user._id, email: user.email, candidateProfile: user.candidateProfile } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/employer/walk-in-candidates — Lấy danh sách do mình tạo
router.get('/employer/walk-in-candidates', protect, authorize('employer'), async (req, res) => {
  try {
    const users = await User.find({ createdBy: req.user._id, role: 'candidate' }).sort('-createdAt');
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/employer/walk-in-candidates/:id/switch-token — Lấy token để login
router.post('/employer/walk-in-candidates/:id/switch-token', protect, authorize('employer'), async (req, res) => {
  try {
    // Chỉ cho phép lấy token của user do chính employer này tạo
    const user = await User.findOne({ _id: req.params.id, createdBy: req.user._id, role: 'candidate' });
    if (!user) return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài khoản này' });

    const token = generateToken(user._id);
    res.json({ success: true, token, user: { id: user._id, email: user.email, role: 'candidate', displayName: user.candidateProfile?.fullName } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/employer/:id — route ĐỘNG, đặt CUỐI CÙNG trong block employer
router.get('/employer/:id', async (req, res) => {
  try {
    const employer = await User.findOne({ _id: req.params.id, role: 'employer', isActive: true })
      .select('employerProfile email createdAt')
      .populate('employerProfile.province', 'name slug');
    if (!employer) return res.status(404).json({ success: false, message: 'Không tìm thấy công ty' });
    const profile = employer.toObject().employerProfile || {};
    if (profile.videoUrl) {
      const match = profile.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]{11})/);
      profile.videoEmbedUrl = match ? `https://www.youtube.com/embed/${match[1]}` : null;
    }
    res.json({ success: true, employer: { ...employer.toObject(), employerProfile: profile } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ----------------------------------------------------------------
// CANDIDATE routes
// ----------------------------------------------------------------

router.put('/candidate/profile', protect, authorize('candidate'), async (req, res) => {
  try {
    const allowed = ['fullName','phone','dateOfBirth','gender','bio','skills',
      'education','experience','province','district','desiredWorkTypes','desiredSalary','resumeUrl'];
    const update = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[`candidateProfile.${f}`] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: true })
      .populate('candidateProfile.province', 'name slug')
      .populate('candidateProfile.desiredWorkTypes', 'name slug icon');
    res.json({ success: true, message: 'Cập nhật hồ sơ thành công', user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post('/candidate/avatar', protect, authorize('candidate'), uploadImage.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh' });
    const avatarUrl = await uploadToCloudinary(req.file.buffer, 'labor-connect/avatars');
    await User.findByIdAndUpdate(req.user._id, { $set: { 'candidateProfile.avatar': avatarUrl } });
    res.json({ success: true, message: 'Upload avatar thành công', avatarUrl });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/candidate/switch-back-to-employer — Walk-in login ngược lại Employer
router.post('/candidate/switch-back-to-employer', protect, authorize('candidate'), async (req, res) => {
  try {
    // Kiểm tra xem user này có phải do employer tạo không
    if (!req.user.createdBy) {
      return res.status(403).json({ success: false, message: 'Tài khoản này không phải là ứng viên vãng lai.' });
    }

    const employer = await User.findById(req.user.createdBy);
    if (!employer) return res.status(404).json({ success: false, message: 'Tài khoản Employer gốc không tồn tại.' });

    const token = generateToken(employer._id);
    res.json({
      success: true,
      token,
      user: { id: employer._id, email: employer.email, role: employer.role, displayName: employer.displayName }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// CV routes
router.get('/candidate/cvs', protect, authorize('candidate'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('candidateProfile.cvList');
    const cvList = user.candidateProfile?.cvList || [];

    // Kiểm tra CV nào đã được dùng để ứng tuyển
    const cvIds = cvList.map(c => c._id);
    const usedApps = await Application.find({ candidate: req.user._id, cvId: { $in: cvIds } }).select('cvId');
    const usedCvIds = new Set(usedApps.map(a => a.cvId.toString()));

    const result = cvList.map(cv => ({ ...cv.toObject(), isUsed: usedCvIds.has(cv._id.toString()) }));

    res.json({ success: true, cvList: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/candidate/cvs', protect, authorize('candidate'), async (req, res) => {
  try {
    const cvData = {
      title:            req.body.title || 'CV của tôi',
      summary:          req.body.summary,
      skills:           req.body.skills           || [],
      education:        req.body.education        || [],
      experience:       req.body.experience       || [],
      certifications:   req.body.certifications   || [],
      languages:        req.body.languages        || [],
      desiredPosition:  req.body.desiredPosition,
      desiredSalary:    req.body.desiredSalary,
      desiredWorkTypes: req.body.desiredWorkTypes || [],
      isPublic:         req.body.isPublic !== false,
      updatedAt:        new Date(),
    };
    const user  = await User.findByIdAndUpdate(req.user._id,
      { $push: { 'candidateProfile.cvList': cvData } }, { new: true });
    const newCv = user.candidateProfile.cvList[user.candidateProfile.cvList.length - 1];
    res.status(201).json({ success: true, message: 'Tạo CV thành công', cv: newCv });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/candidate/cvs/:cvId', protect, authorize('candidate'), async (req, res) => {
  try {
    // Kiểm tra: Không được sửa CV đã nộp ứng tuyển
    const isUsed = await Application.exists({ candidate: req.user._id, cvId: req.params.cvId });
    if (isUsed) {
      // Cho phép sửa nếu CHỈ cập nhật trạng thái isPublic
      const keys = Object.keys(req.body);
      if (!(keys.length === 1 && keys[0] === 'isPublic')) {
        return res.status(400).json({ success: false, message: 'Không thể sửa nội dung CV đã được sử dụng để ứng tuyển.' });
      }
    }

    const fields = ['title','summary','skills','education','experience',
      'certifications','languages','desiredPosition','desiredSalary','desiredWorkTypes','isPublic'];
    const setObj = { 'candidateProfile.cvList.$.updatedAt': new Date() };
    fields.forEach(f => { if (req.body[f] !== undefined) setObj[`candidateProfile.cvList.$.${f}`] = req.body[f]; });
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, 'candidateProfile.cvList._id': req.params.cvId },
      { $set: setObj }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy CV' });
    const cv = user.candidateProfile.cvList.id(req.params.cvId);
    res.json({ success: true, message: 'Cập nhật CV thành công', cv });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/candidate/cvs/:cvId', protect, authorize('candidate'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id,
      { $pull: { 'candidateProfile.cvList': { _id: req.params.cvId } } });
    res.json({ success: true, message: 'Đã xóa CV' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// CANDIDATE: request verify education — phải trước /candidate/cvs/:cvId để không bị override
router.post('/candidate/education/:eduId/request-verify', protect, authorize('candidate'), async (req, res) => {
  try {
    const eduId = req.params.eduId;

    // 1. Thử cập nhật trong candidateProfile.education (positional $)
    let result = await User.findOneAndUpdate(
      { _id: req.user._id, 'candidateProfile.education._id': eduId },
      { $set: { 'candidateProfile.education.$.verifyStatus': 'pending' } },
      { new: true, runValidators: false }
    );

    if (!result) {
      // 2. Tìm CV chứa education._id này, dùng arrayFilters để cập nhật nested array
      // arrayFilters cho phép cập nhật đúng phần tử trong mảng lồng nhau mà không cần save()
      result = await User.findOneAndUpdate(
        { _id: req.user._id, 'candidateProfile.cvList.education._id': eduId },
        { $set: { 'candidateProfile.cvList.$[].education.$[edu].verifyStatus': 'pending' } },
        {
          new: true,
          runValidators: false,
          arrayFilters: [{ 'edu._id': new (require('mongoose').Types.ObjectId)(eduId) }]
        }
      );
    }

    if (!result) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học vấn' });
    }

    res.json({ success: true, message: 'Đã gửi yêu cầu xác minh học vấn' });
  } catch (err) {
    console.error('[request-verify education]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// CANDIDATE: request verify experience
router.post('/candidate/experience/:expId/request-verify', protect, authorize('candidate'), async (req, res) => {
  try {
    const expId = req.params.expId;

    // 1. Thử cập nhật trong candidateProfile.experience
    let result = await User.findOneAndUpdate(
      { _id: req.user._id, 'candidateProfile.experience._id': expId },
      { $set: { 'candidateProfile.experience.$.verifyStatus': 'pending_admin' } },
      { new: true, runValidators: false }
    );

    if (!result) {
      // 2. Tìm trong cvList[].experience dùng arrayFilters
      result = await User.findOneAndUpdate(
        { _id: req.user._id, 'candidateProfile.cvList.experience._id': expId },
        { $set: { 'candidateProfile.cvList.$[].experience.$[exp].verifyStatus': 'pending_admin' } },
        {
          new: true,
          runValidators: false,
          arrayFilters: [{ 'exp._id': new (require('mongoose').Types.ObjectId)(expId) }]
        }
      );
    }

    if (!result) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kinh nghiệm' });
    }

    res.json({ success: true, message: 'Đã gửi yêu cầu xác minh kinh nghiệm' });
  } catch (err) {
    console.error('[request-verify experience]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Saved jobs
router.get('/candidate/saved-jobs', protect, authorize('candidate'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedJobs')
      .populate({
        path: 'savedJobs',
        match: { _id: { $exists: true } },
        populate: [
          { path: 'province',  select: 'name slug' },
          { path: 'workTypes', select: 'name slug icon' },
          { path: 'employer',  select: 'employerProfile.companyName employerProfile.logo' }
        ]
      });
    const savedJobs = (user.savedJobs || []).filter(j => j != null);
    res.json({ success: true, savedJobs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/candidate/saved-jobs/:jobId', protect, authorize('candidate'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedJobs');
    if (user.savedJobs.some(id => id.toString() === req.params.jobId))
      return res.status(409).json({ success: false, message: 'Đã lưu việc làm này rồi' });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedJobs: req.params.jobId } });
    res.json({ success: true, message: 'Đã lưu việc làm' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/candidate/saved-jobs/:jobId', protect, authorize('candidate'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { savedJobs: req.params.jobId } });
    res.json({ success: true, message: 'Đã bỏ lưu việc làm' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Applications (candidate)
router.get('/candidate/applications', protect, authorize('candidate'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { candidate: req.user._id };
    if (status) filter.status = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Application.countDocuments(filter);
    const apps  = await Application.find(filter)
      .populate({
        path: 'job',
        select: 'title salary province workTypes employer status',
        populate: [
          { path: 'province',  select: 'name' },
          { path: 'workTypes', select: 'name icon' },
          { path: 'employer',  select: 'employerProfile.companyName employerProfile.logo' }
        ]
      })
      .sort('-createdAt').skip(skip).limit(Number(limit));
    res.json({ success: true, total, applications: apps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/candidate/invitations — Xem danh sách lời mời
router.get('/candidate/invitations', protect, authorize('candidate'), async (req, res) => {
  try {
    const invites = await Invitation.find({ candidate: req.user._id })
      .populate({
        path: 'job',
        select: 'title salary province slug status',
        populate: { path: 'province', select: 'name' }
      })
      .populate('employer', 'employerProfile.companyName employerProfile.logo')
      .sort('-createdAt');
    res.json({ success: true, invitations: invites });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/candidate/invitations/:id/respond', protect, authorize('candidate'), async (req, res) => {
  try {
    const { status, message } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    // Push to history and remove old field
    const update = {
      status,
      $push: { responseHistory: { status, message, respondedAt: new Date() } },
      $unset: { candidateMessage: "" }
    };
    await Invitation.findOneAndUpdate({ _id: req.params.id, candidate: req.user._id }, update, { new: true });
    res.json({ success: true, message: status === 'accepted' ? 'Đã chấp nhận lời mời' : 'Đã từ chối lời mời' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Followed companies
router.get('/candidate/followed-companies', protect, authorize('candidate'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followedCompanies', 'employerProfile.companyName employerProfile.logo employerProfile.industry employerProfile.province email');
    res.json({ success: true, followedCompanies: user.followedCompanies || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/candidate/followed-companies/:employerId', protect, authorize('candidate'), async (req, res) => {
  try {
    const employer = await User.findOne({ _id: req.params.employerId, role: 'employer' });
    if (!employer) return res.status(404).json({ success: false, message: 'Không tìm thấy công ty' });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { followedCompanies: req.params.employerId } });
    res.json({ success: true, message: `Đã theo dõi ${employer.employerProfile?.companyName || 'công ty'}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/candidate/followed-companies/:employerId', protect, authorize('candidate'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { followedCompanies: req.params.employerId } });
    res.json({ success: true, message: 'Đã bỏ theo dõi công ty' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/candidate/:id — Public profile for employers to view
// Must be after other /candidate/... static routes, and protected for employers
router.get('/candidate/:id', protect, authorize('employer'), async (req, res) => {
  try {
    const candidate = await User.findOne({ _id: req.params.id, role: 'candidate', isActive: true })
      .select('email candidateProfile.fullName candidateProfile.avatar candidateProfile.bio candidateProfile.province candidateProfile.district candidateProfile.phone candidateProfile.gender candidateProfile.dateOfBirth candidateProfile.resumeUrl candidateProfile.skills candidateProfile.cvList')
      .populate('candidateProfile.province', 'name slug')
      .lean();

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên' });
    }

    // Filter to only show public CVs
    if (candidate.candidateProfile && candidate.candidateProfile.cvList) {
      candidate.candidateProfile.cvList = candidate.candidateProfile.cvList.filter(cv => cv.isPublic === true);
    }

    res.json({ success: true, candidate });
  } catch (err) {
    console.error('[GET /candidate/:id] error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// ADMIN VERIFY ROUTER — mount tại /api/admin/verifications
// ================================================================

adminVerifyRouter.get('/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    // Lấy đầy đủ candidateProfile bao gồm cvList để scan cả 2 nơi
    const candidates = await User.find({ role: 'candidate' })
      .select('email candidateProfile');

    const result = [];

    candidates.forEach(c => {
      const cp   = c.candidateProfile || {};
      const name = cp.fullName || c.email;

      // ---- Helper: push item vào result ----
      const pushEdu = (e) => result.push({ candidateId: c._id, candidateName: name, type: 'education', item: e });
      const pushExp = (e) => result.push({ candidateId: c._id, candidateName: name, type: 'experience', item: e });

      // 1. Scan candidateProfile.education (trực tiếp)
      if (type !== 'experience') {
        (cp.education || [])
          .filter(e => e.verifyStatus === 'pending')
          .forEach(pushEdu);
      }

      // 2. Scan candidateProfile.experience (trực tiếp)
      if (type !== 'education') {
        (cp.experience || [])
          .filter(e => e.verifyStatus === 'pending_admin' || e.verifyStatus === 'pending_employer')
          .forEach(pushExp);
      }

      // 3. Scan cvList[].education (education nằm trong CV)
      if (type !== 'experience') {
        (cp.cvList || []).forEach(cv => {
          (cv.education || [])
            .filter(e => e.verifyStatus === 'pending')
            .forEach(pushEdu);
        });
      }

      // 4. Scan cvList[].experience (experience nằm trong CV)
      if (type !== 'education') {
        (cp.cvList || []).forEach(cv => {
          (cv.experience || [])
            .filter(e => e.verifyStatus === 'pending_admin' || e.verifyStatus === 'pending_employer')
            .forEach(pushExp);
        });
      }
    });

    // Loại trùng lặp theo item._id (phòng trường hợp cùng _id xuất hiện 2 nơi)
    const seen = new Set();
    const unique = result.filter(r => {
      const key = `${r.type}_${r.item._id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({ success: true, total: unique.length, items: unique });
  } catch (err) {
    console.error('[verifications/pending]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

adminVerifyRouter.put('/education/:candidateId/:eduId', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['verified','rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Status phải là verified hoặc rejected' });

    const mongoose = require('mongoose');
    const oid  = new mongoose.Types.ObjectId(req.params.eduId);
    const cid  = req.params.candidateId;
    const setF = {
      'candidateProfile.education.$.verifyStatus': status,
      'candidateProfile.education.$.verifyNote':   note || '',
      'candidateProfile.education.$.verifiedAt':   new Date(),
      'candidateProfile.education.$.verifiedBy':   req.user._id,
    };

    // Thử cập nhật trong candidateProfile.education trực tiếp
    let user = await User.findOneAndUpdate(
      { _id: cid, 'candidateProfile.education._id': oid },
      { $set: setF }, { new: true, runValidators: false }
    );

    // Nếu không tìm thấy → thử trong cvList[].education
    if (!user) {
      user = await User.findOneAndUpdate(
        { _id: cid, 'candidateProfile.cvList.education._id': oid },
        { $set: {
          'candidateProfile.cvList.$[].education.$[edu].verifyStatus': status,
          'candidateProfile.cvList.$[].education.$[edu].verifyNote':   note || '',
          'candidateProfile.cvList.$[].education.$[edu].verifiedAt':   new Date(),
          'candidateProfile.cvList.$[].education.$[edu].verifiedBy':   req.user._id,
        }},
        { new: true, runValidators: false, arrayFilters: [{ 'edu._id': oid }] }
      );
    }

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy học vấn' });
    res.json({ success: true, message: `Đã ${status === 'verified' ? 'xác minh' : 'từ chối'} học vấn` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

adminVerifyRouter.put('/experience/:candidateId/:expId', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, note, employerId } = req.body;
    const mongoose = require('mongoose');
    const oid = new mongoose.Types.ObjectId(req.params.expId);
    const cid = req.params.expId ? req.params.candidateId : null;

    let setObj = {};
    if (action === 'verify') {
      setObj = { verifyStatus: 'verified', verifyNote: note || '', verifiedAt: new Date(), verifiedBy: req.user._id };
    } else if (action === 'reject') {
      setObj = { verifyStatus: 'rejected', verifyNote: note || '' };
    } else if (action === 'assign_employer') {
      if (!employerId) return res.status(400).json({ success: false, message: 'Cần cung cấp employerId' });
      setObj = { verifyStatus: 'pending_employer', assignedEmployer: employerId, verifyNote: note || '' };
    } else {
      return res.status(400).json({ success: false, message: 'action không hợp lệ' });
    }

    // Build $set cho candidateProfile.experience.$
    const setDirect = {};
    for (const [k,v] of Object.entries(setObj)) {
      setDirect[`candidateProfile.experience.$.${k}`] = v;
    }
    // Build $set cho cvList.$[].experience.$[exp]
    const setCvList = {};
    for (const [k,v] of Object.entries(setObj)) {
      setCvList[`candidateProfile.cvList.$[].experience.$[exp].${k}`] = v;
    }

    // Thử cập nhật candidateProfile.experience trực tiếp
    let user = await User.findOneAndUpdate(
      { _id: req.params.candidateId, 'candidateProfile.experience._id': oid },
      { $set: setDirect },
      { new: true, runValidators: false }
    );

    // Nếu không tìm thấy → thử trong cvList[].experience
    if (!user) {
      user = await User.findOneAndUpdate(
        { _id: req.params.candidateId, 'candidateProfile.cvList.experience._id': oid },
        { $set: setCvList },
        { new: true, runValidators: false, arrayFilters: [{ 'exp._id': oid }] }
      );
    }

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy kinh nghiệm' });
    const msg = action === 'verify' ? 'Đã xác minh' : action === 'reject' ? 'Đã từ chối' : 'Đã giao cho Employer xác minh';
    res.json({ success: true, message: msg });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ================================================================
// EXPORTS — phải ở cuối file
// ================================================================
module.exports = router;
module.exports.adminVerifyRouter = adminVerifyRouter;
