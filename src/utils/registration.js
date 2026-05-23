import { ADMIN_OWNED_FIELDS, EMPTY_REGISTRATION, FORM_VERSION } from '../data/constants';

export const STUDENT_EMAIL_DOMAIN = '@jameasaifiyah.edu';
export const STUDENT_EMAIL_PATTERN = /^[0-9]{5}@jameasaifiyah\.edu$/i;

export function normalizeTrNo(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidStudentEmail(email) {
  return STUDENT_EMAIL_PATTERN.test(String(email || '').trim());
}

export function trFromStudentEmail(email) {
  if (!isValidStudentEmail(email)) return '';
  return String(email).trim().slice(0, 5);
}

export function nameFromGoogleUser(user) {
  return String(user?.displayName || '').trim() || `Student ${trFromStudentEmail(user?.email)}`;
}

export function draftKey(uid) {
  return `further-studies:${FORM_VERSION}:draft:${uid}`;
}

export function readDraft(uid) {
  if (!uid) return null;
  try {
    const raw = window.localStorage.getItem(draftKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(uid, value) {
  if (!uid) return;
  window.localStorage.setItem(draftKey(uid), JSON.stringify(value));
}

export function clearDraft(uid) {
  if (!uid) return;
  window.localStorage.removeItem(draftKey(uid));
}

export function studentWritablePayload(values, profile, user) {
  const trNo = trFromStudentEmail(user.email);
  const payload = {
    ...EMPTY_REGISTRATION,
    ...values,
    uid: user.uid,
    email: user.email,
    trNo,
    fullName: String(values.fullName || profile?.fullName || '').trim(),
    razaDays: Number(values.razaDays || 0),
  };

  for (const field of ADMIN_OWNED_FIELDS) {
    delete payload[field];
  }

  return payload;
}

export function canStudentEdit(record) {
  return !record || record.status === 'pending';
}

export function filterStudents(students, query, status) {
  const q = String(query || '').trim().toLowerCase();
  return students.filter((student) => {
    const matchesStatus = status === 'all' || student.status === status;
    const haystack = [
      student.trNo,
      student.fullName,
      student.email,
      student.degreeApplying,
      student.institution,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return matchesStatus && (!q || haystack.includes(q));
  });
}

export function statsForStudents(students) {
  return {
    total: students.length,
    pending: students.filter((student) => student.status !== 'approved').length,
    approved: students.filter((student) => student.status === 'approved').length,
    clashes: students.filter((student) => student.clashWithMiqaat).length,
  };
}

export function routeForAuthState({ user, profile, isAdmin, target }) {
  if (!user) return target === 'admin' ? 'admin-login' : 'student-login';
  if (target === 'admin') return isAdmin ? 'admin-dashboard' : 'unauthorized';
  if (!profile?.trNo) return 'profile-link';
  return 'student-dashboard';
}
