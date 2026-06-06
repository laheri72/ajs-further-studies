# Student Workflow

## The Student Journey

### 1. Landing & Authentication
- **Action:** Student navigates to the root `/` or `/student`.
- **View:** `AuthCard` displays the "Further Studies Portal" login prompt.
- **Process:** User authenticates via Google Popup. The system verifies if the email matches `@jameasaifiyah.edu` or is present in `student_whitelist`.

### 2. Profile Setup (First Time Only)
- **Action:** If the `users/{uid}` document or `trNo` is missing, the student is intercepted.
- **View:** `ProfileLink` component.
- **Process:** The system extracts the TR number from the EDU email prefix (or from the whitelist) and asks the user to confirm their Full Name. This writes to `users/{uid}` and `trIndex`.

### 3. Dashboard Landing
- **Action:** Student lands on the main dashboard.
- **View:** `StudentPage` active tab (`status`).
- **Process:** The system checks `students/{uid}`.
  - If no record exists, the status is "Registration Not Submitted".
  - If a record exists, the large banner displays "Pending Review", "Approved", or "On Hold", along with any `adminNotes`.

### 4. Guided Registration (The Form)
- **Action:** Student clicks "Start Registration" or "Update and Resubmit".
- **View:** The `RegistrationTab` multi-step wizard.
- **Steps:**
  1. **Confirm Identity:** Read-only view of TR and Name.
  2. **Qualifications Acquired:** Multi-select grid of completed degrees (Hifz, Alimiyah, etc.).
  3. **Next Qualification:** Branching logic. Student selects intent (Planning, Pursuing, Not Now). If planning, they select a stage (Apply Raza, Istirshaad, Research). If not now, they indicate if Idara help is still needed.
  4. **Programme Details:** (Only shown if pursuing/planning). Collects institution, study commitment, required raza days, exam months, and critical Miqaat/Jamea clash data.
  5. **Review:** A clean summary sheet.
- **Process:** Draft is saved to `localStorage` continuously. Upon clicking "Submit", validation runs, and the payload is sent to Firestore.

### 5. Status Tracking & Resolution
- **Action:** Student returns to the portal days later.
- **Process:**
  - If auto-approved (based on business rules), the status shows "Approved" and the form is locked.
  - If an Admin requested changes, the status shows "On Hold" with an admin note. The student updates the form and clicks "Resubmit Updates".

### 6. Tashjee Workflow (Optional Tab)
- **Action:** Student navigates to the "Tashjee Request" tab.
- **Process:** Submits academic proof (e.g., external exam success) via a form, creating a record in `tashjee_requests` to await admin review.