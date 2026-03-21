@startuml LaborConnect_Architecture

' ============================================================
' LABORCONNECT — Sơ đồ Kiến trúc Hệ thống
' ============================================================

!include <C4/C4_Container>

skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam shadowing false
skinparam linetype ortho
skinparam ArrowColor #555555
skinparam ArrowThickness 1.5

skinparam rectangle {
  BackgroundColor #F0F4FF
  BorderColor #4A90D9
  BorderThickness 2
  FontSize 13
  RoundCorner 10
}

skinparam database {
  BackgroundColor #FFF8E7
  BorderColor #F5A623
  BorderThickness 2
}

skinparam cloud {
  BackgroundColor #F0FFF4
  BorderColor #7ED321
  BorderThickness 2
}

skinparam actor {
  BackgroundColor #EEF2FF
  BorderColor #6366F1
}

skinparam note {
  BackgroundColor #FFFDE7
  BorderColor #FFC107
}

' ============================================================
' ACTORS — Người dùng
' ============================================================

actor "👤 Ứng viên\n(Candidate)" as Candidate #EEF2FF
actor "🏢 Nhà tuyển dụng\n(Employer)" as Employer #EEF2FF
actor "🛡️ Quản trị viên\n(Admin)" as Admin #EEF2FF

' ============================================================
' LAYER 1: FRONTEND (Client)
' ============================================================

package "CLIENT — Frontend" as CLIENT #E8F4FD {

  rectangle "🌐 Trình duyệt Web\n(Browser)" as Browser {

    rectangle "index.html\nTrang chủ / Tìm việc" as P1 #DBEAFE
    rectangle "job-detail.html\nChi tiết tin / Ứng tuyển" as P2 #DBEAFE
    rectangle "register.html / login.html\nĐăng ký / Đăng nhập" as P3 #DBEAFE
    rectangle "company-profile.html\nHồ sơ công ty" as P4 #DBEAFE
    rectangle "dashboard-candidate.html\nDashboard Ứng viên" as P5 #DBEAFE
    rectangle "dashboard-employer.html\nDashboard Nhà tuyển dụng" as P6 #DBEAFE
    rectangle "admin.html\nAdmin Panel" as P7 #DBEAFE

    rectangle "⚙️ Vanilla JavaScript (ES6+)\nfetch() · LocalStorage (JWT)" as JS #C7D2FE
  }

  note right of Browser
    Công nghệ:
    • HTML5
    • Tailwind CSS 3.x (CDN)
    • Vanilla JavaScript ES6+
    • JWT lưu trong LocalStorage
  end note
}

' ============================================================
' LAYER 2: BACKEND (Server)
' ============================================================

package "SERVER — Backend (Node.js + Express)" as SERVER #E8FDF5 {

  rectangle "🚦 Express Router\n/api/auth\n/api/jobs\n/api/locations\n/api/worktypes\n/api/admin" as Router #BBF7D0

  rectangle "🔐 Middleware" as MW {
    rectangle "auth.js\nJWT protect()\nauthorize(role)" as MW1 #D1FAE5
    rectangle "upload.js\nMulter + Cloudinary\nBuffer handler" as MW2 #D1FAE5
    rectangle "CORS · Morgan\nValidation · Error Handler" as MW3 #D1FAE5
  }

  rectangle "📦 Routes" as ROUTES {
    rectangle "auth.js\nregister · login\nme · change-password" as R1 #A7F3D0
    rectangle "jobs.js\nCRUD tin · apply\nfilter · my-jobs" as R2 #A7F3D0
    rectangle "users.js\nProfile · CV · Avatar\nApplications · Invitations\nVerification" as R3 #A7F3D0
    rectangle "admin.js\napprove · reject\nhighlight · stats\ntoggle-active" as R4 #A7F3D0
    rectangle "locations.js\nworkTypes.js\nCRUD danh mục" as R5 #A7F3D0
  }

  rectangle "🗂️ Models (Mongoose ODM)" as MODELS {
    rectangle "User.js\n+ CandidateProfile\n+ EmployerProfile\n+ CV · Skills\n+ Education · Experience" as M1 #6EE7B7
    rectangle "Job.js\nTin tuyển dụng\n+ slug auto-gen\n+ text index" as M2 #6EE7B7
    rectangle "Application.js\nĐơn ứng tuyển" as M3 #6EE7B7
    rectangle "Invitation.js\nLời mời ứng tuyển" as M4 #6EE7B7
    rectangle "Location.js\nWorkType.js\nDanh mục" as M5 #6EE7B7
  }

  note right of SERVER
    Công nghệ:
    • Node.js ≥ 16.x
    • Express.js 4.18
    • bcryptjs (hash password)
    • jsonwebtoken (JWT)
    • express-validator
    • multer + cloudinary SDK
    • morgan (HTTP logger)
  end note
}

' ============================================================
' LAYER 3: DATABASE & EXTERNAL SERVICES
' ============================================================

package "SERVICES — Dịch vụ ngoài" as SERVICES #FFFBEB {

  database "🍃 MongoDB\n(Atlas / Local)" as MongoDB {
    rectangle "users" as DB1 #FDE68A
    rectangle "jobs" as DB2 #FDE68A
    rectangle "applications" as DB3 #FDE68A
    rectangle "invitations" as DB4 #FDE68A
    rectangle "locations" as DB5 #FDE68A
    rectangle "worktypes" as DB6 #FDE68A
  }

  cloud "☁️ Cloudinary\n(Image Storage)" as Cloudinary {
    rectangle "logos/\ngallery/\navatars/" as CDN1 #D1FAE5
  }
}

' ============================================================
' QUAN HỆ — Actors → Client
' ============================================================

Candidate --> P1 : Tìm việc
Candidate --> P2 : Xem & Ứng tuyển
Candidate --> P5 : Quản lý CV / Hồ sơ

Employer --> P4 : Quản lý hồ sơ công ty
Employer --> P6 : Đăng tin / Xem hồ sơ

Admin --> P7 : Kiểm duyệt / Thống kê

' ============================================================
' QUAN HỆ — Client → Server
' ============================================================

JS -down-> Router : HTTP REST API\nAuthorization: Bearer <JWT>

' ============================================================
' QUAN HỆ — Router → Middleware → Routes
' ============================================================

Router -down-> MW : Mọi request\nqua middleware
MW -down-> ROUTES : Request hợp lệ\n→ xử lý route

' ============================================================
' QUAN HỆ — Routes → Models
' ============================================================

ROUTES -down-> MODELS : Mongoose\nQuery / Save

' ============================================================
' QUAN HỆ — Models → Services
' ============================================================

MODELS -down-> MongoDB : mongoose.connect()\nCRUD operations

MW2 -down-> Cloudinary : multer buffer\n→ upload ảnh

' ============================================================
' LEGEND
' ============================================================

legend right
  |= Ký hiệu |= Ý nghĩa |
  | <#DBEAFE>    | Trang HTML (Frontend) |
  | <#BBF7D0>    | Express Router |
  | <#D1FAE5>    | Middleware |
  | <#A7F3D0>    | Route Handler |
  | <#6EE7B7>    | Mongoose Model |
  | <#FDE68A>    | MongoDB Collection |
  | <#D1FAE5>    | Cloud Storage |
endlegend

@enduml
