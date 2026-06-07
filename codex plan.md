Plan
Further Studies Portal Refactor Plan
Summary
Refactor the student portal to separate academic history from the registration submission, remove the redundant standalone Raza Status tab, and add a Cloudinary-backed hall-ticket/exam-proof flow. Preserve existing students/{uid} records, admin review behavior, auto-approval logic, and Firestore Standard edition rules for the (default) database in asia-south1.

Key Changes
Student navigation becomes: Registration, Qualifications, Tashjee Request, with status shown prominently inside the registration/overview area rather than as a separate Raza Status tab.
Registration stepper changes from Details -> Qualifications -> Next Steps -> Programme -> Review to Details -> Next Steps -> Programme/Exam Proof -> Review.
Remove qualification validation from registration; keep legacy qualification fields readable for older records only.
Add a dedicated Qualifications tab supporting add/edit/remove rows with:
title, institute, yearObtained, grade, notes, createdAt, updatedAt.
Add hall-ticket proof handling for students who are already pursuing a course and for exam confirmation:
uploaded, not_generated_yet, or missing.
Reuse the existing Cloudinary upload pattern from Tashjee: image-only, 2 MB limit, upload state, retry/error handling, and Firestore metadata-only storage.
Firestore Schema
Keep users/{uid} for profile and students/{uid} for registration/admin review.
Add students/{uid}/qualifications/{qualificationId}:
student-owned academic history rows; admins can read; students can create/update/delete their own rows.
Add students/{uid}/examProof/current:
one current hall-ticket/proof record with state, optional proofUrl, proofPreviewUrl, proofPublicId, proofAssetId, proofDeleteToken, format, updatedAt.
Keep legacy students/{uid}.qualifications and otherQual allowed for old records but remove them from new registration UI and new student payload writes.
Admin review modal loads each selected student’s qualifications and exam proof on open, then displays proof status and preview/open-link clearly.
Implementation Changes
Update constants and validation:
remove QUALIFICATIONS from the registration flow, update STUDENT_STEPS, and remove qualification requirements from registrationSchema and step validation.
Update student state/data services:
add Firestore helpers for listing/saving/deleting qualifications and reading/saving exam proof.
add shared Cloudinary helpers/config so Tashjee and exam proof use one upload validation path; keep existing hardcoded Cloudinary values as fallback unless env values exist.
Update student UI:
default active tab becomes registration;
integrate a StatusPanel into registration/overview;
add QualificationsTab;
add ExamProofPanel inside the relevant registration step and final review.
Update admin UI:
include proof status/preview and qualifications in ReviewModal;
show a compact proof indicator in the records table if practical without requiring new composite indexes.
Update Firestore rules:
add strict validators for qualification and exam-proof documents;
students can only manage their own subcollection docs;
admins can read all relevant data and update only admin review fields on students/{uid};
preserve existing Tashjee rules.
Update docs:
align README.md/GEMINI.md with new schema, navigation, Cloudinary config, and migration notes.
Migration Strategy
No destructive migration.
Existing student records continue rendering even if they contain legacy qualifications.
Qualifications tab shows saved subcollection rows first; if none exist and legacy qualification data exists, show a clearly labeled legacy academic history section.
New submissions do not write registration qualification fields, preventing new duplicate data.
Old records with no exam proof render as missing; old approved/pending/on-hold statuses remain unchanged.
Test Plan
Update Vitest tests for registration validation, auto-approval, student payload stripping, and removed qualification requirement.
Add tests for qualification normalization/validation helpers and exam-proof file validation/state labels.
Run:
npm run test
npm run lint
npm run build
Validate Firestore rules syntax with Firebase CLI dry-run/deploy validation before release.
Manual QA:
new student with zero qualifications;
many qualifications;
already pursuing + upload success;
already pursuing + not generated yet;
upload failure and retry;
Cloudinary succeeds but Firestore save fails;
admin opens legacy record;
admin opens new record with proof;
approved records remain read-only.
Assumptions
Use students/{uid} subcollections for qualifications and exam proof because they naturally scope ownership and simplify rules.
Hall-ticket uploads are image-only under 2 MB, matching the existing Tashjee proof limit.
No new libraries are needed.
Cloudinary credentials remain compatible with the existing dzhzvaexh / Certificates v1 setup, with optional env overrides added for maintainability.
