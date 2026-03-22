const multer = require('multer');
const path = require('path');

// ==========================================
// CẤU HÌNH MULTER (Xử lý file upload)
// ==========================================

// Lọc file: Chỉ cho phép ảnh
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname  = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
};

// Storage: Lưu vào memory buffer (sau đó upload lên Cloudinary)
const storage = multer.memoryStorage();

exports.uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }            // Giới hạn 5MB
});

// ==========================================
// HELPER: Upload lên Cloudinary
// (Gọi sau khi multer xử lý xong)
// ==========================================
exports.uploadToCloudinary = async (fileBuffer, folder = 'labor-connect') => {
  // Kiểm tra cấu hình Cloudinary
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    // Fallback: Trả về URL placeholder nếu chưa cấu hình Cloudinary
    console.warn('⚠️  Cloudinary chưa cấu hình, dùng placeholder URL');
    return 'https://ui-avatars.com/api/?name=Logo';
  }

  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    ).end(fileBuffer);
  });
};
