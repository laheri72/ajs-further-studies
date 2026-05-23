# Further Studies Portal

A production-ready React + Firebase portal for Jamea further-studies registration and Idara review.

## Stack

- React + Vite
- Firebase Authentication with Google sign-in only
- Cloud Firestore
- React Hook Form + Zod validation
- Firestore security rules
- Firebase Hosting or Netlify SPA deployment

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example`:

   ```bash
   cp .env.example .env
   ```

3. Add your Firebase web app values to `.env`.

4. In Firebase Console:

   - Enable Authentication > Google provider.
   - Create a Firestore database.
   - Publish `firestore.rules`.
   - Add your local/dev domain to Authentication authorized domains if needed.

5. Seed the first admin manually in Firestore:

   Collection: `admins`

   Document ID: `admin@example.com`

   Fields:

   ```json
   {
     "email": "admin@example.com",
     "role": "admin",
     "active": true
   }
   ```

6. Run locally:

   ```bash
   npm run dev
   ```

## Routes

- `/` home entry
- `/student` student portal
- `/admin` admin portal
- Legacy shortcuts `#student` and `#admin` redirect to clean routes.

## Data Model

- `users/{uid}`: one student profile per Google account.
- `students/{uid}`: one student registration per Google account.
- `trIndex/{trNo}`: TR collision prevention, maps one TR number to one UID.
- `admins/{email}`: admin whitelist and role source of truth.

V1 status values are strict: `pending` and `approved`.

Students may edit their registration only while status is `pending`. Approved records become read-only in the student portal. Admin-owned fields are `status`, `adminNotes`, `reviewedAt`, and `reviewedBy`; student writes never include those fields.

## Verification

```bash
npm run lint
npm run test
npm run build
```

Live Google sign-in and Firestore read/write QA require real Firebase env values.

## Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy
```

`firebase.json` rewrites all clean app routes to `index.html`.

### Netlify

Connect the repository and use:

- Build command: `npm run build`
- Publish directory: `dist`

`netlify.toml` includes the SPA rewrite.
