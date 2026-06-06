# AI Developer Guide

## Welcome
You are an AI Developer contributing to the **Further Studies Portal**. This guide contains the most critical context you need to write correct, idiomatic code for this repository. 

**DO NOT guess architecture. Follow these rules strictly.**

## Project Context
This is a React SPA built with Vite. It serves Jamea students registering for further studies and Idara staff reviewing those registrations.

## Architecture Summary
- **Frontend:** React, `react-router-dom`, `lucide-react`, custom CSS (NO Tailwind).
- **Backend/DB:** Firebase Auth (Google Provider), Cloud Firestore (NoSQL).
- **State:** `AuthContext` manages auth state. Local `useState`/`useEffect` manages form data. 
- **Routing:** `/student` vs `/admin`. Governed by Firestore collections (`admins`, `student_whitelist`).

## Critical Rules
1. **Never use TailwindCSS.** Styling is done via vanilla CSS in `src/styles.css`.
2. **Never alter the hardcoded Super Admin** (`idrislaheri72@gmail.com`) in `firestore.rules` without explicit user permission.
3. **No custom backends.** Do not write Node/Express APIs. Everything routes directly through Firebase client SDKs.
4. **Data fetching is client-side.** Data is loaded inside `useEffect` blocks within the components.

## Business Rules Refresher
- **Authentication is Google ONLY.**
- **Student Email Constraint:** Must be `*@jameasaifiyah.edu` OR exist in `student_whitelist`.
- **TR Uniqueness:** A TR number can only belong to one Google UID (`trIndex`).
- **Auto-Approval:** If `nextQualificationIntent == 'not_now'` AND `requiresAssistance == false`, status auto-sets to `approved`.
- **Form Lock:** If `status == 'approved'`, the student cannot edit their record.

## Firestore Conventions
- **IDs are UIDs:** The ID for a document in `users` and `students` is ALWAYS the Firebase Auth `uid`. Do not auto-generate IDs for these collections.
- **Emails as IDs:** The ID for documents in `admins` and `student_whitelist` is the normalized (lowercase, trimmed) email address.
- **Timestamps:** Always use `serverTimestamp()` from `firebase/firestore` when writing `createdAt`, `updatedAt`, or `submittedAt`.
- **Denormalization:** `students/{uid}` contains a snapshot of the student's name and email so admins don't need to join with `users/{uid}`.

## Security Rules
When modifying database interactions, refer to `firestore.rules`.
- `studentResubmissionKeysOnly()` strictly defines which keys a student can update. If you add a new field to the form, YOU MUST UPDATE THIS RULE.
- Students can never directly modify their `status` unless transitioning from `on-hold` to `pending`.

## Patterns To Follow
- **Service Abstraction:** Keep all Firestore logic inside `src/services/firestore.js`. Do not write `getDoc` or `setDoc` inside React components.
- **Utility Functions:** Keep heavy logic (like auto-approve checks or filtering) in `src/utils/registration.js`.
- **Graceful Error Handling:** Catch Firestore errors and display them via state (`setError(err.message)`).

## Common Mistakes
- **Forgetting to update `firestore.rules`** when adding a new field to the registration form.
- **Mixing up email vs UID.** Remember: Profiles use UID. Admin/Whitelist use Email. TR Index uses TR Number.
- **Assuming Tailwind is present.** It is not. Use standard CSS classes.