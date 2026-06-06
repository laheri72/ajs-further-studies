# Route Map

## Route Tree
```text
/
├── /student (Student Dashboard / Portal)
├── /admin (Admin Command Center)
├── /home (Alternative entry/landing)
├── /unauthorized (Access Denied View)
└── * (Catch-all, redirects to /)
```

## Route Details

### 1. `/` (Root)
- **Purpose:** Entry point for the application.
- **Component:** `<StudentPage />` (Acts as the default route).
- **Logic:** `App.jsx` handles `#student` and `#admin` hash legacy routing by replacing them with standard `/student` and `/admin` paths.

### 2. `/student`
- **Purpose:** The main workspace for students.
- **Entry Conditions:** Google Authentication.
- **Permissions:** Valid student email (`@jameasaifiyah.edu`) or presence in `student_whitelist`.
- **Component:** `<StudentPage />`
- **Related Components:** `<AuthCard />`, `<ProfileLink />`, `<TashjeeStudentTab />`
- **Related Collections:** `users`, `students`, `trIndex`, `student_whitelist`

### 3. `/admin`
- **Purpose:** The centralized dashboard for Idara staff to review records.
- **Entry Conditions:** Google Authentication.
- **Permissions:** Email must exist and be active in the `admins` Firestore collection.
- **Component:** `<AdminPage />`
- **Related Components:** `<AuthCard />`, `<AdminAccessPanel />`, `<WhitelistedStudentsPanel />`, `<ReviewModal />`, `<TashjeeAdminPanel />`
- **Related Collections:** `admins`, `students`, `student_whitelist`, `tashjee_requests`

### 4. `/unauthorized`
- **Purpose:** Fallback view for authenticated users who lack the required role permissions (e.g., a student trying to access `/admin`).
- **Entry Conditions:** Authenticated, but role check failed.
- **Component:** `<UnauthorizedPage />`

### 5. `/home`
- **Purpose:** Informational landing page.
- **Component:** `<HomePage />`

## Orphan Route Analysis
- No significant orphan routes identified. The `*` wildcard acts as a safety net ensuring users are redirected to the root (`/`) which securely hands them off to the student portal.
- Hash routes (`#student`, `#admin`) from legacy or external links are intercepted and mapped to actual paths.