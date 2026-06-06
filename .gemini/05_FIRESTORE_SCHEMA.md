# Firestore Schema

## Overview
The application uses Firebase Cloud Firestore as its primary NoSQL database. The schema is highly denormalized, leveraging the Google Auth `uid` or normalized `email` as document IDs to ensure direct, secure document access without complex queries.

## Schema Details

### 1. `users/{uid}`
- **Purpose:** Core profile for an authenticated student.
- **Document ID:** Firebase Auth UID.
- **Fields:**
  - `uid` (string): Duplicate of ID.
  - `email` (string): Google account email.
  - `trNo` (string): 5-digit TR number.
  - `fullName` (string): Student's full name.
  - `photoURL` (string): Profile picture URL from Google.
  - `updatedAt` (timestamp).
- **Permissions:** Read/Write by owner; Read by Admin.

### 2. `students/{uid}`
- **Purpose:** The actual registration data payload.
- **Document ID:** Firebase Auth UID.
- **Fields:**
  - *Identity:* `uid`, `email`, `trNo`, `fullName`.
  - *Qualifications:* `qualifications` (array), `otherQual` (string).
  - *Intent:* `nextQualificationIntent` (string), `hasThoughtAboutNext` (boolean), `stage` (string), `needsLeavesThisYear` (boolean), `requiresAssistance` (boolean).
  - *Programme:* `degreeApplying` (string), `institution` (string), `studyCommitment` (string), `razaDays` (number), `examMonths` (array).
  - *Clash Info:* `clashWithMiqaat` (boolean), `clashEvents` (array), `clashDetails` (string).
  - *Status & Meta:* `status` ('pending' | 'on-hold' | 'approved'), `adminNotes` (string), `submittedAt` (timestamp), `updatedAt` (timestamp), `reviewedAt` (timestamp), `reviewedBy` (string).
- **Permissions:** Create/Update by owner (restricted fields); Read by Owner & Admin; Update (status/notes) by Admin.

### 3. `admins/{email}`
- **Purpose:** Whitelist of authorized administrative personnel.
- **Document ID:** Normalized lowercase email.
- **Fields:**
  - `email` (string).
  - `displayName` (string).
  - `active` (boolean).
  - `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
- **Permissions:** Read by Owner & Super Admin; Write by Super Admin only.

### 4. `student_whitelist/{email}`
- **Purpose:** Allows non-`@jameasaifiyah.edu` Google accounts to act as valid students.
- **Document ID:** Normalized lowercase email.
- **Fields:**
  - `trNo` (string).
  - `fullName` (string).
  - `addedBy` (string).
  - `addedAt` (timestamp).
- **Permissions:** Read by Owner & Admin; Write by Super Admin only.

### 5. `trIndex/{trNo}`
- **Purpose:** Uniqueness constraint table to prevent multiple Google accounts from claiming the same TR number.
- **Document ID:** 5-digit TR number.
- **Fields:**
  - `uid` (string): The UID that claimed it.
  - `email` (string).
  - `trNo` (string).
  - `updatedAt` (timestamp).
- **Permissions:** Create by Student (if not exists); Read by authenticated users.

### 6. `tashjee_requests/{requestId}`
- **Purpose:** Stores academic proof submissions for the Tashjee workflow.
- **Fields:**
  - `requestId` (string).
  - `studentId` (string): Matches UID.
  - `studentName`, `requestType`, `detailedReason`, `proofUrl` (string).
  - `status` ('pending' | 'approved' | 'rejected').
  - `adminRemarks` (string).
  - `createdAt`, `updatedAt`.
- **Permissions:** Create by Student; Read by Owner & Admin; Update by Admin; Delete by Admin or Owner (if pending/on-hold).

### 7. `tashjee_config/{docId}`
- **Purpose:** Global configuration for the Tashjee system (e.g., active types).
- **Permissions:** Read by authenticated users; Write by Admin.