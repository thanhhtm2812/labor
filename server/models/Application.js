const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String },
  resumeUrl:   { type: String },
  cvId:        { type: mongoose.Schema.Types.ObjectId },   // ID của CV trong candidateProfile.cvList
  images:      [{ type: String }],                           // Ảnh đính kèm (nếu có)

  // Trạng thái do NHÀ TUYỂN DỤNG cập nhật
  status: {
    type: String,
    enum: [
      'pending',    // Chờ xem xét (mặc định)
      'viewed',     // Đã xem
      'accepted',   // Đã tiếp nhận / Mời phỏng vấn
      'rejected'    // Từ chối
    ],
    default: 'pending'
  },
  employerNote: { type: String },   // Ghi chú nội bộ của nhà tuyển dụng
  viewedAt:     { type: Date },     // Thời điểm employer mở xem
  respondedAt:  { type: Date },     // Thời điểm accepted/rejected
}, { timestamps: true });

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
