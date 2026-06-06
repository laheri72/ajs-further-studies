# V1.1 Discrepancy Report

## Docs vs Code Alignment

**1. Dependency Audit (`zod`)**
- **Documented:** `10_DEPENDENCY_AUDIT.md` previously claimed `zod` might be dead weight due to presumed limited usage in `utils/validation.js`.
- **Actual Code:** `zod` is heavily utilized to define strict schemas (`profileSchema`, `registrationSchema`) in `src/utils/validation.js`, employing `.superRefine` for complex interdependent logic validation.
- **Action Taken:** Updated `10_DEPENDENCY_AUDIT.md` to reflect `zod`'s critical role in maintaining data integrity.

**2. Component Architecture Bloat**
- **Documented:** `04_COMPONENT_REGISTRY.md` and `12_TECHNICAL_DEBT.md` correctly identified `StudentPage.jsx` and `AdminPage.jsx` as monolithic components mixing layout, data access, and granular UI elements (e.g., Modals, Steppers).
- **Actual Code:** The codebase matched this assessment; `StudentPage.jsx` exceeded 650 lines, complicating future schema-driven upgrades.
- **Action Taken:** Extracted inline components into `src/components/student/` and `src/components/admin/`. Updated registries accordingly.

**3. Hardcoded Super Admin Logic**
- **Documented:** `12_TECHNICAL_DEBT.md` warned of `idrislaheri72@gmail.com` being hardcoded in `firestore.rules` and `AdminPage.jsx`.
- **Actual Code:** The email was directly embedded in multiple places, creating a maintenance vulnerability.
- **Action Taken:** Centralized the hardcoded email into `src/data/constants.js` (`MAIN_ADMIN_EMAIL`) and imported it across the app. Note: Full migration to Firebase Custom Claims is deferred to V3 as per the roadmap.

**4. Legacy Hash Routing**
- **Documented:** `12_TECHNICAL_DEBT.md` flagged legacy hash routing (`#student`, `#admin`) inside `App.jsx`.
- **Actual Code:** The `useEffect` intercepting the hash still exists and functions correctly.
- **Action Taken:** Retained as it actively supports users with legacy bookmarked links. This aligns with the rule to "keep only what is actively required for the current V1 workflow."