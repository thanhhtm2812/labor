@startuml LaborConnect_ERD

' ============================================================
' LABORCONNECT — Sơ đồ quan hệ các Collection (MongoDB)
' ============================================================

!define TABLE(name,desc) class name as "desc" << (C, #4A90D9) >>
!define EMBED(name,desc) class name as "desc" << (E, #7ED321) >>

skinparam classAttributeIconSize 0
skinparam classFontSize 13
skinparam classFontStyle bold
skinparam classBackgroundColor #FAFAFA
skinparam classBorderColor #AAAAAA
skinparam classArrowColor #555555
skinparam stereotypeCBackgroundColor #4A90D9
skinparam stereotypeEBackgroundColor #7ED321
skinparam shadowing false
skinparam linetype ortho

' ============================================================
' COLLECTION: User (Embedded sub-schemas)
' ============================================================

TABLE(User, "users") {
  + _id : ObjectId <<PK>>
  --
  email : String <<unique>>
  password : String <<hashed, select:false>>
  role : "candidate" | "employer" | "admin"
  isActive : Boolean
  isVerified : Boolean
  savedJobs : ObjectId[] <<ref Job>>
  followedCompanies : ObjectId[] <<ref User>>
  createdAt : Date
  updatedAt : Date
}

EMBED(CandidateProfile, "candidateProfile <<embedded>>") {
  fullName : String
  avatar : String
  phone : String
  dateOfBirth : Date
  gender : "male" | "female" | "other"
  bio : String
  province : ObjectId <<ref Location>>
  district : String (slug)
  desiredWorkTypes : ObjectId[] <<ref WorkType>>
  desiredSalary.min : Number
  desiredSalary.max : Number
  desiredSalary.currency : String
  resumeUrl : String
}

EMBED(EmployerProfile, "employerProfile <<embedded>>") {
  companyName : String
  logo : String (Cloudinary URL)
  description : String (HTML)
  videoUrl : String (YouTube URL)
  phone : String
  website : String
  industry : String
  companySize : "1-10"|"11-50"|"51-200"|...
  province : ObjectId <<ref Location>>
  district : String (slug)
  address : String
  galleryImages : String[]
  taxCode : String
  founded : Number
}

EMBED(SkillItem, "skills[] <<embedded>>") {
  name : String
  level : "basic"|"intermediate"|"advanced"|"expert"
  certificate : String
  certUrl : String
  projects : String[]
}

EMBED(EducationItem, "education[] <<embedded>>") {
  school : String
  degree : String
  major : String
  gpa : Number
  from : Date
  to : Date
  isCurrent : Boolean
  description : String
  images : String[]
  verifyStatus : "unverified"|"pending"|"verified"|"rejected"
  verifyNote : String
  verifiedAt : Date
  verifiedBy : ObjectId <<ref User>>
}

EMBED(ExperienceItem, "experience[] <<embedded>>") {
  company : String
  position : String
  description : String
  from : Date
  to : Date
  isCurrent : Boolean
  verifyStatus : "unverified"|"pending_admin"|"pending_employer"|"verified"|"rejected"
  verifyNote : String
  verifiedAt : Date
  verifiedBy : ObjectId <<ref User>>
  assignedEmployer : ObjectId <<ref User>>
}

EMBED(CVItem, "cvList[] <<embedded>>") {
  title : String
  summary : String
  desiredPosition : String
  desiredSalary.min : Number
  desiredSalary.max : Number
  desiredWorkTypes : ObjectId[] <<ref WorkType>>
  isPublic : Boolean
  createdAt : Date
  updatedAt : Date
}

' ============================================================
' COLLECTION: Job
' ============================================================

TABLE(Job, "jobs") {
  + _id : ObjectId <<PK>>
  --
  title : String
  slug : String <<unique, auto-generated>>
  description : String (HTML)
  requirements : String (HTML)
  benefits : String (HTML)
  employer : ObjectId <<ref User>>
  category : String
  positions : Number
  experience : "no-experience"|"under-1-year"|"1-3-years"|...
  education : "any"|"high-school"|"university"|...
  salary.min : Number
  salary.max : Number
  salary.isNegotiate : Boolean
  salary.period : "month"|"hour"|"project"
  province : ObjectId <<ref Location>>
  district : String (slug)
  address : String
  workTypes : ObjectId[] <<ref WorkType>>
  status : "pending"|"approved"|"rejected"|"expired"|"closed"
  adminNote : String
  expiresAt : Date
  isHighlight : Boolean
  viewCount : Number
  applyCount : Number
  createdAt : Date
  updatedAt : Date
}

' ============================================================
' COLLECTION: Application
' ============================================================

TABLE(Application, "applications") {
  + _id : ObjectId <<PK>>
  --
  job : ObjectId <<ref Job>>
  candidate : ObjectId <<ref User>>
  coverLetter : String
  resumeUrl : String
  cvId : ObjectId
  status : "pending"|"viewed"|"accepted"|"rejected"
  employerNote : String
  viewedAt : Date
  respondedAt : Date
  createdAt : Date
  updatedAt : Date
}

' ============================================================
' COLLECTION: Invitation
' ============================================================

TABLE(Invitation, "invitations") {
  + _id : ObjectId <<PK>>
  --
  employer : ObjectId <<ref User>>
  candidate : ObjectId <<ref User>>
  job : ObjectId <<ref Job>>
  message : String
  status : "pending"|"accepted"|"rejected"
  createdAt : Date
  updatedAt : Date
}

EMBED(ResponseHistory, "responseHistory[] <<embedded>>") {
  status : "accepted" | "rejected"
  message : String
  respondedAt : Date
}

' ============================================================
' COLLECTION: Location
' ============================================================

TABLE(Location, "locations") {
  + _id : ObjectId <<PK>>
  --
  name : String
  slug : String <<unique>>
  type : "province" | "city"
}

EMBED(District, "districts[] <<embedded>>") {
  name : String
  slug : String
}

' ============================================================
' COLLECTION: WorkType
' ============================================================

TABLE(WorkType, "worktypes") {
  + _id : ObjectId <<PK>>
  --
  name : String
  slug : String <<unique>>
  icon : String (emoji)
}

' ============================================================
' QUAN HỆ GIỮA CÁC COLLECTION (References)
' ============================================================

' User embeds profiles
User "1" *-- "0..1" CandidateProfile : contains
User "1" *-- "0..1" EmployerProfile : contains
CandidateProfile "1" *-- "0..*" SkillItem : embeds
CandidateProfile "1" *-- "0..*" EducationItem : embeds
CandidateProfile "1" *-- "0..*" ExperienceItem : embeds
CandidateProfile "1" *-- "0..*" CVItem : embeds
CVItem "1" *-- "0..*" SkillItem : embeds

' Location embedded districts
Location "1" *-- "0..*" District : embeds

' Invitation embedded response history
Invitation "1" *-- "0..*" ResponseHistory : embeds

' Job references
Job "many" --> "1" User : employer (ref)
Job "many" --> "1" Location : province (ref)
Job "many" --> "many" WorkType : workTypes[] (ref)

' Application references
Application "many" --> "1" Job : job (ref)
Application "many" --> "1" User : candidate (ref)

' Invitation references
Invitation "many" --> "1" User : employer (ref)
Invitation "many" --> "1" User : candidate (ref)
Invitation "many" --> "1" Job : job (ref)

' CandidateProfile references
CandidateProfile "many" --> "1" Location : province (ref)
CandidateProfile "many" --> "many" WorkType : desiredWorkTypes[] (ref)

' EmployerProfile references
EmployerProfile "many" --> "1" Location : province (ref)

' Experience verify references
ExperienceItem "many" --> "0..1" User : assignedEmployer (ref)
ExperienceItem "many" --> "0..1" User : verifiedBy (ref)
EducationItem  "many" --> "0..1" User : verifiedBy (ref)

' User saved/follow references
User "many" --> "many" Job : savedJobs[] (ref)
User "many" --> "many" User : followedCompanies[] (ref)

@enduml
