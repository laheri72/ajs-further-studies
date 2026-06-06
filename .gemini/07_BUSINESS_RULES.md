# Business Rules

These rules represent the core product truth and domain logic implemented in both the frontend validation and Firestore security rules.

## Identity & Authentication
1. **Google Auth Requirement:** No password-based login. All access is tied to a verified Google account.
2. **Student Domain Restriction:** By default, only users with a valid `@jameasaifiyah.edu` email address (verified by regex `^[0-9]{5}@jameasaifiyah\.edu$`) can register as students.
3. **Whitelist Exception:** Non-EDU Google accounts can be manually added to the `student_whitelist` by a Super Admin. They must be explicitly mapped to a TR number.
4. **TR Number Uniqueness:** A TR Number is a strict 5-digit string. Once a TR Number is claimed by a Google UID, it is locked in `trIndex`. It cannot be claimed by another account.

## Registration Workflow
5. **Auto-Approval Logic:** A registration is automatically marked as `approved` upon submission if:
   - The student indicates they are *not* planning a next qualification AND requires no Idara assistance.
   - OR, they are *already pursuing* a qualification AND do not need leave support this year.
6. **Form Lock:** Once a registration status is `approved`, the student interface becomes read-only. Further edits must be done by an Admin reverting the status.
7. **On-Hold Clarification:** If an Admin sets a status to `on-hold`, the student form unlocks. The Admin *must* provide an `adminNotes` explanation, and the student must resubmit to return to a `pending` status.
8. **Draft Persistence:** In-progress registration data is saved to local browser storage (`localStorage`) so students don't lose data if they close the tab before submitting.

## Admin Management
9. **Super Admin Exclusivity:** Only the Super Admin (`idrislaheri72@gmail.com`) can add/remove Admins or manage the Student Whitelist. Standard Admins can only review student records and Tashjee requests.
10. **Immutable Main Admin:** The main Super Admin account cannot be deleted or deactivated via the UI.

## Tashjee Requests
11. **Proof Upload Limitations:** Tashjee proof uploads (if implemented with Cloudinary) must be images (JPG/PNG/WEBP) and adhere to a valid URL regex.
12. **Status Hierarchy:** A Tashjee request can be `pending`, `approved`, or `rejected`. Students can only delete a request if it is `pending` or `on-hold`.