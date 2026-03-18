const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');

// ==========================================
// POST /api/auth/register — Đăng ký tài khoản
// ==========================================
router.post('/register', [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('role').isIn(['candidate', 'employer']).withMessage('Vai trò không hợp lệ')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, role, fullName, companyName } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const userData = { email, password, role };

    if (role === 'candidate') {
      userData.candidateProfile = { fullName: fullName || '' };
    } else if (role === 'employer') {
      userData.employerProfile = { companyName: companyName || '' };
    }

    const user  = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: {
        id:          user._id,
        email:       user.email,
        role:        user.role,
        displayName: user.displayName
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// POST /api/auth/login — Đăng nhập
// ==========================================
router.post('/login', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id:          user._id,
        email:       user.email,
        role:        user.role,
        displayName: user.displayName,
        logo:        user.employerProfile?.logo || user.candidateProfile?.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// GET /api/auth/me — Lấy thông tin user hiện tại
// ==========================================
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('employerProfile.province', 'name slug')
      .populate('candidateProfile.province', 'name slug')
      .populate('candidateProfile.desiredWorkTypes', 'name slug icon');

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// POST /api/auth/change-password — Đổi mật khẩu
// ==========================================
router.post('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
