# Security Audit

## Authentication Risks
- **EDU Email Spoofing (Low Risk):** Access relies on Google verifying ownership of the `@jameasaifiyah.edu` email address. As long as the domain's Google Workspace is secure, the application is secure.
- **Whitelist Bypass (Medium Risk):** The `student_whitelist` allows non-EDU addresses to act as students. If an admin maliciously or accidentally adds an attacker's email to this list, the attacker gains student access for that specific TR number.

## Authorization & Database Risks
- **Super Admin Centralization (High Risk):** The Super Admin is hardcoded in Firestore Rules to `idrislaheri72@gmail.com`. If this Google account is compromised, the attacker has complete control over the application, including the ability to whitelist their own accounts or manipulate all student data.
- **Data Tampering (Low Risk):** Firestore rules heavily restrict updates. The `studentResubmissionKeysOnly` rule successfully prevents a malicious student client from manually altering their `status` to `approved` or modifying `adminNotes`.
- **TR Collision (Low Risk):** The `trIndex` acts as a lock. Once a TR is claimed, another user cannot claim it. However, there is no physical verification that the person behind the Google account actually owns that TR number, other than the assumption that the email prefix matches the TR.

## Data Leakage Risks
- **Admin Visibility (Low Risk):** Admins can read all student data. This requires absolute trust in the `admins` collection. 
- **Environment Variables (Low Risk):** Firebase config (`VITE_FIREBASE_*`) is exposed to the client. This is by design in Firebase SPAs and is secure *provided* the Firestore Security Rules are robust (which they are).

## Findings Summary
| Severity | Finding | Mitigation |
| :--- | :--- | :--- |
| **High** | Hardcoded Super Admin Email | Migrate Super Admin role logic to a custom claim or a secure Firestore config document rather than a hardcoded string in `firestore.rules`. |
| **Medium** | Whitelist Mismanagement | Ensure only highly trained personnel manage the whitelist. Implement audit logging for `student_whitelist` additions/deletions. |
| **Low** | Framer Motion Bundle Size | Low security risk, but impacts UX. |