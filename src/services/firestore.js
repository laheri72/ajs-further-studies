import {
  collection,
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
import { normalizeTrNo, studentWritablePayload } from '../utils/registration';

export async function getProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function linkStudentProfile(user, values) {
  const trNo = normalizeTrNo(values.trNo);
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
        fullName: values.fullName.trim(),
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

  if (existingRecord) {
    await updateDoc(studentRef, {
      ...payload,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(studentRef, {
    ...payload,
    status: 'pending',
    adminNotes: '',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function isWhitelistedAdmin(email) {
  if (!email) return false;
  const snapshot = await getDoc(doc(db, 'admins', email));
  return snapshot.exists() && snapshot.data().active === true;
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
