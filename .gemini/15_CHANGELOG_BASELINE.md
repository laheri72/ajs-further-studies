# Changelog Baseline (V1 Snapshot)

This document establishes the baseline of the system at the completion of V1. Future audits and changelogs should reference this snapshot.

## Core Features (V1)
- **Google Authentication:** Enforced for all users.
- **Profile Linking:** First-time students must provide TR Number and Full Name to link their EDU Google account.
- **Multi-Step Registration:** 5-step wizard covering Identity, Qualifications, Intent, Programme Details, and Review.
- **Auto-Approval Logic:** Rule-based immediate approval for specific intent paths.
- **Draft Saving:** LocalStorage-based persistence for incomplete forms.
- **Status Dashboard:** Real-time visibility into `Pending`, `On-Hold`, or `Approved` states, including Admin notes.
- **Admin Command Center:** Unified view of all students with stats, search, and filtering.
- **Review Modal:** Admin interface to approve, hold, add notes, or clear registrations.
- **Role Management:** Super Admin UI to add/remove standard admins.
- **Whitelist Management:** Super Admin UI to bypass the EDU email restriction for specific students.
- **Tashjee Workflow:** Independent tab for students to submit academic proof and for admins to review them.

## Current Routes
- `/` -> Redirects to `/student` or `/admin` based on role.
- `/student` -> Student Dashboard / Registration.
- `/admin` -> Admin Command Center.
- `/unauthorized` -> Access Denied.
- `/home` -> Static entry.

## Current Collections (Firestore)
- `users`
- `students`
- `admins`
- `student_whitelist`
- `trIndex`
- `tashjee_config`
- `tashjee_requests`

## Current Limitations & Debt
- Form schema is heavily hardcoded in JSX.
- `StudentPage.jsx` is oversized and handles too many responsibilities.
- Super Admin designation is hardcoded.
- No automated email/SMS notifications for status changes.
- No data export (CSV/PDF) functionality.