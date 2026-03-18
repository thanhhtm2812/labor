const express  = require('express');
const router   = express.Router();
const WorkType = require('../models/WorkType');
const { protect, authorize } = require('../middleware/auth');

// GET /api/worktypes — Lấy tất cả hình thức việc làm (Public)
router.get('/', async (req, res) => {
  try {
    const workTypes = await WorkType.getActive();
    res.json({ success: true, workTypes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/worktypes — Thêm hình thức (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const workType = await WorkType.create(req.body);
    res.status(201).json({ success: true, workType });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/worktypes/:id — Sửa hình thức (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const workType = await WorkType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, workType });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/worktypes/:id — Xóa hình thức (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await WorkType.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa hình thức việc làm' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
