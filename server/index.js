require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// ==========================================
// KIỂM TRA BIẾN MÔI TRƯỜNG
// ==========================================
if (!process.env.MONGO_URI) {
  console.warn('⚠️  Không tìm thấy MONGO_URI trong .env — dùng giá trị mặc định localhost');
  process.env.MONGO_URI = 'mongodb://localhost:27017/labor_connect';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'laborconnect_default_secret_change_in_production';
}
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Phục vụ file tĩnh (ảnh upload nội bộ nếu không dùng Cloudinary)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// KẾT NỐI MONGODB
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Kết nối MongoDB thành công');
    seedInitialData(); // Khởi tạo dữ liệu danh mục mặc định
  })
  .catch((err) => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  });

// ==========================================
// ROUTES
// ==========================================
app.use('/api/auth',      require('./routes/auth'));
app.use('/api', require('./routes/users'));
app.use('/api/jobs',      require('./routes/jobs'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/worktypes', require('./routes/workTypes'));
// Admin verification routes — mount TRƯỚC /api/admin để không bị admin router bắt mất
const { adminVerifyRouter } = require('./routes/users');
app.use('/api/admin/verifications', adminVerifyRouter);
app.use('/api/admin',     require('./routes/admin'));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 LaborConnect API đang hoạt động!',
    endpoints: {
      health:    'GET  /api/health',
      auth:      'POST /api/auth/login  |  POST /api/auth/register',
      jobs:      'GET  /api/jobs',
      locations: 'GET  /api/locations',
      workTypes: 'GET  /api/worktypes'
    },
    note: 'Frontend: mở thư mục client/ bằng Live Server'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Labor Connect API đang chạy', timestamp: new Date() });
});

// ==========================================
// XỬ LÝ LỖI TOÀN CỤC
// ==========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Lỗi server nội bộ'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route không tồn tại' });
});

// ==========================================
// SEED DỮ LIỆU BAN ĐẦU
// ==========================================
async function seedInitialData() {
  const Location = require('./models/Location');
  const WorkType = require('./models/WorkType');
  const User     = require('./models/User');

  // Seed WorkTypes nếu chưa có
  const wtCount = await WorkType.countDocuments();
  if (wtCount === 0) {
    await WorkType.insertMany([
      { name: 'Toàn thời gian', slug: 'full-time',  icon: '🕐' },
      { name: 'Bán thời gian',  slug: 'part-time',  icon: '🕑' },
      { name: 'Từ xa',          slug: 'remote',     icon: '🏠' },
      { name: 'Thực tập',       slug: 'internship', icon: '🎓' },
      { name: 'Hợp đồng',       slug: 'contract',   icon: '📄' },
      { name: 'Freelance',      slug: 'freelance',  icon: '💼' },
    ]);
    console.log('✅ Đã seed dữ liệu WorkTypes');
  }

  // Seed Locations nếu chưa có
  const locCount = await Location.countDocuments();
  if (locCount === 0) {
    const provinces = [
      { name: 'Hồ Chí Minh', slug: 'ho-chi-minh', type: 'province', districts: [
          { name: 'Quận 1',     slug: 'quan-1'     },
          { name: 'Quận 3',     slug: 'quan-3'     },
          { name: 'Quận 7',     slug: 'quan-7'     },
          { name: 'Bình Thạnh', slug: 'binh-thanh' },
          { name: 'Thủ Đức',   slug: 'thu-duc'    },
          { name: 'Gò Vấp',    slug: 'go-vap'     }
        ]
      },
      { name: 'Hà Nội', slug: 'ha-noi', type: 'province', districts: [
          { name: 'Hoàn Kiếm',  slug: 'hoan-kiem'  },
          { name: 'Đống Đa',    slug: 'dong-da'    },
          { name: 'Cầu Giấy',   slug: 'cau-giay'   },
          { name: 'Thanh Xuân', slug: 'thanh-xuan' },
          { name: 'Long Biên',  slug: 'long-bien'  }
        ]
      },
      { name: 'Đà Nẵng', slug: 'da-nang', type: 'province', districts: [
          { name: 'Hải Châu',     slug: 'hai-chau'     },
          { name: 'Thanh Khê',    slug: 'thanh-khe'    },
          { name: 'Ngũ Hành Sơn', slug: 'ngu-hanh-son' }
        ]
      },
      { name: 'Cần Thơ', slug: 'can-tho', type: 'province', districts: [
          { name: 'Ninh Kiều', slug: 'ninh-kieu' },
          { name: 'Bình Thủy', slug: 'binh-thuy' }
        ]
      },
    ];
    await Location.insertMany(provinces);
    console.log('✅ Đã seed dữ liệu Locations');
  }

  // ==========================================
  // SEED USERS MẪU (Admin, Ứng viên, Nhà tuyển dụng)
  // ==========================================
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    // Lấy province HCM để gán cho employer
    const hcm = await Location.findOne({ slug: 'ho-chi-minh' });

    const seedUsers = [
      // --- ADMIN ---
      {
        email:    'admin@laborconnect.vn',
        password: 'Admin@123',
        role:     'admin',
        isActive: true,
        isVerified: true,
      },

      // --- ỨNG VIÊN (Candidate) ---
      {
        email:    'candidate@laborconnect.vn',
        password: 'User@123',
        role:     'candidate',
        isActive: true,
        isVerified: true,
        candidateProfile: {
          fullName:    'Nguyễn Văn An',
          phone:       '0901234567',
          gender:      'male',
          bio:         'Lập trình viên với 2 năm kinh nghiệm, đam mê công nghệ web.',
          skills:      ['JavaScript', 'Node.js', 'React', 'MongoDB'],
          province:    hcm?._id,
          district:    'quan-1',
          desiredSalary: { min: 15000000, max: 25000000, currency: 'VND' },
          education: [{
            school:    'Đại học Bách Khoa TP.HCM',
            degree:    'Cử nhân',
            major:     'Công nghệ thông tin',
            from:      new Date('2018-09-01'),
            to:        new Date('2022-06-01'),
            isCurrent: false
          }],
          experience: [{
            company:     'Công ty ABC',
            position:    'Junior Developer',
            description: 'Phát triển ứng dụng web với React và Node.js',
            from:        new Date('2022-07-01'),
            isCurrent:   true
          }]
        }
      },

      // --- NHÀ TUYỂN DỤNG (Employer / HR) ---
      {
        email:    'hr@laborconnect.vn',
        password: 'Hr@123',
        role:     'employer',
        isActive: true,
        isVerified: true,
        employerProfile: {
          companyName:  'Công ty Cổ phần LaborConnect',
          phone:        '0281234567',
          website:      'https://laborconnect.vn',
          industry:     'Công nghệ thông tin',
          companySize:  '51-200',
          founded:      2020,
          province:     hcm?._id,
          district:     'quan-7',
          address:      '123 Nguyễn Văn Linh, Quận 7',
          description:  '<h2>Về chúng tôi</h2><p>LaborConnect là nền tảng kết nối việc làm hàng đầu Việt Nam, giúp ứng viên tìm được công việc phù hợp và nhà tuyển dụng tìm được nhân tài.</p><h2>Văn hóa công ty</h2><ul><li>Môi trường làm việc năng động, sáng tạo</li><li>Cơ hội thăng tiến rõ ràng</li><li>Chế độ đãi ngộ cạnh tranh</li></ul>',
          videoUrl:     'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        }
      },
    ];

    // Dùng create() từng user để trigger pre-save hook hash password
    for (const userData of seedUsers) {
      await User.create(userData);
    }

    console.log('✅ Đã seed Users mẫu:');
    console.log('   👑 Admin     — admin@laborconnect.vn     / Admin@123');
    console.log('   👤 Ứng viên  — candidate@laborconnect.vn / User@123');
    console.log('   🏢 HR/Employer — hr@laborconnect.vn      / Hr@123');
  }
}
// ==========================================
// KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📖 API Docs: http://localhost:${PORT}/api/health`);
});
