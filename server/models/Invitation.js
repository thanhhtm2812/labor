const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  employer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  required: true },
  message:   { type: String },
  status:    { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },

  // Lịch sử các lần phản hồi của ứng viên
  responseHistory: [{
    status: { type: String, enum: ['accepted', 'rejected'], required: true },
    message: { type: String, required: true },
    respondedAt: { type: Date, default: Date.now }
  }],

  // Trường cũ, sẽ được dọn dẹp bởi $unset trong route
  candidateMessage: { type: String },
}, { timestamps: true });

invitationSchema.index({ candidate: 1, status: 1 });
invitationSchema.index({ job: 1, candidate: 1 }, { unique: true }); // Mỗi job chỉ mời 1 lần

module.exports = mongoose.model('Invitation', invitationSchema);