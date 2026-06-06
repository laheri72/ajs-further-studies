# Admin Workflow

## The Admin Experience

### 1. Landing & Authentication
- **Action:** Admin navigates to `/admin`.
- **View:** `AuthCard` displays the "Admin Portal" login prompt.
- **Process:** User authenticates via Google Popup.
- **Authorization Check:** The system queries the `admins/{email}` collection. If the email is missing or `active == false`, the user is redirected to `/unauthorized`.

### 2. Admin Dashboard (Command Center)
- **Action:** Authorized admin lands on the dashboard.
- **View:** `AdminPage` with tabbed navigation: "Student Records", "Tashjee Management", and (if Super Admin) "Admin Access".

### 3. Reviewing Student Records
- **Process:**
  1. The "Student Records" tab loads all documents from the `students` collection, sorted by `submittedAt`.
  2. The admin views aggregate statistics (Total, Pending, On Hold, Approved, Clashes).
  3. The admin uses the **Search Box** (searches across TR, Name, Email, Degree) or **Status Filter** dropdown to locate specific records.
  4. The admin clicks "Manage" on a row to open the `ReviewModal`.

### 4. Updating Status & Notes (`ReviewModal`)
- **Process:**
  1. The modal displays a read-only summary of the student's submission.
  2. The admin toggles the status (`Pending`, `On Hold`, or `Approved`).
  3. If `On Hold` is selected, the admin *must* type a note in the "Notes visible to student" textarea.
  4. The admin clicks "Save Review". This updates the `status`, `adminNotes`, `reviewedBy`, and `reviewedAt` fields in Firestore.
  5. *Edge Case:* The admin can click "Clear Registration" to completely delete the student's registration payload, forcing them to start over.

### 5. Managing Tashjee Requests
- **Action:** Admin switches to the "Tashjee Management" tab.
- **Process:** Admin reviews uploaded proofs, assigns a status (Approved/Rejected), and adds optional remarks.

### 6. Managing Access (Super Admin Only)
- **Action:** Super Admin (`idrislaheri72@gmail.com`) switches to the "Admin Access" tab.
- **Process:**
  - **Add Admin:** Submits an email and display name to create a new record in `admins`.
  - **Remove Admin:** Deletes an admin record.
  - **Whitelist Student:** Manually links a non-EDU Google account to a TR Number and Name in `student_whitelist`.