import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { deleteCloudinaryByToken, uploadCloudinaryImage } from './cloudinary';
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

export async function getStudentQualifications(uid) {
  const snapshot = await getDocs(query(collection(db, 'students', uid, 'qualifications'), orderBy('updatedAt', 'desc')));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export async function saveStudentQualification(uid, user, values, proofFile = null, qualificationId = '') {
  const qualificationRef = qualificationId
    ? doc(db, 'students', uid, 'qualifications', qualificationId)
    : doc(collection(db, 'students', uid, 'qualifications'));
    
  let proofUpload = null;
  if (proofFile) {
    proofUpload = await uploadCloudinaryImage(proofFile, 'Unable to upload proof image.');
  }

  const payload = {
    title: String(values.title || '').trim(),
    institute: String(values.institute || '').trim(),
    yearObtained: String(values.yearObtained || '').trim(),
    grade: String(values.grade || '').trim(),
    percentage: values.percentage ? Number(values.percentage) : null,
    notes: String(values.notes || '').trim(),
    studentName: user.displayName || user.fullName || '',
    studentEmail: user.email,
    trNo: user.trNo || '',
    updatedAt: serverTimestamp(),
  };

  if (proofUpload) {
    payload.proofUrl = proofUpload.proofUrl;
    payload.proofPreviewUrl = proofUpload.previewUrl;
    payload.proofPublicId = proofUpload.publicId;
    payload.proofAssetId = proofUpload.assetId;
    payload.proofDeleteToken = proofUpload.deleteToken;
    payload.format = proofUpload.format;
  }

  if (!payload.title) {
    throw new Error('Qualification title is required.');
  }

  await setDoc(
    qualificationRef,
    {
      ...payload,
      ...(qualificationId ? {} : { createdAt: serverTimestamp(), status: 'pending', adminNotes: '' }),
    },
    { merge: true },
  );

  return qualificationRef.id;
}

export async function deleteStudentQualification(uid, qualificationId) {
  const ref = doc(db, 'students', uid, 'qualifications', qualificationId);
  const snapshot = await getDoc(ref);
  
  if (snapshot.exists()) {
    const data = snapshot.data();
    if (data.proofDeleteToken) {
      await deleteCloudinaryByToken(data.proofDeleteToken).catch(() => null);
    }
  }
  
  await deleteDoc(ref);
}

export function subscribePendingResults(onChange, onError) {
  return onSnapshot(
    query(collectionGroup(db, 'qualifications'), where('status', '==', 'pending')),
    (snapshot) => {
      const results = snapshot.docs.map((entry) => ({
        id: entry.id,
        studentId: entry.ref.parent.parent?.id || 'unknown',
        ...entry.data(),
      }));
      results.sort((left, right) => (right.createdAt?.seconds || 0) - (left.createdAt?.seconds || 0));
      onChange(results);
    },
    onError,
  );
}

export function subscribeAllResults(onChange, onError) {
  return onSnapshot(
    query(collectionGroup(db, 'qualifications')),
    (snapshot) => {
      const results = snapshot.docs.map((entry) => ({
        id: entry.id,
        studentId: entry.ref.parent.parent?.id || 'unknown',
        ...entry.data(),
      }));
      results.sort((left, right) => (right.createdAt?.seconds || 0) - (left.createdAt?.seconds || 0));
      onChange(results);
    },
    onError,
  );
}

export async function updateResultStatus(studentId, resultId, status, adminNotes) {
  await updateDoc(doc(db, 'students', studentId, 'qualifications', resultId), {
    status,
    adminNotes: String(adminNotes || '').trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function getExamProof(uid) {
  const snapshot = await getDoc(doc(db, 'students', uid, 'examProof', 'current'));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function saveExamProofNotGenerated(uid) {
  await setDoc(
    doc(db, 'students', uid, 'examProof', 'current'),
    {
      state: 'not_generated_yet',
      proofUrl: '',
      proofPreviewUrl: '',
      proofPublicId: '',
      proofAssetId: '',
      proofDeleteToken: '',
      format: '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function uploadExamProof(uid, file) {
  const proofUpload = await uploadCloudinaryImage(file, 'Unable to upload hall ticket.');
  await setDoc(
    doc(db, 'students', uid, 'examProof', 'current'),
    {
      state: 'uploaded',
      proofUrl: proofUpload.proofUrl,
      proofPreviewUrl: proofUpload.previewUrl,
      proofPublicId: proofUpload.publicId,
      proofAssetId: proofUpload.assetId,
      proofDeleteToken: proofUpload.deleteToken,
      format: proofUpload.format,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return getExamProof(uid);
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

export async function getRecentStudents(limitCount = 1) {
  const snapshot = await getDocs(query(collection(db, 'students'), orderBy('submittedAt', 'desc'), limit(limitCount)));
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
