const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  filename: { type: String, required: true }, // Tên file trong thư mục upload/templates
  path: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  forRole: { type: String, enum: ['candidate', 'employer'], default: 'candidate' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Template', templateSchema);