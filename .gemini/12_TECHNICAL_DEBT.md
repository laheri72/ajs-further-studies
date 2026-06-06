# Technical Debt

This document tracks architectural compromises and shortcuts that need future attention.

## Immediate Priority (Address Soon)

1. **Hardcoded Form Schema:**
   - **Issue:** Form fields, options (like `QUALIFICATIONS`), and validation logic are hardcoded across `constants.js`, `RegistrationFlow.jsx`, and `validation.js`.
   - **Impact:** Adding a new field requires touching UI, validation, and potentially Firestore Rules.
   - **Fix:** Form Engine Strategy (V2) - migrate to a schema-driven form configuration.

## Medium Priority (Address Later)

2. **Super Admin Hardcoding:**
   - **Issue:** `idrislaheri72@gmail.com` is hardcoded in `firestore.rules` and `constants.js`. (Centralized to constants in V1.1, but still hardcoded).
   - **Impact:** If this person leaves or loses access, a developer must commit code to change the owner.
   - **Fix:** Move the Super Admin designation to a robust role-management system or rely on Firebase Custom Claims.

3. **Legacy Hash Routing Fallbacks:**
   - **Issue:** `App.jsx` contains `useEffect` hooks specifically to catch `#student` and `#admin` and redirect them.
   - **Impact:** Minor performance hit and slightly messy code.
   - **Fix:** Once all users have transitioned to the standard `/student` paths, remove this logic.

## Low Priority (Acceptable Tradeoffs)

4. **Local Storage Drafts:**
   - **Issue:** `saveDraft` uses synchronous `localStorage`. It only supports one draft per UID per device. If a user starts on mobile and moves to desktop, the draft does not sync.
   - **Impact:** Minor UX inconvenience.
   - **Fix:** Keep as-is for V1. Cloud-synced drafts would require complex Firestore logic for unvalidated/incomplete data.

5. **Tashjee Workflow Integration:**
   - **Issue:** The `Tashjee` components feel bolted onto the main application tabs rather than fully integrated into the core architecture.
   - **Fix:** Revisit the UX architecture in V2 to see if these disparate requests should be unified into a single "Student Requests" module.

---
### Resolved in V1.1
- **`StudentPage.jsx` Component Bloat:** Inline components (`StatusLanding`, `RegistrationTab`, `AdminAccessPanel`, `ReviewModal`) were extracted into dedicated files in `src/components/student/` and `src/components/admin/`, resolving the bloat and coupling issues.