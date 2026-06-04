import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  isAutoApprovedRegistration,
  isValidStudentEmail,
  nameFromGoogleUser,
  studentWritablePayload,
  trFromStudentEmail,
} from '../utils/registration';

export async function getProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function linkStudentProfile(user) {
  let trNo = '';
  let fullName = nameFromGoogleUser(user);

  if (!isValidStudentEmail(user.email)) {
    const whitelistSnapshot = await getDoc(doc(db, 'student_whitelist', user.email.toLowerCase()));
    if (!whitelistSnapshot.exists()) {
      throw new Error('Please sign in with your Jamea Saifiyah education account.');
    }
    const data = whitelistSnapshot.data();
    trNo = data.trNo;
    if (data.fullName) fullName = data.fullName;
  } else {
    trNo = trFromStudentEmail(user.email);
  }

  const trRef = doc(db, 'trIndex', trNo);
  const userRef = doc(db, 'users', user.uid);

  await runTransaction(db, async (transaction) => {
    const trSnapshot = await transaction.get(trRef);
    if (trSnapshot.exists() && trSnapshot.data().uid !== user.uid) {
      throw new Error('This TR number is already linked to another Google account. Please contact the Idara.');
    }

    transaction.set(trRef, {
      uid: user.uid,
      email: user.email,
      trNo,
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      userRef,
      {
        uid: user.uid,
        trNo,
        fullName,
        email: user.email,
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

export async function getStudentRecord(uid) {
  const snapshot = await getDoc(doc(db, 'students', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function saveStudentRegistration(user, profile, values, existingRecord) {
  const studentRef = doc(db, 'students', user.uid);
  const payload = studentWritablePayload(values, profile, user);
  const nextStatus = isAutoApprovedRegistration(payload) ? 'approved' : 'pending';
  const completingUnsubmittedPending = existingRecord?.status === 'pending' && !existingRecord.submittedAt;

  if (existingRecord) {
    await updateDoc(studentRef, {
      ...payload,
      ...(existingRecord.status === 'on-hold' || completingUnsubmittedPending ? { status: nextStatus } : {}),
      ...(completingUnsubmittedPending ? { submittedAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(studentRef, {
    ...payload,
    status: nextStatus,
    adminNotes: '',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function isWhitelistedAdmin(email) {
  if (!email) return false;
  const snapshot = await getDoc(doc(db, 'admins', email.trim().toLowerCase()));
  return snapshot.exists() && snapshot.data().active === true;
}

export async function getAdmins() {
  const snapshot = await getDocs(collection(db, 'admins'));
  return snapshot.docs
    .map((record) => {
      const data = record.data();
      return {
        id: record.id,
        ...data,
        email: data.email || record.id,
        displayName: data.displayName || '',
      };
    })
    .sort((first, second) => first.email.localeCompare(second.email));
}

export async function addAdmin(email, actor, displayName = '') {
  const normalizedEmail = email.trim().toLowerCase();
  const adminRef = doc(db, 'admins', normalizedEmail);
  const snapshot = await getDoc(adminRef);
  const payload = {
    email: normalizedEmail,
    displayName: displayName.trim(),
    active: true,
    updatedAt: serverTimestamp(),
    updatedBy: actor.email,
  };

  if (snapshot.exists()) {
    await updateDoc(adminRef, payload);
    return { id: normalizedEmail, ...snapshot.data(), ...payload, active: true };
  }

  await setDoc(adminRef, {
    ...payload,
    createdAt: serverTimestamp(),
    createdBy: actor.email,
  });
  return { id: normalizedEmail, ...payload, createdBy: actor.email };
}

export async function deleteAdmin(email) {
  const normalizedEmail = email.trim().toLowerCase();
  await deleteDoc(doc(db, 'admins', normalizedEmail));
}

export async function getWhitelistedStudents() {
  const snapshot = await getDocs(query(collection(db, 'student_whitelist'), orderBy('trNo')));
  return snapshot.docs.map((record) => ({
    id: record.id,
    ...record.data(),
    email: record.id,
  }));
}

export async function addWhitelistedStudent(email, trNo, fullName, actor) {
  const normalizedEmail = email.trim().toLowerCase();
  const docRef = doc(db, 'student_whitelist', normalizedEmail);
  const payload = {
    trNo: trNo.trim(),
    fullName: fullName.trim(),
    addedBy: actor.email,
    addedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload);
  return { id: normalizedEmail, email: normalizedEmail, ...payload };
}

export async function deleteWhitelistedStudent(email) {
  await deleteDoc(doc(db, 'student_whitelist', email.trim().toLowerCase()));
}

export async function getAllStudents() {
  const snapshot = await getDocs(query(collection(db, 'students'), orderBy('submittedAt', 'desc')));
  return snapshot.docs.map((record) => ({ id: record.id, ...record.data() }));
}

export async function updateStudentReview(uid, reviewer, status, adminNotes) {
  await updateDoc(doc(db, 'students', uid), {
    status,
    adminNotes: adminNotes.trim(),
    reviewedAt: serverTimestamp(),
    reviewedBy: reviewer.email,
    updatedAt: serverTimestamp(),
  });
}

export async function clearStudentRegistration(uid) {
  await deleteDoc(doc(db, 'students', uid));
}
