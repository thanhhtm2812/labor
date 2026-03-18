const mongoose = require('mongoose');

/**
 * MODEL: WorkType (Hình thức việc làm)
 * -------------------------------------------------------
 * Bộ danh mục HÌNH THỨC VIỆC LÀM DÙNG CHUNG cho cả:
 *  - Nhà tuyển dụng: Chọn hình thức khi đăng tin tuyển dụng (Job.workTypes)
 *  - Ứng viên: Chọn hình thức mong muốn (User.candidateProfile.desiredWorkTypes)
 * 
 * Lợi ích:
 *  - Đảm bảo tính đồng nhất khi lọc/match Job và Ứng viên.
 *  - Admin quản lý danh mục tập trung.
 */

const workTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên hình thức việc làm là bắt buộc'],
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
  icon:        { type: String, default: '💼' },       // Emoji icon hiển thị
  description: { type: String },
  isActive:    { type: Boolean, default: true },
  order:       { type: Number, default: 0 }
}, {
  timestamps: true
});

workTypeSchema.index({ isActive: 1 });

// Static: Lấy danh sách hình thức làm việc đang hoạt động
workTypeSchema.statics.getActive = function() {
  return this.find({ isActive: true })
             .select('name slug icon description')
             .sort({ order: 1, name: 1 });
};

module.exports = mongoose.model('WorkType', workTypeSchema);
