const mongoose = require('mongoose');

/**
 * MODEL: Location (Địa chính)
 * -------------------------------------------------------
 * Bộ danh mục ĐỊA CHÍNH DÙNG CHUNG cho cả Ứng viên và Nhà tuyển dụng.
 * Cấu trúc 2 cấp: Tỉnh/Thành → Quận/Huyện (nhúng trong districts[])
 * 
 * Lợi ích:
 *  - Đảm bảo tính đồng nhất khi lọc Job theo địa chỉ.
 *  - Admin quản lý danh mục tập trung, không bị sai lệch tên.
 */

const districtSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  slug:      { type: String, required: true, trim: true, lowercase: true },
  isActive:  { type: Boolean, default: true }
}, { _id: true });

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên tỉnh/thành là bắt buộc'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  type:     { type: String, enum: ['province', 'city'], default: 'province' },
  code:     { type: String },                        // Mã tỉnh/thành theo chuẩn ĐVHC
  region:   {
    type: String,
    enum: ['north', 'central', 'south'],             // Miền Bắc/Trung/Nam
  },
  districts: [districtSchema],                       // Danh sách quận/huyện
  isActive:  { type: Boolean, default: true },
  order:     { type: Number, default: 0 }            // Thứ tự hiển thị
}, {
  timestamps: true
});

// Index để query nhanh
locationSchema.index({ isActive: 1, order: 1 });

// Static: Lấy danh sách tỉnh/thành đang hoạt động
locationSchema.statics.getActiveProvinces = function() {
  return this.find({ isActive: true })
             .select('name slug type region districts')
             .sort({ order: 1, name: 1 });
};

// Static: Lấy quận/huyện theo slug tỉnh
locationSchema.statics.getDistricts = async function(provinceSlug) {
  const province = await this.findOne({ slug: provinceSlug, isActive: true });
  if (!province) return [];
  return province.districts.filter(d => d.isActive);
};

module.exports = mongoose.model('Location', locationSchema);
