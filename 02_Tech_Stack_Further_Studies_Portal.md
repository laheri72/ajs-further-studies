# Further Studies Portal — Technology Stack

## 1. Recommended stack summary

The best fit for this app is a Firebase-first stack with a single-page frontend and Firestore persistence.

### Frontend
- HTML, CSS, JavaScript if keeping the app as a single deployable file
- Or React if turning it into a maintainable codebase
- Firebase SDK for Authentication and Firestore
- Optional UI icons from a lightweight icon set

### Backend / platform
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting or Netlify
- Firestore security rules
- Optional Cloud Functions later for advanced workflows

## 2. Recommended implementation paths

### Path A: Single-file launch version
Use this when the goal is to deploy fast.

**Pros**
- Extremely quick to build
- Easy to drag-and-drop on Netlify
- Minimal setup
- Perfect for prototype or first launch

**Cons**
- Harder to maintain as complexity grows
- Logic and UI are in one file
- Reuse is limited

### Path B: Production maintainable version
Use this when the goal is long-term development.

**Pros**
- Easier to scale
- Cleaner component separation
- Better testing
- Better teamwork with Codex or developers

**Cons**
- More setup time
- Slightly more complex deployment

## 3. Recommended stack for Codex build

### Option 1: Firebase + React + Vite
Best if you want a professional SaaS codebase.

- **UI framework**: React
- **Build tool**: Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Auth**: Firebase Authentication
- **Database**: Firestore
- **Hosting**: Firebase Hosting or Netlify
- **Form validation**: React Hook Form + Zod
- **State management**: React Context or Zustand
- **Icons**: lucide-react

### Option 2: Firebase + Vanilla JS
Best if you want a single HTML file.

- **UI**: HTML/CSS/JS
- **Auth**: Firebase Auth compat or modular SDK
- **DB**: Firestore
- **Hosting**: Netlify
- **No build step**
- **All logic inline**

## 4. Firebase data model

### `users`
One document per signed-in student.
Suggested fields:
- `uid`
- `trNo`
- `fullName`
- `email`
- `photoURL`
- `updatedAt`

### `students`
One document per student registration.
Suggested fields:
- `uid`
- `email`
- `trNo`
- `fullName`
- `qualifications` array
- `otherQual`
- `hasThoughtAboutNext` boolean
- `stage` string
- `requiresAssistance` boolean
- `degreeApplying`
- `institution`
- `studyCommitment`
- `razaDays`
- `examMonths` array
- `clashWithMiqaat` boolean
- `clashEvents` array
- `clashDetails`
- `additionalNotes`
- `status` string
- `adminNotes`
- `submittedAt`
- `updatedAt`
- `reviewedAt`

### `admins`
Document ID should be the admin email.
Suggested fields:
- `email`
- `role`
- `active`

## 5. Authentication strategy

### Students
- Sign in with Google.
- On first login, link TR number and name to UID.
- Use the Firebase UID as the real record key.

### Admins
- Sign in with Google.
- Check Firestore `admins` collection.
- If email exists, allow dashboard access.
- If not, show access denied page.

## 6. Security strategy

### Firestore rules concept
- Students can read and write only their own profile and record.
- Admins can read all student records.
- Only admins can change status and notes.
- Admin whitelist should be checked before privileged UI opens.

### Important note
If the app is launched as a single HTML file, the UI can enforce admin access, but Firestore security rules must still protect the database. The database should never rely on UI checks alone.

## 7. Deployment stack

### Fastest deployment
- Netlify manual deploy
- Drag and drop the HTML file
- Add Firebase authorized domain
- Set environment values inside the file

### More production-ready deployment
- Firebase Hosting or Netlify with build pipeline
- GitHub repository
- Continuous deploy on push

## 8. Suggested libraries

### If using React
- `firebase`
- `react-router-dom`
- `framer-motion`
- `lucide-react`
- `tailwindcss`
- `zod`
- `react-hook-form`
- `@hookform/resolvers`
- `clsx`
- `tailwind-merge`

### If using vanilla JS
- Firebase CDN scripts
- No extra libraries required
- Optional lightweight helper for date formatting or validation

## 9. Why this stack fits the portal

- Firebase handles authentication and record storage without a custom backend server.
- Firestore naturally fits student profile and status records.
- Google Auth gives the authenticity you asked for.
- Netlify or Firebase Hosting gives a real shareable link.
- A single-page app structure fits the student/admin route split.

## 10. Performance and scalability notes

- Keep the student registration step component isolated.
- Load admin table data only after auth passes.
- Use pagination or lazy loading later if records grow large.
- Keep Firestore documents denormalized enough for quick reads.
- Add indexes for admin search/filter queries if needed.

## 11. Codex build instructions

When prompting Codex, ask it to:
- create reusable data models,
- separate auth logic from UI logic,
- implement role-based routing,
- keep Firestore access functions in one service layer,
- validate each form step,
- preserve the existing visual identity,
- make the app production-ready, not just visually polished.
