const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ==========================================
// SUB-SCHEMA: Skill (Kỹ năng chi tiết)
// ==========================================
const skillSchema = new mongoose.Schema({
  name:         { type: String, trim: true, required: true },
  level:        { type: String, enum: ['basic','intermediate','advanced','expert'], default: 'intermediate' },
  certificate:  { type: String },          // Tên chứng chỉ liên quan
  certUrl:      { type: String },          // Link chứng chỉ
  images:       [{ type: String }],        // Ảnh minh họa kỹ năng
  projects:     [{ type: String }],        // Danh sách dự án thực tế đã dùng kỹ năng này
  from:         { type: Date },            // Thời gian bắt đầu học/làm kỹ năng này
  to:           { type: Date },            // Thời gian kết thúc (hoặc null nếu đến nay)
}, { _id: true });

// ==========================================
// SUB-SCHEMA: Education (Học vấn) — có xác minh
// ==========================================
const educationSchema = new mongoose.Schema({
  school:       { type: String },
  degree:       { type: String },
  major:        { type: String },
  gpa:          { type: Number, min: 0, max: 4 },
  from:         { type: Date },
  to:           { type: Date },
  isCurrent:    { type: Boolean, default: false },
  description:  { type: String },
  images:       [{ type: String }],         // Tối đa 3 ảnh bằng cấp/transcript
  // Xác minh
  verifyStatus: { type: String, enum: ['unverified','pending','verified','rejected'], default: 'unverified' },
  verifyNote:   { type: String },
  verifiedAt:   { type: Date },
  verifiedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: true });

// ==========================================
// SUB-SCHEMA: Experience (Kinh nghiệm) — có xác minh, employer phê duyệt
// ==========================================
const experienceSchema = new mongoose.Schema({
  company:      { type: String },
  position:     { type: String },
  description:  { type: String },
  from:         { type: Date },
  to:           { type: Date },
  isCurrent:    { type: Boolean, default: false },
  // Xác minh
  verifyStatus: {
    type: String,
    enum: ['unverified','pending_admin','pending_employer','verified','rejected'],
    default: 'unverified'
  },
  verifyNote:        { type: String },
  verifiedAt:        { type: Date },
  verifiedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin hoặc employer
  assignedEmployer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // employer được giao xác minh
}, { _id: true });

// ==========================================
// SUB-SCHEMA: CV
// ==========================================
const cvSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  summary:          { type: String },
  skills:           [skillSchema],
  education:        [educationSchema],
  experience:       [experienceSchema],
  certifications:   [{ name: String, issuer: String, issueDate: Date, url: String }],
  languages:        [{ name: String, level: { type: String, enum: ['basic','intermediate','advanced','native'] } }],
  desiredPosition:  { type: String },
  desiredSalary:    { min: Number, max: Number, currency: { type: String, default: 'VND' } },
  desiredWorkTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkType' }],
  isPublic:         { type: Boolean, default: true },
  createdAt:        { type: Date, default: Date.now },
  updatedAt:        { type: Date, default: Date.now },
}, { _id: true });

// ==========================================
// SUB-SCHEMA: Candidate Profile
// ==========================================
const candidateProfileSchema = new mongoose.Schema({
  fullName:    { type: String, trim: true },
  avatar:      { type: String, default: '' },
  phone:       { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender:      { type: String, enum: ['male','female','other'] },
  bio:         { type: String, maxlength: 1000 },
  skills:      [skillSchema],
  education:   [educationSchema],
  experience:  [experienceSchema],
  province:         { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  district:         { type: String },
  desiredWorkTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkType' }],
  desiredSalary:    { min: Number, max: Number, currency: { type: String, default: 'VND' } },
  address:          { type: String },
  cvList:           [cvSchema],
}, { _id: false });

// ==========================================
// SUB-SCHEMA: Employer Profile
// ==========================================
const employerProfileSchema = new mongoose.Schema({
  companyName:  { type: String, trim: true },
  logo:         { type: String, default: '' },
  description:  { type: String },
  videoUrl: {
    type: String, trim: true,
    validate: {
      validator: v => !v || /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w\-]{11}/.test(v),
      message: 'videoUrl phải là link YouTube hợp lệ'
    }
  },
  phone:        { type: String },
  website:      { type: String },
  industry:     { type: String },
  companySize:  { type: String, enum: ['1-10','11-50','51-200','201-500','501-1000','1000+'] },
  province:     { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  district:     { type: String },
  address:      { type: String },
  galleryImages:[{ type: String }],
  taxCode:      { type: String },
  founded:      { type: Number },
}, { _id: false });

// ==========================================
// MAIN USER SCHEMA
// ==========================================
const userSchema = new mongoose.Schema({
  email: {
    type: String, required: [true,'Email là bắt buộc'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: {
    type: String, required: [true,'Mật khẩu là bắt buộc'],
    minlength: [6,'Mật khẩu tối thiểu 6 ký tự'], select: false
  },
  role:       { type: String, enum: ['candidate','employer','admin'], required: true },
  isActive:   { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  candidateProfile: candidateProfileSchema,
  employerProfile:  employerProfileSchema,
  savedJobs:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  followedCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Dùng cho ứng viên vãng lai (walk-in)
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.virtual('displayName').get(function() {
  if (this.role === 'employer')  return this.employerProfile?.companyName || this.email;
  if (this.role === 'candidate') return this.candidateProfile?.fullName   || this.email;
  return 'Admin';
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(p) {
  return await bcrypt.compare(p, this.password);
};

userSchema.index({ role: 1 });
userSchema.index({ 'employerProfile.province': 1 });

module.exports = mongoose.model('User', userSchema);
