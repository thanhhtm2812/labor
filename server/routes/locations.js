const express  = require('express');
const router   = express.Router();
const Location = require('../models/Location');
const { protect, authorize } = require('../middleware/auth');

// GET /api/locations — Danh sách tỉnh/thành (Public)
router.get('/', async (req, res) => {
  try {
    const locations = await Location.getActiveProvinces();
    res.json({ success: true, locations });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/locations/:slug/districts — Quận/huyện theo tỉnh (Public)
router.get('/:slug/districts', async (req, res) => {
  try {
    const districts = await Location.getDistricts(req.params.slug);
    res.json({ success: true, districts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/locations — Thêm tỉnh/thành (Admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ success: true, location });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/locations/:id — Sửa tỉnh/thành (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) return res.status(404).json({ success: false, message: 'Không tìm thấy tỉnh/thành' });
    res.json({ success: true, location });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/locations/:id — Xóa tỉnh/thành (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa tỉnh/thành' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ============================================================
// QUẢN LÝ QUẬN/HUYỆN (Admin)
// ============================================================

// GET /api/locations/:id/districts — Danh sách quận/huyện theo id tỉnh (Admin)
router.get('/:id/districts/manage', protect, authorize('admin'), async (req, res) => {
  try {
    const location = await Location.findById(req.params.id).select('name districts');
    if (!location) return res.status(404).json({ success: false, message: 'Không tìm thấy tỉnh/thành' });
    res.json({ success: true, province: location.name, districts: location.districts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/locations/:id/districts — Thêm quận/huyện vào tỉnh (Admin)
router.post('/:id/districts', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug)
      return res.status(400).json({ success: false, message: 'Tên và slug là bắt buộc' });

    // Kiểm tra slug trùng
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Không tìm thấy tỉnh/thành' });

    const exists = location.districts.some(d => d.slug === slug.toLowerCase().trim());
    if (exists) return res.status(409).json({ success: false, message: `Slug "${slug}" đã tồn tại trong tỉnh này` });

    const updated = await Location.findByIdAndUpdate(
      req.params.id,
      { $push: { districts: { name: name.trim(), slug: slug.toLowerCase().trim(), isActive: true } } },
      { new: true }
    );
    const newDistrict = updated.districts[updated.districts.length - 1];
    res.status(201).json({ success: true, message: 'Thêm quận/huyện thành công', district: newDistrict, province: updated });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/locations/:id/districts/:districtId — Sửa quận/huyện (Admin)
router.put('/:id/districts/:districtId', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, slug, isActive } = req.body;
    const setObj = {};
    if (name     !== undefined) setObj['districts.$.name']     = name.trim();
    if (slug     !== undefined) setObj['districts.$.slug']     = slug.toLowerCase().trim();
    if (isActive !== undefined) setObj['districts.$.isActive'] = isActive;

    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, 'districts._id': req.params.districtId },
      { $set: setObj },
      { new: true }
    );
    if (!location) return res.status(404).json({ success: false, message: 'Không tìm thấy quận/huyện' });

    const district = location.districts.id(req.params.districtId);
    res.json({ success: true, message: 'Cập nhật quận/huyện thành công', district });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/locations/:id/districts/:districtId — Xóa quận/huyện (Admin)
router.delete('/:id/districts/:districtId', protect, authorize('admin'), async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { $pull: { districts: { _id: req.params.districtId } } },
      { new: true }
    );
    if (!location) return res.status(404).json({ success: false, message: 'Không tìm thấy tỉnh/thành' });
    res.json({ success: true, message: 'Đã xóa quận/huyện' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
