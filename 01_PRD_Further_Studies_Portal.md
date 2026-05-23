# Further Studies Portal — Product Requirements Document (PRD)

## 1. Product vision

Build a secure, elegant portal for Jamea’s further studies process. The portal should help students register academic plans beyond Jamea, submit raza-related information, and check their status later. It should also give Idara staff a clean admin dashboard to review submissions, update statuses, and leave notes.

The experience should feel trustworthy, premium, and institutionally serious rather than like a generic form app.

## 2. Problem statement

The current process for further studies and raza coordination is manual, fragmented, and difficult to track. Students need one reliable place to:
- sign in with their real identity,
- submit their academic details once,
- return later to see whether their request is pending or approved,
- read any note from the Idara.

Idara staff need one internal dashboard to:
- see all student records,
- search quickly by TR number, name, email, degree, or status,
- review clash information,
- approve or keep pending,
- leave notes visible to students.

## 3. Goals

### User goals
- Students authenticate with Google instead of TR number or name.
- Students complete a guided multi-step form.
- Students can return later and see their live raza status.
- Admins can review, filter, and update records from one dashboard.

### Business goals
- Replace manual tracking with structured digital records.
- Reduce back-and-forth messages for status checks.
- Ensure each student record is tied to a real authenticated account.
- Improve clarity for both students and Idara staff.

## 4. Core product principles

1. **Google-first identity**  
   Login must be based on Google Authentication. TR number is collected only after sign-in to link the account.

2. **Two-role system**  
   Student and admin experiences must be separate, with routing based on role and admin whitelist.

3. **Structured data capture**  
   The form must collect all academic and clash-related information in a structured format.

4. **Status clarity**  
   Every student should always see a clear pending/approved state and any admin note.

5. **Elegant, calm UI**  
   Design must feel premium, polished, and institutionally appropriate.

6. **Firebase-backed simplicity**  
   Use Firebase Authentication and Firestore so the app can be deployed quickly and scaled later.

## 5. Target users

### Students
- Existing Jamea students exploring further studies.
- Students applying for raza or istirshaad araz.
- Students who need guidance around exams and event clashes.

### Admin / Idara staff
- Staff who review records.
- Staff who update raza status.
- Staff who add notes for the student.
- Staff who need search and filtering across many records.

## 6. User journeys

### Student journey
1. Open the student portal route.
2. Sign in with Google.
3. If first visit, enter TR number and full name once to link the account.
4. Complete the step-by-step registration:
   - qualifications acquired,
   - whether they are considering the next qualification,
   - stage of process if yes,
   - degree/institution/study commitment/raza days/exam month/clash details,
   - review and submit.
5. Return later to view live status.
6. Read any note from the Idara.

### Admin journey
1. Open the admin portal route.
2. Sign in with Google.
3. System checks if email exists in `admins`.
4. If authorized, admin dashboard loads.
5. Admin searches student records.
6. Admin opens a record, reviews details, updates status, and saves notes.
7. Student sees updated status and notes on their dashboard.

## 7. Functional requirements

### 7.1 Authentication
- Google Sign-In only.
- No password-based login.
- Student login is by Google identity.
- Admin access is role-gated by Firestore whitelist.
- The app must support separate hash routes:
  - `#student`
  - `#admin`

### 7.2 Student profile linking
- After first Google sign-in, the student enters TR number and full name once.
- Profile data is stored under the Firebase UID.
- Subsequent visits should load the student dashboard directly if a record already exists.

### 7.3 Student registration form
The form must include:

**Personal identity**
- TR number
- Full name
- Google email (read-only)

**Qualifications acquired**
- Multi-select card grid
- Include options such as:
  - Hifz ul Quran
  - Dars-e-Nizami (Alimiyah)
  - Jamea Diploma
  - Jamea Certificate
  - Bachelor’s Degree
  - Master’s Degree
  - PhD
  - Other

**Next qualification intent**
- Yes / No
- If yes, stage selection:
  - I have decided and would like to apply for raza
  - I am still considering my options and would like to do an istirshaad araz
  - I need more time to do research before doing any araz
- If no, ask whether the Idara should help them plan ahead

**Programme details**
- Degree / programme applying for
- Institution / university
- Study commitment
- Number of raza days required in the year
- Month(s) exams are likely to fall in
- Whether exams clash with any Miqaat or Jamea event
- If yes, choose specific clash events
- Additional notes for Idara

**Review**
- Final summary before submit
- Show all key data in a readable layout

### 7.4 Student status display
- After submission, show pending state by default.
- If approved, show approved state.
- Show admin notes if available.
- Student can revisit and see the most recent status without re-submitting.

### 7.5 Admin dashboard
- Show statistics cards:
  - total students
  - pending
  - approved
  - miqaat clashes
- Search records by TR number, full name, email, degree, and other key fields.
- Filter by status.
- List students in a responsive table.
- Open a detailed modal per student.
- Update status from pending to approved.
- Save notes visible to student.

### 7.6 Data persistence
- Use Firestore collections for all records.
- Store profile and registration data under Firebase UID.
- Store admin whitelist in `admins`.
- Store student registrations in `students`.
- Use timestamps for created/updated/reviewed fields.

## 8. Non-functional requirements

### Security
- Only whitelisted admin emails may access admin dashboard.
- Firestore rules must protect sensitive collections.
- Sensitive updates should be role-aware.

### Performance
- Fast first render.
- Smooth step transitions.
- Keep Firestore reads minimal.
- Lazy-load dashboard data only after auth.

### Usability
- Mobile responsive.
- Clear validation messages.
- Persistent form state during step navigation.
- High-contrast status indicators.

### Reliability
- Handle missing Firebase config gracefully.
- Handle popup-blocked Google sign-in.
- Handle empty search results and empty dashboards.
- Avoid data loss on refresh.

## 9. Scope

### In scope
- Google sign-in
- Student onboarding
- Multi-step registration
- Admin review workflow
- Status updates and notes
- Firebase-backed persistence
- Student and admin routes

### Out of scope for first release
- Notifications by email/SMS
- PDF export
- Deep analytics
- Multi-language support
- Offline mode
- Advanced audit logs

## 10. MVP success criteria

- Student can sign in and submit a record.
- Student can later view pending or approved status.
- Admin can find and update records.
- Data persists after refresh and across sessions.
- Admin access is restricted to the whitelist.
- UI feels polished and trustworthy.

## 11. Suggested future enhancements

- Export records as CSV/PDF
- Email alert when status changes
- Audit trail for admin actions
- Better role management
- Search suggestions and saved filters
- Support for attachments or supporting documents
- Dashboard charts for application trends

## 12. Acceptance checklist

- [ ] Google login works for students and admins
- [ ] First-time student profile linking works
- [ ] Registration form saves all fields
- [ ] Status page shows pending/approved states
- [ ] Admin whitelist blocks unauthorized users
- [ ] Admin can search and manage records
- [ ] Notes appear on student dashboard
- [ ] App works on mobile and desktop
- [ ] Firebase config can be pasted into a single file
