const mongoose = require('mongoose');

/**
 * MODEL: Job (Tin tuyển dụng)
 * -------------------------------------------------------
 * Liên kết với:
 *  - User (employer): Công ty đăng tin
 *  - Location: Địa chỉ làm việc (Tỉnh/Thành)
 *  - WorkType[]: Hình thức việc làm (1 job có thể có nhiều hình thức)
 */

const jobSchema = new mongoose.Schema({
  // ==========================================
  // THÔNG TIN CƠ BẢN
  // ==========================================
  title: {
    type: String,
    required: [true, 'Tiêu đề công việc là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề tối đa 200 ký tự']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Mô tả công việc là bắt buộc']       // Hỗ trợ HTML (Rich Text)
  },
  requirements:   { type: String },                         // Yêu cầu ứng viên (HTML)
  benefits:       { type: String },                         // Quyền lợi (HTML)

  // ==========================================
  // THÔNG TIN TUYỂN DỤNG
  // ==========================================
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Nhà tuyển dụng là bắt buộc']
  },
  category:    { type: String, trim: true },               // Ngành nghề
  positions:   { type: Number, default: 1, min: 1 },       // Số lượng tuyển
  experience: {
    type: String,
    enum: ['no-experience', 'under-1-year', '1-3-years', '3-5-years', 'over-5-years'],
    default: 'no-experience'
  },
  education: {
    type: String,
    enum: ['any', 'high-school', 'college', 'university', 'postgraduate'],
    default: 'any'
  },

  // ==========================================
  // LƯƠNG
  // ==========================================
  salary: {
    min:         { type: Number },
    max:         { type: Number },
    currency:    { type: String, default: 'VND' },
    isNegotiate: { type: Boolean, default: false },        // Thỏa thuận
    period:      { type: String, enum: ['month', 'hour', 'project'], default: 'month' }
  },

  // ==========================================
  // ĐỊA CHỈ — ref đến danh mục Location (ĐỒI NHẤT DỮ LIỆU)
  // ==========================================
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Tỉnh/Thành phố là bắt buộc']
  },
  district:    { type: String },                           // slug quận/huyện
  address:     { type: String },                           // Địa chỉ chi tiết

  // ==========================================
  // HÌNH THỨC LÀM VIỆC — ref đến danh mục WorkType (ĐỒI NHẤT DỮ LIỆU)
  // ==========================================
  workTypes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkType',
    required: true
  }],

  // ==========================================
  // TRẠNG THÁI & KIỂM DUYỆT
  // ==========================================
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired', 'closed'],
    default: 'pending'
  },
  adminNote:    { type: String },                          // Ghi chú từ Admin khi từ chối
  expiresAt:    { type: Date },                            // Ngày hết hạn tin
  isHighlight:  { type: Boolean, default: false },         // Tin nổi bật (Admin bật)
  viewCount:    { type: Number, default: 0 },
  applyCount:   { type: Number, default: 0 },

}, {
  timestamps: true,
  toJSON:  { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// VIRTUAL: Kiểm tra tin còn hạn
// ==========================================
jobSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// ==========================================
// PRE-SAVE: Tự động tạo slug từ title
// ==========================================
jobSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // Bỏ dấu tiếng Việt
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now();
  }
  next();
});

// ==========================================
// INDEX
// ==========================================
jobSchema.index({ province: 1, district: 1 });
jobSchema.index({ workTypes: 1 });
jobSchema.index({ status: 1, expiresAt: 1 });
jobSchema.index({ employer: 1 });
jobSchema.index({ title: 'text', description: 'text' });  // Full-text search

module.exports = mongoose.model('Job', jobSchema);
