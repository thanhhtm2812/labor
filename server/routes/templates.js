const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const Template = require('../models/Template');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Cấu hình Multer lưu local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../upload/templates');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Giữ tên file gốc nhưng thêm timestamp để tránh trùng
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file .docx'));
    }
  }
});

// Middleware hỗ trợ lấy token từ query param (cho download file trực tiếp)
const allowQueryToken = (req, res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
};

// GET /api/templates - Lấy danh sách template (Admin xem quản lý, User xem để chọn)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive) filter.isActive = true;
    if (req.query.forRole) filter.forRole = req.query.forRole;

    const templates = await Template.find(filter).sort('-createdAt');
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/templates - Upload template mới (Admin)
router.post('/', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng upload file .docx' });
    
    const template = await Template.create({
      name: req.body.name || req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      forRole: req.body.forRole || 'candidate',
      uploadedBy: req.user._id
    });

    res.json({ success: true, message: 'Upload template thành công', template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/templates/:id/file - Admin tải file gốc về để sửa
router.get('/:id/file', allowQueryToken, protect, authorize('admin'), async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template || !fs.existsSync(template.path)) return res.status(404).send('File không tồn tại trên server');
    res.download(template.path, template.filename);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// PUT /api/templates/:id - Cập nhật template (Đổi tên hoặc Upload file mới đè lên)
router.put('/:id', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template không tìm thấy' });

    if (req.body.name) template.name = req.body.name;
    if (req.body.forRole) template.forRole = req.body.forRole;

    if (req.file) {
      // Xóa file cũ nếu tồn tại
      if (fs.existsSync(template.path)) fs.unlinkSync(template.path);
      template.filename = req.file.filename;
      template.path = req.file.path;
    }

    await template.save();
    res.json({ success: true, message: 'Cập nhật template thành công', template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/templates/:id - Xóa template (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy template' });

    // Xóa file vật lý
    if (fs.existsSync(template.path)) {
      fs.unlinkSync(template.path);
    }

    await Template.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa template' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/templates/generate/:templateId/cv/:cvId - Xuất file Word
router.get('/generate/:templateId/cv/:cvId', async (req, res) => {
  try {
    const template = await Template.findById(req.params.templateId);
    if (!template) return res.status(404).send('Template không tồn tại');

    // Tìm User chứa CV (Candidate)
    // Lưu ý: cvId là _id trong mảng candidateProfile.cvList
    const user = await User.findOne({ 'candidateProfile.cvList._id': req.params.cvId }).populate('candidateProfile.province');
    if (!user) return res.status(404).send('CV không tồn tại');

    const profile = user.candidateProfile;
    const cv = profile.cvList.id(req.params.cvId);

    // Helper format date
    const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

    // Helper map verify status
    const verifyMap = {
      unverified: 'Chưa xác minh',
      pending: 'Đang chờ duyệt',
      pending_admin: 'Chờ Admin duyệt',
      pending_employer: 'Chờ Employer duyệt',
      verified: 'Đã xác minh',
      rejected: 'Bị từ chối'
    };

    // Tìm tên quận huyện từ slug (vì trong db chỉ lưu slug)
    let districtName = profile.district;
    if (profile.province && profile.province.districts) {
      const dist = profile.province.districts.find(d => d.slug === profile.district);
      if (dist) districtName = dist.name;
    }

    // Chuẩn bị data để merge vào Word
    // Các tag trong word sẽ là: {fullName}, {email}, {phone}, {#education}...{/education}
    const data = {
      fullName: profile.fullName || user.email,
      email: user.email,
      phone: profile.phone || '',
      liveAddress: profile.address || '',
      district: districtName || '',
      province: profile.province?.name || '',
      summary: cv.summary || '',
      title: cv.title || '',
      desiredPosition: cv.desiredPosition || '',
      salary: (() => {
        const s = cv.desiredSalary;
        if (!s) return 'Thỏa thuận';
        if (s.min && s.max) return `${(s.min/1000000).toLocaleString('vi-VN')} - ${(s.max/1000000).toLocaleString('vi-VN')} triệu VND`;
        if (s.min) return `Từ ${(s.min/1000000).toLocaleString('vi-VN')} triệu VND`;
        return 'Thỏa thuận';
      })(),
      skills: (cv.skills || []).map(s => {
        const levelMap = {
          basic: 'Cơ bản',
          intermediate: 'Trung bình',
          advanced: 'Nâng cao',
          expert: 'Chuyên gia',
        };
        return {
          name: s.name || '',
          level: levelMap[s.level] || 'Trung bình',
          certificate: s.certificate || '',
          certUrl: s.certUrl || '',
          from: fmt(s.from),
          to: fmt(s.to),
          projects: (s.projects || []).join(', ') || '',
        };
      }),
      education: (cv.education || []).map(e => ({
        school: e.school,
        degree: e.degree,
        major: e.major,
        gpa: e.gpa,
        from: fmt(e.from),
        to: e.isCurrent ? 'Hiện tại' : fmt(e.to),
        description: e.description || '',
        verifyStatus: verifyMap[e.verifyStatus] || 'Chưa xác minh',
        isVerified: e.verifyStatus === 'verified'
      })),
      experience: (cv.experience || []).map(e => ({
        company: e.company,
        position: e.position,
        description: e.description,
        from: fmt(e.from),
        to: e.isCurrent ? 'Hiện tại' : fmt(e.to),
        verifyStatus: verifyMap[e.verifyStatus] || 'Chưa xác minh',
        isVerified: e.verifyStatus === 'verified'
      })),
      updatedAt: fmt(cv.updatedAt || cv.createdAt)
    };

    // Load file template
    const content = fs.readFileSync(template.path, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render(data);

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.set('Content-Disposition', `attachment; filename=${cv.title ? cv.title.replace(/[^a-z0-9]/gi, '_') : 'cv'}.docx`);
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi tạo file CV: ' + err.message);
  }
});

module.exports = router;