# Further Studies Portal — Workflow Specification

## 1. System overview

The app has two main journeys:
- Student journey
- Admin journey

Each journey is routed from the same app shell but behaves differently based on authentication and role.

## 2. High-level flow

1. User opens the portal.
2. App shows home screen.
3. User chooses Student or Admin.
4. Google sign-in happens.
5. App checks whether the user is a student or authorized admin.
6. App loads the correct branch.
7. User completes the relevant workflow.
8. Data persists in Firestore.
9. Returning users see their saved state.

## 3. Student workflow

### Step 0 — Entry
- Student opens `#student`.
- If not signed in, show student login screen.
- Student signs in with Google.

### Step 1 — Profile linking
- If student has no linked profile:
  - ask for TR number,
  - ask for full name,
  - lock Google email as identity reference,
  - save profile under UID.

### Step 2 — Qualifications
- Student selects all qualifications already acquired.
- If “Other” is chosen, show a text field to specify.

### Step 3 — Next qualification intent
Student answers:
- Have you thought about acquiring the next qualification?

Possible outcomes:
- **Yes**
  - show stage selection
- **No**
  - ask whether Idara assistance is needed for planning ahead

### Step 4 — Stage selection if yes
Student selects one stage:
- I have decided and would like to apply for raza
- I am still considering my options and would like to do an istirshaad araz
- I need more time to do research before doing any araz

### Step 5 — Programme details
Collect:
- degree / programme
- institution
- study commitment
- number of raza days per year
- exam month(s)
- clash with Miqaat or Jamea event?
- clash events if yes
- extra notes

### Step 6 — Review
- Show all entered details clearly.
- Allow student to go back and edit before submit.

### Step 7 — Submit
- Save registration in Firestore.
- Set status to pending by default.
- Save timestamps.
- Return to student dashboard.

### Step 8 — Return visits
- Student sees current status immediately.
- If pending, display pending message.
- If approved, display approved message.
- If admin notes exist, display them too.

## 4. Admin workflow

### Step 0 — Entry
- Admin opens `#admin`.
- If not signed in, show admin login screen.
- Admin signs in with Google.

### Step 1 — Authorization check
- Check signed-in email against `admins` collection.
- If email is not whitelisted:
  - show unauthorized page
  - prevent access to dashboard

### Step 2 — Dashboard load
- Load all student records.
- Render summary stats.
- Render table and filters.

### Step 3 — Search and filter
Admin can:
- search by TR number
- search by name
- search by email
- search by degree
- filter by status

### Step 4 — Review a record
- Admin clicks manage/open.
- Modal shows:
  - identity
  - qualifications
  - next qualification intent
  - stage
  - programme details
  - exam months
  - clash details
  - notes from student
  - current admin notes

### Step 5 — Update status
- Admin sets status to pending or approved.
- Admin writes notes for the student.
- Admin saves changes.

### Step 6 — Student receives update
- Student dashboard reflects the new status and notes on next visit or refresh.

## 5. State machine

### Student states
- `guest`
- `google_signed_in`
- `profile_missing`
- `profile_linked`
- `form_in_progress`
- `submitted`
- `status_pending`
- `status_approved`

### Admin states
- `guest`
- `google_signed_in`
- `unauthorized`
- `authorized`
- `dashboard_loading`
- `dashboard_ready`
- `record_open`
- `saving_changes`

## 6. Form state rules

- Step validation should block moving forward if required fields are missing.
- Data should be collected into a single in-memory object.
- Choosing “No” for next qualification should skip the stage-selection branch.
- Choosing “Yes” should require a stage selection.
- If clash is “Yes”, the event picker should appear.
- Review should always reflect the latest state before submit.

## 7. Routing rules

### Hash routes
- `#` home
- `#student`
- `#admin`

### Student route logic
- If signed out: student login
- If signed in and profile missing: profile setup
- If signed in and profile exists: student dashboard

### Admin route logic
- If signed out: admin login
- If signed in but not whitelisted: unauthorized screen
- If whitelisted: admin dashboard

## 8. Data flow

### Student save flow
1. Save profile to `users/{uid}`.
2. Save registration to `students/{uid}`.
3. Record timestamps.
4. Keep status default as pending.

### Admin update flow
1. Open student record.
2. Change status.
3. Save admin notes.
4. Update reviewed timestamp.
5. Refresh local table state.

## 9. Error handling workflow

### Authentication errors
- popup blocked
- popup closed
- Google auth failure

### Data errors
- Firestore read failure
- Firestore write failure
- missing config
- unauthorized admin access

### UX fallback behavior
- show readable errors
- do not crash page
- keep user on current step when submit fails
- re-enable buttons after failure

## 10. Empty and edge states

### Empty student state
- No linked profile yet
- No registration yet
- No status yet

### Empty admin state
- No student registrations
- No search results
- no authorized admins matched

### Edge conditions
- Multiple sign-ins on same device
- Refresh during form fill
- First-time admin on new browser
- Student switching accounts
- Missing Firebase config

## 11. Deployment workflow

1. Paste Firebase config.
2. Enable Google provider.
3. Create Firestore database.
4. Add admin emails to `admins`.
5. Deploy app.
6. Add domain to authorized domains.
7. Test both student and admin routes.
8. Verify create, read, update, and status display.

## 12. Suggested QA checklist

### Student QA
- sign in works
- profile saves
- each step validates
- review shows correct values
- submission persists
- return visit shows status
- admin note appears

### Admin QA
- unauthorized users are blocked
- whitelisted admins can enter
- table loads correctly
- search works
- status updates save
- student sees update later

### Cross-device QA
- login persists correctly
- records follow the Google UID
- dashboard state survives refresh
- styling is responsive on mobile

## 13. What Codex should produce

Ask Codex for:
- polished UI
- working Firebase integration
- correct role routing
- step-based student form
- searchable admin dashboard
- clean Firestore schema
- notes and status updates
- mobile responsiveness
- ready-to-deploy final output
