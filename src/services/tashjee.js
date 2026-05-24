import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { TASHJEE_DEFAULT_OPTIONS, TASHJEE_PROOF_MAX_BYTES, normalizeTashjeeOptions } from '../utils/tashjee';

const CLOUDINARY_CLOUD_NAME = 'dzhzvaexh';
const CLOUDINARY_UPLOAD_PRESET = 'Certificates';
const CLOUDINARY_UPLOAD_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
const CLOUDINARY_DELETE_BY_TOKEN_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/delete_by_token`;

function getTashjeeConfigRef() {
  assertFirestoreReady();
  return doc(db, 'tashjee_config', 'program_options');
}

function assertFirestoreReady() {
  if (!db) {
    throw new Error('Firestore is not available. Check your Firebase configuration first.');
  }
}

function cleanRemarks(value) {
  return String(value || '').trim();
}

function validateTashjeeProofFile(file) {
  if (!file) {
    throw new Error('Please choose a proof image before uploading.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Only JPG, JPEG, and PNG images are allowed.');
  }

  if (file.size > TASHJEE_PROOF_MAX_BYTES) {
    throw new Error('Each proof image must be smaller than 2 MB.');
  }
}

export async function ensureTashjeeConfig() {
  const configRef = getTashjeeConfigRef();
  const snapshot = await getDoc(configRef);
  if (!snapshot.exists()) {
    await setDoc(configRef, {
      options: TASHJEE_DEFAULT_OPTIONS,
      updatedAt: serverTimestamp(),
    });
  }
}

export function subscribeTashjeeConfig(onChange, onError) {
  const configRef = getTashjeeConfigRef();
  return onSnapshot(
    configRef,
    (snapshot) => {
      const options = snapshot.exists() ? normalizeTashjeeOptions(snapshot.data()?.options) : TASHJEE_DEFAULT_OPTIONS;
      onChange({
        id: snapshot.id,
        exists: snapshot.exists(),
        options: options.length ? options : TASHJEE_DEFAULT_OPTIONS,
      });
    },
    onError,
  );
}

export function subscribeStudentTashjeeRequests(studentId, onChange, onError) {
  assertFirestoreReady();
  return onSnapshot(
    query(collection(db, 'tashjee_requests'), where('studentId', '==', studentId)),
    (snapshot) => {
      const requests = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      requests.sort((left, right) => (right.createdAt?.seconds || 0) - (left.createdAt?.seconds || 0));
      onChange(requests);
    },
    onError,
  );
}

export function subscribeTashjeeRequestsByStatus(status, onChange, onError) {
  assertFirestoreReady();
  return onSnapshot(
    query(collection(db, 'tashjee_requests'), where('status', '==', status)),
    (snapshot) => {
      const requests = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      requests.sort((left, right) => (right.createdAt?.seconds || 0) - (left.createdAt?.seconds || 0));
      onChange(requests);
    },
    onError,
  );
}

export function subscribePendingTashjeeRequests(onChange, onError) {
  return subscribeTashjeeRequestsByStatus('pending', onChange, onError);
}

export function subscribeApprovedTashjeeRequests(onChange, onError) {
  return subscribeTashjeeRequestsByStatus('approved', onChange, onError);
}

export function subscribePendingTashjeeCount(onChange, onError) {
  assertFirestoreReady();
  return onSnapshot(
    query(collection(db, 'tashjee_requests'), where('status', '==', 'pending')),
    (snapshot) => onChange(snapshot.size),
    onError,
  );
}

export async function uploadTashjeeProof(file) {
  validateTashjeeProofFile(file);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Unable to upload proof document.');
  }

  const payload = await response.json();
  if (!payload?.secure_url) {
    throw new Error('Cloudinary did not return a secure file URL.');
  }

  return {
    proofUrl: payload.secure_url,
    previewUrl: payload.secure_url,
    publicId: payload.public_id,
    deleteToken: payload.delete_token || '',
    assetId: payload.asset_id || '',
    format: payload.format,
  };
}

export async function createTashjeeRequest(user, profile, values, proofUpload) {
  assertFirestoreReady();
  const requestRef = doc(collection(db, 'tashjee_requests'));
  const studentName = String(profile?.fullName || user?.displayName || values.studentName || '').trim();

  await setDoc(requestRef, {
    requestId: requestRef.id,
    studentId: user.uid,
    studentName,
    requestType: values.requestType,
    detailedReason: String(values.detailedReason || '').trim(),
    proofUrl: proofUpload?.proofUrl || '',
    proofPreviewUrl: proofUpload?.previewUrl || '',
    proofPublicId: proofUpload?.publicId || '',
    proofDeleteToken: proofUpload?.deleteToken || '',
    proofAssetId: proofUpload?.assetId || '',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    adminRemarks: '',
  });

  return requestRef.id;
}

export async function updateTashjeeRequestStatus(requestId, status, adminRemarks = '') {
  assertFirestoreReady();
  await updateDoc(doc(db, 'tashjee_requests', requestId), {
    status,
    adminRemarks: cleanRemarks(adminRemarks),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTashjeeRequest(request) {
  assertFirestoreReady();

  if (request?.proofDeleteToken) {
    const response = await fetch(CLOUDINARY_DELETE_BY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({ token: request.proofDeleteToken }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error?.message || 'Unable to delete the uploaded proof from Cloudinary.');
    }
  }

  await deleteDoc(doc(db, 'tashjee_requests', request.id));
}

export async function updateTashjeeConfigOptions(options) {
  const configRef = getTashjeeConfigRef();
  await setDoc(
    configRef,
    {
      options: normalizeTashjeeOptions(options),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
