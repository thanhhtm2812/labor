const express = require('express');
const router  = express.Router();
const Job     = require('../models/Job');
const User    = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Tất cả routes Admin đều cần xác thực + quyền admin
router.use(protect, authorize('admin'));

// ==========================================
// QUẢN LÝ TIN TUYỂN DỤNG
// ==========================================

// GET /api/admin/jobs — Danh sách tất cả tin (có lọc theo status)
router.get('/jobs', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Job.countDocuments(filter);
    const jobs  = await Job.find(filter)
      .populate('employer',  'employerProfile.companyName email')
      .populate('province',  'name slug')
      .populate('workTypes', 'name slug')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/jobs/:id/approve — Duyệt tin
router.put('/jobs/:id/approve', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', adminNote: '' },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Không tìm thấy tin' });
    res.json({ success: true, message: 'Đã duyệt tin tuyển dụng', job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/jobs/:id/reject — Từ chối tin
router.put('/jobs/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', adminNote: reason || 'Tin không đáp ứng yêu cầu' },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Không tìm thấy tin' });
    res.json({ success: true, message: 'Đã từ chối tin tuyển dụng', job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/jobs/:id/highlight — Bật/tắt tin nổi bật
router.put('/jobs/:id/highlight', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Không tìm thấy tin' });

    job.isHighlight = !job.isHighlight;
    await job.save();

    res.json({
      success: true,
      message: job.isHighlight ? 'Đã bật tin nổi bật' : 'Đã tắt tin nổi bật',
      job
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// QUẢN LÝ NGƯỜI DÙNG
// ==========================================

// GET /api/admin/users — Danh sách người dùng
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role)   filter.role = role;
    if (search) filter.email = new RegExp(search, 'i');

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/toggle-active — Khóa/mở tài khoản
router.put('/users/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Không thể khóa tài khoản Admin' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// THỐNG KÊ TỔNG QUAN
// ==========================================

// GET /api/admin/stats — Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, totalCandidates, totalEmployers,
      totalJobs, pendingJobs, approvedJobs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'employer' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'pending' }),
      Job.countDocuments({ status: 'approved' }),
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, candidates: totalCandidates, employers: totalEmployers },
        jobs:  { total: totalJobs, pending: pendingJobs, approved: approvedJobs }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
