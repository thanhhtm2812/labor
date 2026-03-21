# 🚀 LaborConnect — Nền tảng Tuyển dụng & Tìm việc làm

Hệ thống kết nối Nhà tuyển dụng và Ứng viên, hỗ trợ đăng tin, nộp hồ sơ, tạo CV trực tuyến và quy trình xác minh kinh nghiệm làm việc.

## 📋 Giới thiệu dự án

**LaborConnect** là một hệ thống web ứng dụng (Web Application) được xây dựng nhằm giải quyết bài toán kết nối giữa **Nhà tuyển dụng** (Employer) và **Ứng viên tìm việc** (Candidate) một cách hiệu quả, minh bạch và có kiểm duyệt.

Hệ thống cung cấp đầy đủ các chức năng trong quy trình tuyển dụng: từ đăng tin tuyển dụng, nộp hồ sơ xin việc, tạo CV trực tuyến, đến gửi lời mời ứng tuyển và xác minh kinh nghiệm làm việc — tất cả được quản lý tập trung bởi một **Admin Panel** chuyên biệt.

### 🎯 Mục tiêu dự án

- Xây dựng nền tảng tuyển dụng trực tuyến đơn giản, dễ sử dụng phù hợp thị trường Việt Nam
- Đảm bảo chất lượng tin tuyển dụng thông qua quy trình kiểm duyệt nội dung
- Đồng nhất dữ liệu địa chính và hình thức việc làm giữa các bên (Employer, Candidate, Job)
- Tích hợp hệ thống xác minh kinh nghiệm làm việc để tăng độ tin cậy của hồ sơ ứng viên

### 🏗️ Kiến trúc hệ thống

```
┌────────────────────────────────────────────────┐
│               CLIENT (Frontend)                │
│   HTML5 + Tailwind CSS + Vanilla JavaScript    │
│   (8 trang, giao tiếp với API qua fetch())     │
└──────────────────┬─────────────────────────────┘
                   │ HTTP / REST API
┌──────────────────▼─────────────────────────────┐
│              SERVER (Backend)                  │
│        Node.js + Express.js (REST API)         │
│   Middleware: JWT Auth │ Multer │ CORS │ Morgan │
└──────────────────┬─────────────────────────────┘
                   │ Mongoose ODM
┌──────────────────▼──────────────┐  ┌───────────┐
│     MongoDB (Database)          │  │ Cloudinary│
│  Users │ Jobs │ Applications    │  │  (Images) │
│  Invitations │ Locations        │  └───────────┘
│  WorkTypes                      │
└─────────────────────────────────┘
```

---

## ✨ Tính năng chính

### 👤 Dành cho Ứng viên (Candidate)
- **Đăng ký / Đăng nhập** tài khoản ứng viên, thay đổi mật khẩu
- **Tìm kiếm & lọc việc làm** theo từ khóa, tỉnh/thành, quận/huyện, hình thức làm việc, mức lương
- **Nộp hồ sơ ứng tuyển** trực tuyến kèm cover letter và CV đính kèm
- **Tạo & quản lý CV trực tuyến** với đầy đủ thông tin học vấn, kinh nghiệm, kỹ năng, chứng chỉ
- **Xem lịch sử ứng tuyển** và theo dõi trạng thái hồ sơ
- **Nhận & phản hồi lời mời ứng tuyển** từ Nhà tuyển dụng
- **Lưu việc làm yêu thích** và theo dõi công ty quan tâm
- **Xác minh kinh nghiệm làm việc** qua hệ thống duyệt của Admin / Employer

### 🏢 Dành cho Nhà tuyển dụng (Employer)
- **Đăng ký / Đăng nhập** tài khoản doanh nghiệp
- **Quản lý hồ sơ công ty**: tên, mô tả (HTML), logo, gallery ảnh, video YouTube giới thiệu
- **Đăng tin tuyển dụng** với đầy đủ thông tin: mô tả (HTML), yêu cầu, quyền lợi, mức lương, địa điểm, hình thức
- **Quản lý tin tuyển dụng**: xem, sửa, đóng tin (tin bị từ chối mới được xóa)
- **Xem & xử lý hồ sơ ứng tuyển**: chuyển trạng thái (Chờ xét → Đã xem → Tiếp nhận / Từ chối)
- **Gửi lời mời ứng tuyển** chủ động đến ứng viên phù hợp
- **Xác minh kinh nghiệm làm việc** cho ứng viên từng làm tại công ty

### 🛡️ Dành cho Quản trị viên (Admin)
- **Kiểm duyệt tin tuyển dụng**: Duyệt / Từ chối (kèm lý do) / Bật tin nổi bật
- **Quản lý người dùng**: xem danh sách, khóa/mở tài khoản Employer và Candidate
- **Quản lý danh mục địa chính**: Tỉnh/Thành, Quận/Huyện (CRUD)
- **Quản lý hình thức việc làm**: Full-time, Part-time, Remote, Internship, Contract, Freelance (CRUD)
- **Xem thống kê tổng quan**: tổng người dùng, tin tuyển dụng, đơn ứng tuyển, hoạt động hệ thống

---

## 🛠️ Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Node.js | ≥ 16.x | Môi trường chạy JavaScript phía server |
| Express.js | 4.18.2 | Web framework, xây dựng REST API |
| MongoDB | Atlas / Local | Cơ sở dữ liệu NoSQL lưu trữ toàn bộ dữ liệu |
| Mongoose | 8.0.3 | ODM (Object Data Modeling) cho MongoDB |
| JSON Web Token (JWT) | 9.0.2 | Xác thực và phân quyền người dùng |
| bcryptjs | 2.4.3 | Mã hóa mật khẩu (hash + salt) |
| Multer | 1.4.5 | Xử lý upload file (ảnh logo, gallery) |
| Cloudinary | 1.41.3 | Lưu trữ và tối ưu ảnh trên cloud |
| express-validator | 7.0.1 | Validate dữ liệu đầu vào API |
| CORS | 2.8.5 | Xử lý Cross-Origin Resource Sharing |
| Morgan | 1.10.0 | Ghi log HTTP request |
| dotenv | 16.3.1 | Quản lý biến môi trường |
| nodemon | 3.0.2 | Tự động reload server khi phát triển |

### Frontend
| Công nghệ | Mục đích |
|---|---|
| HTML5 | Cấu trúc trang web |
| Tailwind CSS 3.x (CDN) | Thiết kế giao diện responsive, tiện ích CSS |
| Vanilla JavaScript (ES6+) | Xử lý logic UI, gọi API qua `fetch()` |
| LocalStorage | Lưu JWT token phía client |

### Dịch vụ ngoài
| Dịch vụ | Mục đích |
|---|---|
| MongoDB Atlas | Cloud database |
| Cloudinary | Cloud image storage & optimization |

---

## 📁 Cấu trúc dự án

```
labor-connect/
│
├── server/                             # Backend Node.js + Express
│   ├── index.js                        # Entry point: khởi động server, kết nối MongoDB, seed data
│   ├── package.json                    # Dependencies & scripts
│   ├── .env                            # Biến môi trường (không commit lên Git)
│   │
│   ├── middleware/
│   │   ├── auth.js                     # JWT protect, authorize theo role, generateToken
│   │   └── upload.js                   # Multer config + Cloudinary upload handler
│   │
│   ├── models/                         # Mongoose Schemas & Models
│   │   ├── User.js                     # Ứng viên & Nhà tuyển dụng (với sub-schema CV, Skills...)
│   │   ├── Job.js                      # Tin tuyển dụng (ref Location, WorkType, User)
│   │   ├── Application.js              # Đơn ứng tuyển (Candidate → Job)
│   │   ├── Invitation.js               # Lời mời ứng tuyển (Employer → Candidate)
│   │   ├── Location.js                 # Danh mục địa chính (Tỉnh → Quận/Huyện)
│   │   └── WorkType.js                 # Danh mục hình thức việc làm
│   │
│   ├── routes/                         # Express Routers
│   │   ├── auth.js                     # /api/auth — Đăng ký, đăng nhập, đổi mật khẩu
│   │   ├── users.js                    # /api — Profile, CV, ứng tuyển, lời mời, xác minh
│   │   ├── jobs.js                     # /api/jobs — CRUD tin, lọc, ứng tuyển
│   │   ├── locations.js                # /api/locations — CRUD địa chính
│   │   ├── workTypes.js                # /api/worktypes — CRUD hình thức việc làm
│   │   └── admin.js                    # /api/admin — Kiểm duyệt, thống kê, quản lý
│   │
│   └── scripts/
│       └── seed.js                     # Script tạo dữ liệu mẫu độc lập
│
└── client/                             # Frontend HTML + Tailwind CSS
    ├── index.html                      # Trang chủ: tìm kiếm & hiển thị danh sách việc làm
    ├── login.html                      # Trang đăng nhập
    ├── register.html                   # Trang đăng ký (Ứng viên / Nhà tuyển dụng)
    ├── job-detail.html                 # Chi tiết tin tuyển dụng + form ứng tuyển
    ├── company-profile.html            # Hồ sơ công ty (Logo, Video YouTube, Gallery)
    ├── dashboard-candidate.html        # Dashboard ứng viên: CV, đơn ứng tuyển, lời mời
    ├── dashboard-employer.html         # Dashboard nhà tuyển dụng: tin đăng, hồ sơ nhận được
    └── admin.html                      # Admin panel: duyệt tin, quản lý user, thống kê
```

---

## ⚙️ Cài đặt & Chạy dự án

### Yêu cầu hệ thống

- **Node.js** >= 16.x ([Tải về](https://nodejs.org))
- **MongoDB** local hoặc tài khoản [MongoDB Atlas](https://cloud.mongodb.com) (cloud)
- **Cloudinary** account *(tùy chọn — cần có để upload ảnh logo/gallery)*

### Bước 1: Clone repository

```bash
git clone https://github.com/thanhhtm2812/labor.git
cd labor
```

### Bước 2: Cài đặt dependencies (Backend)

```bash
cd server
npm install
```

### Bước 3: Cấu hình biến môi trường

Tạo file `.env` trong thư mục `server/` (hoặc sao chép từ `.env.example`):

```bash
# server/.env

# ==================================
# CẤU HÌNH SERVER
# ==================================
PORT=5000
NODE_ENV=development

# ==================================
# KẾT NỐI CƠ SỞ DỮ LIỆU
# ==================================
# MongoDB local:
MONGO_URI=mongodb://localhost:27017/labor_connect

# Hoặc MongoDB Atlas (cloud):
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/labor_connect

# ==================================
# BẢO MẬT JWT
# ==================================
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRES_IN=7d

# ==================================
# CLOUDINARY (tùy chọn - để upload ảnh)
# ==================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ==================================
# FRONTEND URL (CORS)
# ==================================
CLIENT_URL=http://localhost:3000
```

> **Lưu ý:** Nếu chưa có Cloudinary, server vẫn chạy được — chức năng upload ảnh sẽ dùng ảnh placeholder.

### Bước 4: Khởi động Backend Server

```bash
# Chế độ phát triển (tự động reload khi có thay đổi)
npm run dev

# Chế độ production
npm start
```

Server khởi động tại: **`http://localhost:5000`**

Kiểm tra hoạt động: **`http://localhost:5000/api/health`**

> **Seed dữ liệu tự động:** Lần đầu khởi động, server tự động tạo dữ liệu mặc định:
> - 6 hình thức việc làm (Full-time, Part-time, Remote, Internship, Contract, Freelance)
> - 4 tỉnh/thành (TP.HCM, Hà Nội, Đà Nẵng, Cần Thơ) với các quận/huyện tương ứng
> - 3 tài khoản mẫu: Admin, Ứng viên, Nhà tuyển dụng

### Bước 5: Chạy Frontend

Dùng **Live Server** (VS Code extension) hoặc bất kỳ HTTP server:

```bash
# Cài http-server toàn cục (nếu chưa có)
npm install -g http-server

# Chạy từ thư mục client
cd ../client
http-server -p 3000
```

Mở trình duyệt: **`http://localhost:3000`**

---

## 🔑 Tài khoản mặc định (Seed Data)

Khi lần đầu khởi động server, hệ thống tự động tạo 3 tài khoản mẫu:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| 👑 Quản trị viên | `admin@laborconnect.vn` | `Admin@123` |
| 👤 Ứng viên | `candidate@laborconnect.vn` | `User@123` |
| 🏢 Nhà tuyển dụng | `hr@laborconnect.vn` | `Hr@123` |

---

## 🌐 Tài liệu API

**Base URL:** `http://localhost:5000/api`

**Authentication:** Bearer Token (JWT)
```
Authorization: Bearer <token>
```

---

### 🔐 Auth — Xác thực

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Đăng ký tài khoản mới (candidate / employer) |
| `POST` | `/auth/login` | Public | Đăng nhập, nhận JWT token |
| `GET` | `/auth/me` | 🔒 Token | Lấy thông tin tài khoản đang đăng nhập |
| `POST` | `/auth/change-password` | 🔒 Token | Đổi mật khẩu |

**Ví dụ đăng ký:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "123456",
  "role": "candidate",
  "fullName": "Nguyễn Văn A"
}
```

**Ví dụ đăng nhập:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "123456"
}
```

---

### 💼 Jobs — Tin tuyển dụng

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/jobs` | Public | Danh sách + lọc tin (có phân trang) |
| `GET` | `/jobs/:id` | Public | Chi tiết tin tuyển dụng |
| `POST` | `/jobs` | 🏢 Employer | Đăng tin tuyển dụng mới |
| `PUT` | `/jobs/:id` | 🏢 Employer | Sửa tin (tin sẽ về trạng thái `pending`) |
| `DELETE` | `/jobs/:id` | 🏢 Employer / Admin | Xóa tin (Employer chỉ xóa được tin bị từ chối) |
| `POST` | `/jobs/:id/apply` | 👤 Candidate | Nộp đơn ứng tuyển |
| `GET` | `/jobs/employer/my-jobs` | 🏢 Employer | Danh sách tin của employer đang đăng nhập |

**Query parameters cho GET `/jobs`:**
```
GET /api/jobs?keyword=lập trình&province=<ObjectId>&district=quan-1&workTypes=<id1>,<id2>&salaryMin=10000000&page=1&limit=12
```

---

### 👥 Users — Hồ sơ & Quản lý

#### Nhà tuyển dụng (Employer)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/employer/:id` | Public | Xem hồ sơ công ty |
| `PUT` | `/employer/profile` | 🏢 Employer | Cập nhật thông tin công ty |
| `POST` | `/employer/logo` | 🏢 Employer | Upload logo công ty |
| `POST` | `/employer/gallery` | 🏢 Employer | Upload ảnh gallery (tối đa 6 ảnh) |
| `GET` | `/employer/applications` | 🏢 Employer | Xem hồ sơ ứng tuyển vào tin của mình |
| `PUT` | `/employer/applications/:appId/status` | 🏢 Employer | Cập nhật trạng thái hồ sơ |

#### Ứng viên (Candidate)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `PUT` | `/candidate/profile` | 👤 Candidate | Cập nhật hồ sơ cá nhân |
| `POST` | `/candidate/avatar` | 👤 Candidate | Upload ảnh đại diện |
| `GET` | `/candidate/applications` | 👤 Candidate | Xem danh sách đơn đã nộp |
| `POST` | `/candidate/cv` | 👤 Candidate | Tạo CV mới |
| `PUT` | `/candidate/cv/:cvId` | 👤 Candidate | Cập nhật CV |
| `DELETE` | `/candidate/cv/:cvId` | 👤 Candidate | Xóa CV |

#### Lời mời ứng tuyển (Invitations)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/invitations` | 🏢 Employer | Gửi lời mời đến ứng viên |
| `GET` | `/candidate/invitations` | 👤 Candidate | Xem lời mời nhận được |
| `PUT` | `/invitations/:id/respond` | 👤 Candidate | Chấp nhận / Từ chối lời mời |
| `GET` | `/employer/invitations` | 🏢 Employer | Xem các lời mời đã gửi |

---

### 🗂️ Danh mục dùng chung

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/locations` | Public | Danh sách tỉnh/thành phố |
| `GET` | `/locations/:slug/districts` | Public | Quận/huyện theo tỉnh |
| `POST` | `/locations` | 🛡️ Admin | Thêm tỉnh/thành mới |
| `PUT` | `/locations/:id` | 🛡️ Admin | Sửa địa danh |
| `DELETE` | `/locations/:id` | 🛡️ Admin | Xóa địa danh |
| `GET` | `/worktypes` | Public | Danh sách hình thức việc làm |
| `POST` | `/worktypes` | 🛡️ Admin | Thêm hình thức mới |
| `PUT` | `/worktypes/:id` | 🛡️ Admin | Sửa hình thức |
| `DELETE` | `/worktypes/:id` | 🛡️ Admin | Xóa hình thức |

---

### 🛡️ Admin — Quản trị hệ thống

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/admin/jobs` | 🛡️ Admin | Tất cả tin tuyển dụng (có lọc theo status) |
| `PUT` | `/admin/jobs/:id/approve` | 🛡️ Admin | Duyệt tin |
| `PUT` | `/admin/jobs/:id/reject` | 🛡️ Admin | Từ chối tin (kèm lý do) |
| `PUT` | `/admin/jobs/:id/highlight` | 🛡️ Admin | Bật / Tắt tin nổi bật |
| `GET` | `/admin/users` | 🛡️ Admin | Danh sách người dùng (lọc theo role) |
| `PUT` | `/admin/users/:id/toggle-active` | 🛡️ Admin | Khóa / Mở tài khoản |
| `GET` | `/admin/stats` | 🛡️ Admin | Thống kê tổng quan hệ thống |
| `GET` | `/admin/verifications` | 🛡️ Admin | Xem yêu cầu xác minh kinh nghiệm |
| `PUT` | `/admin/verifications/:userId/experience/:expId` | 🛡️ Admin | Phê duyệt / Từ chối xác minh |

---

## 🗃️ Thiết kế Cơ sở dữ liệu

### Sơ đồ quan hệ các Collection

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│    User     │      │     Job     │      │ Application  │
│─────────────│      │─────────────│      │──────────────│
│ _id         │◄─────│ employer    │      │ _id          │
│ email       │      │ title       │◄─────│ job          │
│ password    │      │ description │      │ candidate    │──►User
│ role        │      │ province    │──►Loc│ coverLetter  │
│ isActive    │      │ district    │      │ cvId         │
│ candidateProfile│  │ workTypes[] │──►WT │ status       │
│  └cvList[]  │      │ salary      │      └──────────────┘
│  └skills[]  │      │ status      │
│  └education[]│     │ isHighlight │      ┌──────────────┐
│  └experience[]│    │ viewCount   │      │  Invitation  │
│ employerProfile│   └─────────────┘      │──────────────│
│  └logo      │                           │ employer ────│──►User
│  └gallery[] │      ┌─────────────┐      │ candidate ───│──►User
│  └videoUrl  │      │  Location   │      │ job ─────────│──►Job
│ savedJobs[] │      │─────────────│      │ message      │
└─────────────┘      │ name        │      │ status       │
                     │ slug        │      │ responseHistory│
                     │ type        │      └──────────────┘
                     │ districts[] │
                     └─────────────┘      ┌─────────────┐
                                          │  WorkType   │
                                          │─────────────│
                                          │ name        │
                                          │ slug        │
                                          │ icon        │
                                          └─────────────┘
```

### 🔗 Nguyên tắc đồng nhất dữ liệu (Data Consistency)

Đây là điểm thiết kế cốt lõi của hệ thống:

```
Location (Tỉnh / Quận)            WorkType (Hình thức việc làm)
       ↑ ref ObjectId                      ↑ ref ObjectId
       │                                   │
Job.province ◄──────────────► User.candidateProfile.province
Job.district (slug)             User.candidateProfile.district (slug)
Job.workTypes[] ◄──────────► User.candidateProfile.desiredWorkTypes[]
```

Cả **Nhà tuyển dụng** và **Ứng viên** đều chọn từ cùng một bộ danh mục `Location` và `WorkType` do Admin quản lý tập trung. Nhờ đó, các truy vấn lọc tin như:
```
GET /api/jobs?province=<ObjectId>&workTypes=<ObjectId>
```
luôn cho kết quả chính xác và nhất quán.

### 📊 Chi tiết các Collection

#### Collection `users`
```javascript
{
  email: String,               // Unique, lowercase
  password: String,            // bcrypt hash (select: false)
  role: "candidate" | "employer" | "admin",
  isActive: Boolean,
  isVerified: Boolean,
  candidateProfile: {
    fullName, avatar, phone, dateOfBirth, gender, bio,
    skills: [{ name, level, certificate, certUrl, projects[] }],
    education: [{ school, degree, major, gpa, from, to, images[], verifyStatus }],
    experience: [{ company, position, description, from, to, verifyStatus, assignedEmployer }],
    province: ObjectId,        // ref: Location
    district: String,          // slug
    desiredWorkTypes: [ObjectId], // ref: WorkType
    desiredSalary: { min, max, currency },
    cvList: [CV]               // Danh sách CV trực tuyến
  },
  employerProfile: {
    companyName, logo, description, videoUrl, phone, website,
    industry, companySize, province, district, address,
    galleryImages[], taxCode, founded
  },
  savedJobs: [ObjectId],
  followedCompanies: [ObjectId]
}
```

#### Collection `jobs`
```javascript
{
  title: String,
  slug: String,                // Auto-generated từ title
  description: String,         // HTML rich text
  requirements: String,        // HTML
  benefits: String,            // HTML
  employer: ObjectId,          // ref: User
  category: String,
  positions: Number,
  experience: "no-experience" | "under-1-year" | "1-3-years" | ...,
  education: "any" | "high-school" | "university" | ...,
  salary: { min, max, currency, isNegotiate, period },
  province: ObjectId,          // ref: Location
  district: String,            // slug
  address: String,
  workTypes: [ObjectId],       // ref: WorkType
  status: "pending" | "approved" | "rejected" | "expired" | "closed",
  adminNote: String,
  expiresAt: Date,
  isHighlight: Boolean,
  viewCount: Number,
  applyCount: Number
}
```

---

## 🔒 Bảo mật

- **Mã hóa mật khẩu:** bcryptjs với cost factor 12 (pre-save hook Mongoose)
- **Xác thực:** JWT (JSON Web Token) với thời hạn 7 ngày
- **Phân quyền:** Middleware `authorize()` kiểm tra role trước mỗi route nhạy cảm
- **Validate đầu vào:** `express-validator` kiểm tra tất cả dữ liệu từ client
- **CORS:** Chỉ cho phép domain được cấu hình trong `CLIENT_URL`
- **Giới hạn kích thước request:** 10MB (chống upload file quá lớn)
- **Bảo vệ dữ liệu:** Trường `password` luôn có `select: false` trong query

---

## 🌊 Luồng hoạt động hệ thống

### Luồng đăng tin & kiểm duyệt
```
Employer đăng tin → status: "pending"
         ↓
Admin xem xét → [Duyệt] status: "approved" → Hiện trên trang chủ
              → [Từ chối] status: "rejected" + adminNote → Employer nhận thông báo
```

### Luồng ứng tuyển
```
Candidate xem tin → Nộp đơn → Application: status "pending"
                                    ↓
                    Employer xem → status "viewed"
                                    ↓
                    Employer quyết định → "accepted" (Mời phỏng vấn)
                                        → "rejected"
```

### Luồng lời mời ứng tuyển
```
Employer tìm ứng viên → Gửi lời mời (Invitation: "pending")
                               ↓
Candidate nhận lời mời → Chấp nhận → Invitation: "accepted"
                        → Từ chối  → Invitation: "rejected"
```

### Luồng xác minh kinh nghiệm
```
Candidate thêm kinh nghiệm → verifyStatus: "unverified"
         ↓
Gửi yêu cầu xác minh → "pending_admin"
         ↓
Admin giao cho Employer → "pending_employer"
         ↓
Employer xác nhận → "verified"
Employer từ chối  → "rejected"
```

---

## 🗺️ Giao diện người dùng

| Trang | File | Mô tả |
|---|---|---|
| Trang chủ | `index.html` | Tìm kiếm, lọc, hiển thị danh sách việc làm |
| Đăng nhập | `login.html` | Form đăng nhập, lưu token vào LocalStorage |
| Đăng ký | `register.html` | Đăng ký tài khoản, chọn vai trò Candidate/Employer |
| Chi tiết việc làm | `job-detail.html` | Xem mô tả đầy đủ + form nộp đơn |
| Hồ sơ công ty | `company-profile.html` | Giới thiệu công ty, video, gallery ảnh |
| Dashboard Ứng viên | `dashboard-candidate.html` | Quản lý CV, đơn ứng tuyển, lời mời |
| Dashboard Nhà tuyển dụng | `dashboard-employer.html` | Quản lý tin, xem hồ sơ ứng tuyển |
| Admin Panel | `admin.html` | Kiểm duyệt tin, quản lý user, thống kê |

---

## 🔮 Hướng phát triển

- **Rich Text Editor:** Tích hợp TinyMCE hoặc Quill.js cho mô tả công ty và công việc
- **Email Notification:** Gửi email thông báo khi có hồ sơ ứng tuyển, kết quả duyệt tin (Nodemailer)
- **Full-text Search:** Tích hợp Elasticsearch hoặc MongoDB Atlas Search nâng cao
- **CV Builder:** Tạo CV trực tuyến đẹp, xuất PDF từ dữ liệu ứng viên
- **Chat Realtime:** Nhắn tin trực tiếp giữa Ứng viên và Nhà tuyển dụng (Socket.IO)
- **Gợi ý việc làm:** Hệ thống đề xuất dựa trên kỹ năng và mong muốn ứng viên (AI/ML)
- **Nâng cấp Frontend:** Chuyển sang React.js hoặc Vue.js để tăng tính tương tác
- **Docker:** Đóng gói toàn bộ hệ thống để triển khai dễ dàng
- **Unit Testing:** Viết test cases cho API với Jest + Supertest
- **CI/CD Pipeline:** Tự động hóa kiểm thử và triển khai

---

## 📜 Giấy phép

Dự án được phát triển phục vụ mục đích học thuật — **Niên luận tốt nghiệp**.

---

## 👨‍💻 Tác giả

**Huỳnh Thị Mỹ Thanh**

- GitHub: [@thanhhtm2812](https://github.com/thanhhtm2812)
- Repository: [github.com/thanhhtm2812/labor](https://github.com/thanhhtm2812/labor)

---
