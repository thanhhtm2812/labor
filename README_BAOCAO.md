# 🚀 LaborConnect — Nền tảng Tuyển dụng & Tìm việc làm

Hệ thống kết nối Nhà tuyển dụng và Ứng viên, hỗ trợ đăng tin, nộp hồ sơ, tạo CV trực tuyến và quy trình xác minh kinh nghiệm làm việc.

## 📁 Cấu trúc dự án

```
labor-connect/

+ server/                          # Backend Node.js + Express
++ index.js                     # Entry point, kết nối MongoDB, seed data
++ package.json                 # Dependencies
++ .env                 # Biến môi trường

++ middleware/
+++ auth.js                  # JWT protect, authorize, generateToken
+++ upload.js                # Multer + Cloudinary upload

++ models/
+++ User.js                  # Ứng viên & Nhà tuyển dụng (logo, description HTML, videoUrl)
+++ Location.js              # Danh mục địa chính DÙNG CHUNG (Tỉnh → Quận)
+++ WorkType.js              # Danh mục hình thức việc làm DÙNG CHUNG
+++ Job.js                   # Tin tuyển dụng (ref Location, WorkType)
+++ Application.js           # Đơn ứng tuyển
+ Invitation.js            # Model: Lời mời ứng tuyển (Employer → Candidate)

++ routes/
+++ auth.js                  # /register, /login, /me, /change-password
+++ users.js                 # Upload logo, cập nhật profile
+++ jobs.js                  # CRUD + lọc địa chính + workType
+++ locations.js             # CRUD địa chính (Admin)
+++ workTypes.js             # CRUD hình thức việc làm (Admin)
+++ admin.js                 # Duyệt tin, quản lý user, thống kê

+ client/                          # Frontend HTML + Tailwind CSS
++ index.html                   # Trang chủ tìm kiếm & lọc việc làm
++ login.html                   # Đăng nhập
++ register.html                # Đăng ký (Ứng viên / Nhà tuyển dụng)
++ job-detail.html              # Chi tiết tin tuyển dụng + ứng tuyển
++ company-profile.html         # Hồ sơ công ty (Logo, Video YouTube, Gallery)
++ dashboard-employer.html      # Dashboard nhà tuyển dụng
++ admin.html                   # Admin panel
++ dashboard-candidate.html      # Dashboard cho Ứng viên (Quản lý CV, Việc đã ứng tuyển)
```

---

## ⚙️ Cài đặt & Chạy dự án

### Yêu cầu hệ thống
- Node.js >= 16.x
- MongoDB (local hoặc Atlas)
- (Tùy chọn) Tài khoản Cloudinary để upload ảnh

### Bước 1: Cài dependencies

```bash
cd server
npm install
```

### Bước 2: Cấu hình môi trường

```bash
cp .env.example .env
```

Mở file `.env` và điền các giá trị:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/labor_connect
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Cloudinary (để upload ảnh logo/avatar)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:3000
```

> **Lưu ý:** Nếu chưa có Cloudinary, server vẫn chạy được nhưng upload ảnh sẽ dùng placeholder.

### Bước 3: Chạy server

```bash
# Development (tự reload)
http-server -p 3000
npm run dev

# Production
npm start
```

Server khởi động tại: `http://localhost:5000`

Kiểm tra: `http://localhost:5000/api/health`

> Lần đầu khởi động, server sẽ tự **seed dữ liệu mặc định**:
> - 6 hình thức việc làm (Full-time, Part-time, Remote, Internship, Contract, Freelance)
> - 4 tỉnh/thành (TP.HCM, Hà Nội, Đà Nẵng, Cần Thơ) với các quận/huyện

### Bước 4: Mở Frontend

Dùng **Live Server** (VS Code extension) hoặc bất kỳ HTTP server:

```bash
# Cài http-server toàn cục (nếu chưa có)
npm install -g http-server

# Chạy từ thư mục client

cd labor-connect/client

http-server -p 3000
npm run dev
```

Mở trình duyệt: `http://localhost:3000`

---

## 🔑 Tài khoản Admin

Để tạo tài khoản Admin, chạy lệnh trong MongoDB shell hoặc dùng script:

```javascript
// Trong MongoDB shell hoặc Compass
db.users.insertOne({
  email: "admin@laborconnect.vn",
  password: "$2a$12$...",  // hash của "Admin@123"
  role: "admin",
  isActive: true,
  createdAt: new Date()
})
```

Hoặc tạo một file `server/scripts/createAdmin.js`:

```bash
node server/scripts/createAdmin.js
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| GET  | `/api/auth/me` | Thông tin user hiện tại |
| POST | `/api/auth/change-password` | Đổi mật khẩu |

### Jobs
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/jobs` | Danh sách + lọc (`province`, `district`, `workTypes`, `keyword`) |
| GET  | `/api/jobs/:id` | Chi tiết tin |
| POST | `/api/jobs` | Đăng tin (Employer) |
| PUT  | `/api/jobs/:id` | Sửa tin (Employer) |
| DELETE | `/api/jobs/:id` | Xóa tin (Employer/Admin) |
| POST | `/api/jobs/:id/apply` | Ứng tuyển (Candidate) |
| GET  | `/api/jobs/employer/my-jobs` | Tin của employer đang đăng nhập |

### Employer Profile
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/users/employer/:id` | Xem hồ sơ công ty (Public) |
| PUT  | `/api/users/employer/profile` | Cập nhật hồ sơ |
| POST | `/api/users/employer/logo` | Upload logo |
| POST | `/api/users/employer/gallery` | Upload ảnh gallery |

### Danh mục (DÙNG CHUNG)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/locations` | Danh sách tỉnh/thành (Public) |
| GET  | `/api/locations/:slug/districts` | Quận/huyện theo tỉnh (Public) |
| GET  | `/api/worktypes` | Danh sách hình thức việc làm (Public) |

### Admin
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/admin/jobs` | Tất cả tin (lọc theo status) |
| PUT  | `/api/admin/jobs/:id/approve` | Duyệt tin |
| PUT  | `/api/admin/jobs/:id/reject` | Từ chối tin |
| PUT  | `/api/admin/jobs/:id/highlight` | Bật/tắt tin nổi bật |
| GET  | `/api/admin/users` | Danh sách người dùng |
| PUT  | `/api/admin/users/:id/toggle-active` | Khóa/mở tài khoản |
| GET  | `/api/admin/stats` | Thống kê tổng quan |

---

## 🏗️ Thiết kế đồng nhất dữ liệu

Đây là điểm cốt lõi của hệ thống:

```
Location (Tỉnh/Thành/Quận/Huyện)
    ↑ ref
Job.province ←——→ User.candidateProfile.province
Job.district  ←——→ User.candidateProfile.district (slug)

WorkType (Full-time, Part-time, Remote...)
    ↑ ref
Job.workTypes[] ←——→ User.candidateProfile.desiredWorkTypes[]
```

Cả **Nhà tuyển dụng** và **Ứng viên** đều chọn từ cùng một bộ danh mục `Location` và `WorkType`. Điều này đảm bảo khi lọc `jobs?province=<ObjectId>&workTypes=<ObjectId>`, kết quả luôn chính xác.

---

## 📦 Dependencies chính

| Package | Mục đích |
|---------|----------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `bcryptjs` | Hash password |
| `jsonwebtoken` | JWT authentication |
| `multer` | Xử lý file upload |
| `cloudinary` | Lưu trữ ảnh trên cloud |
| `express-validator` | Validate input API |
| `cors` | Cross-Origin Resource Sharing |
| `morgan` | HTTP request logger |
| `dotenv` | Quản lý biến môi trường |

---

## 🔮 Hướng phát triển tiếp theo

- [ ] Tích hợp **Rich Text Editor** (TinyMCE / Quill) cho mô tả công ty và công việc
- [ ] **Email notification** khi có ứng viên nộp hồ sơ (Nodemailer)
- [ ] **Full-text search** với Elasticsearch hoặc MongoDB Atlas Search
- [ ] **CV Builder** — Tạo CV trực tuyến từ profile ứng viên
- [ ] **Chat realtime** giữa ứng viên và nhà tuyển dụng (Socket.IO)
- [ ] **Gợi ý việc làm** dựa trên kỹ năng ứng viên (Machine Learning)
- [ ] Nâng cấp Frontend lên **React / Vue**
- [ ] **Docker** compose cho deployment dễ dàng
