# Authorization Matrix

## Roles
1. **Guest:** Unauthenticated user.
2. **Student:** Authenticated user with a `@jameasaifiyah.edu` email OR an email present in `student_whitelist`.
3. **Admin:** Authenticated user whose email is present in the `admins` collection with `active == true`.
4. **Super Admin:** Hardcoded administrative account (`idrislaheri72@gmail.com`).

## Feature Permissions

| Feature | Guest | Student | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| **View App Shell & Login** | ✅ | ✅ | ✅ | ✅ |
| **Create Student Profile (`users`)** | ❌ | ✅ (Self) | ❌ | ❌ |
| **Claim TR Number (`trIndex`)** | ❌ | ✅ (Self) | ❌ | ❌ |
| **View Own Registration** | ❌ | ✅ | ✅ | ✅ |
| **Create/Edit Own Registration** | ❌ | ✅ (If Pending/Hold) | ❌ | ❌ |
| **View All Student Registrations** | ❌ | ❌ | ✅ | ✅ |
| **Approve / Hold Registrations** | ❌ | ❌ | ✅ | ✅ |
| **Create Tashjee Request** | ❌ | ✅ | ❌ | ❌ |
| **Review Tashjee Request** | ❌ | ❌ | ✅ | ✅ |
| **View Admin Dashboard** | ❌ | ❌ | ✅ | ✅ |
| **Manage Student Whitelist** | ❌ | ❌ | ❌ | ✅ |
| **Manage Admins Allowlist** | ❌ | ❌ | ❌ | ✅ |

## Firestore Rule Highlights
- **`isOwner(uid)`:** Prevents students from reading or writing to another student's UID document.
- **`isStudentEmail()`:** Enforces the `@jameasaifiyah.edu` regex pattern or checks the `student_whitelist` table.
- **`trBelongsToRequestUser(trNo)`:** Enforces that a student can only modify records that match the TR number they initially claimed.
- **`studentResubmissionKeysOnly()`:** Strict schema validation during updates preventing a student from forcefully modifying `status` or `adminNotes`.