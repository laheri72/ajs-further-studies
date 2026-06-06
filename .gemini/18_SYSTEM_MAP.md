# System Map

This document serves as the ultimate, unified reference connecting all aspects of the Further Studies Portal.

## 1. Feature Map
| Feature | User | Description |
| :--- | :--- | :--- |
| **Authentication** | All | Google Popup via Firebase Auth. Strict EDU domain enforcement. |
| **Profile Linking** | Student | One-time mapping of TR Number to Google UID. |
| **Registration Form** | Student | Multi-step wizard capturing academic intent and clash details. |
| **Status Dashboard** | Student | Read-only view of current status and admin notes. |
| **Command Center** | Admin | Searchable data table of all student registrations. |
| **Review Modal** | Admin | Interface to approve, hold, or reject a registration. |
| **Tashjee System** | Both | Workflow for students to submit proof of external academic success. |
| **Access Control** | Super Admin | UI to manage allowed admins and whitelisted student emails. |

## 2. Route Map
- `/` -> Entry point.
- `/student` -> `<StudentPage />` -> Student Dashboard / Form.
- `/admin` -> `<AdminPage />` -> Command Center.
- `/unauthorized` -> `<UnauthorizedPage />` -> Fallback.

## 3. Component Map (High Level)
```text
AppShell (Layout, Nav)
 ├── AuthCard (Login UI)
 ├── StudentPage
 │    ├── ProfileLink (First-time setup)
 │    ├── DashboardTabs (Status, Registration, Tashjee)
 │    └── TashjeeStudentTab
 └── AdminPage
      ├── Admin Dashboard (Stats, Table)
      ├── ReviewModal (Status updates)
      ├── AdminAccessPanel (Role management)
      └── TashjeeAdminPanel
```

## 4. Database Map (Firestore Collections)
```text
(Auth UID)
   ↳ users/{uid} (Profile data)
   ↳ students/{uid} (Registration payload)

(Email ID)
   ↳ admins/{email} (Authorized staff)
   ↳ student_whitelist/{email} (Allowed non-EDU students)

(Custom IDs)
   ↳ trIndex/{trNo} (Locking table mapping TR to UID)
   ↳ tashjee_requests/{requestId} (Proof submissions)
   ↳ tashjee_config/{docId} (System toggles)
```

## 5. Auth & Permissions Map
- **Student Access:** `Google Auth` -> `domain check` OR `student_whitelist` lookup.
- **Admin Access:** `Google Auth` -> `admins` collection lookup.
- **Super Admin Access:** `Google Auth` -> Hardcoded email check.
- **Data Boundaries:** Users can only read/write documents matching their `request.auth.uid`. Admins can read all, update statuses.

## 6. Primary Workflow Map
**Student Journey:**
Login -> Link Profile -> View Dashboard -> Fill Registration -> Status = Pending -> Wait -> View Approved Status.

**Admin Journey:**
Login -> View Dashboard -> Search Records -> Open Record -> Update Status -> Add Note -> Save -> Student Notified on Next Login.

---
*For deep-dives into any of these areas, consult the corresponding `.md` files in the `.gemini/` directory.*