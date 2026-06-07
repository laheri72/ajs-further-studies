# Further Studies Portal — Core Documentation & Instructions

This document is the **single source of truth** for the Further Studies Portal. It contains the project's architecture, business rules, workflows, and strict development guidelines for both human developers and AI agents.

## 1. Project Overview & Vision
A secure, elegant web application for Jamea students to register academic plans beyond Jamea, coordinate their 'raza' (permission) process, and track statuses. It provides Idara (administrative) staff with a centralized dashboard to review submissions and leave notes.
- **Tone:** Dignified, institutional, serious, and premium (dark forest green, antique gold).

## 2. Architecture & Tech Stack
- **Frontend:** React 18 + Vite (Single Page Application)
- **Routing:** React Router v6 (`/student`, `/admin`). Legacy hash routes (`#student`, `#admin`) are redirected.
- **State & Forms:** React Hook Form + Zod for strict schema validation. Local state heavily utilizes `useState` / `useEffect`.
- **Backend & Database:** Firebase Authentication (Google Sign-In exclusively), Cloud Firestore. No custom backend (Node/Express).
- **Hosting:** Firebase Hosting.
- **Styling:** Custom Vanilla CSS (linted with Stylelint). **No TailwindCSS.**

## 3. Data Model (Firestore)
The database is highly denormalized, leveraging the Google Auth `uid` or normalized `email` as document IDs.

- `users/{uid}`: Core profile (TR Number, Full Name, Email).
- `students/{uid}`: The registration payload (Intent, Programme Details, Clashes, Laptop Requirement, Status, Admin Notes).
- `students/{uid}/qualifications/{qualificationId}`: Student-managed academic history rows. This is the current home for qualifications; legacy qualification fields on `students/{uid}` are read-only compatibility data.
- `students/{uid}/examProof/current`: Hall-ticket / exam confirmation state. Stores `uploaded` or `not_generated_yet` plus Cloudinary URL and metadata when uploaded.
- `trIndex/{trNo}`: Locking table mapping the 5-digit TR number to a UID to prevent collisions.
- `admins/{email}`: Whitelist of authorized Idara staff (controls access to `/admin`).
- `student_whitelist/{email}`: Allowed non-EDU Google accounts.
- `tashjee_requests/{id}`: Submissions of academic proof.

## 4. Business Rules & Security
1. **Authentication:** Google Sign-In only. Passwords are not used.
2. **Student Access:** Restricted to `@jameasaifiyah.edu` emails OR emails explicitly listed in `student_whitelist`.
3. **Admin Access:** Strictly role-gated. The email must exist in the `admins` collection with `active == true`.
4. **Super Admin:** Hardcoded as `idrislaheri72@gmail.com` in `src/data/constants.js` (and `firestore.rules`). Can manage other admins/whitelists.
5. **Auto-Approval:** If a student is not planning a next qualification AND requires no Idara assistance, their status auto-sets to `approved`.
6. **Form Locking:** If `status == 'approved'`, the student form becomes read-only.
7. **Academic History:** Qualifications are managed in a dedicated tab and subcollection, not in the main registration stepper.
8. **Exam Proof:** Hall-ticket uploads use Cloudinary image uploads only. Store returned URLs/metadata in Firestore; never store image bytes in Firestore.
9. **Security Rules (`firestore.rules`):** Enforce schema validation (e.g., `studentResubmissionKeysOnly`). Students can never directly modify `adminNotes`, `reviewedAt`, or `reviewedBy`.

## 5. Core Workflows
*   **Student Journey:** Login (Google) ➔ Link Profile (TR + Name) ➔ View Dashboard ➔ Complete Multi-Step Registration (drafts save to `localStorage`) ➔ Manage Qualifications tab ➔ Upload hall ticket or mark not generated yet ➔ View status inside the registration overview.
*   **Admin Journey:** Login (Google) ➔ Dashboard Command Center ➔ Search/Filter ➔ Open Review Modal ➔ Inspect registration, qualifications, and exam proof ➔ Update Status (Pending/Approved/On Hold) ➔ Add Notes ➔ Save.

## 6. AI & Developer Guidelines (Strict Mandates)
*   **Never use TailwindCSS.** Stick to Vanilla CSS located in `src/styles.css`.
*   **No Custom Backends.** Data fetching and writes happen strictly on the client side via the Firebase SDK (abstracted in `src/services/firestore.js`).
*   **Update Security Rules:** If you add a new field to the registration form, you **MUST** update `firestore.rules` (`studentResubmissionKeysOnly`) to permit the write.
*   **Subcollection Rules:** If you change qualifications or exam-proof fields, update the validators in `firestore.rules`.
*   **Validation:** Use `zod` in `src/utils/validation.js` for all form and data validation.
*   **Component Modularity:** Maintain the split between `src/pages/` (routing/layout) and `src/components/` (UI elements). Keep files lean.
*   **Future Scope (V2):** The registration form is currently hardcoded in JSX. Future architectural shifts will move this to a JSON-driven schema builder (Form Engine).

## 7. Building and Running
```bash
npm install
npm run dev     # Starts local server
npm run test    # Runs Vitest test suite
npm run lint    # Runs ESLint
npm run build   # Builds for production
firebase deploy # Deploys to Firebase Hosting
```
