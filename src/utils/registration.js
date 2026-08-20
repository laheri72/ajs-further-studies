import { ADMIN_OWNED_FIELDS, EMPTY_REGISTRATION, FORM_VERSION, NEXT_QUALIFICATION_OPTIONS } from '../data/constants';

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
  const trNo = profile?.trNo || trFromStudentEmail(user.email);
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
  delete payload.qualifications;
  delete payload.otherQual;

  return payload;
}

export function canStudentEdit(record) {
  return !record || record.status === 'on-hold' || (record.status === 'pending' && !record.submittedAt);
}

export function nextQualificationLabel(values) {
  const option = NEXT_QUALIFICATION_OPTIONS.find((item) => item.value === values.nextQualificationIntent);
  if (option) return option.shortLabel;
  if (values.hasThoughtAboutNext === true) return 'Planning Next Qualification';
  if (values.hasThoughtAboutNext === false) return 'Not Planning Now';
  return '';
}

export function needsProgrammeDetails(values) {
  if (values.nextQualificationIntent === 'planning') return true;
  if (values.nextQualificationIntent === 'already_pursuing') return true;
  return !values.nextQualificationIntent && values.hasThoughtAboutNext === true;
}

export function isAutoApprovedRegistration(values) {
  return (
    (values.nextQualificationIntent === 'not_now' && values.requiresAssistance === false) ||
    (values.nextQualificationIntent === 'already_pursuing' && values.needsLeavesThisYear === false)
  );
}

export function isAutoApprovedRecord(student) {
  if (!student || student.status !== 'approved') return false;
  if (student.approvalType === 'auto') return true;
  if (student.approvalType === 'manual') return false;
  if (student.reviewedBy) return false;
  return isAutoApprovedRegistration(student);
}

export function isManuallyApprovedRecord(student) {
  if (!student || student.status !== 'approved') return false;
  return !isAutoApprovedRecord(student);
}

export function filterStudents(students, query, status) {
  const q = String(query || '').trim().toLowerCase();
  return students.filter((student) => {
    let matchesStatus = status === 'all' || student.status === status;
    if (status === 'auto-approved') matchesStatus = isAutoApprovedRecord(student);
    if (status === 'manually-approved') matchesStatus = isManuallyApprovedRecord(student);

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
  const approvedRecords = students.filter((student) => student.status === 'approved');
  const autoApproved = approvedRecords.filter((student) => isAutoApprovedRecord(student)).length;
  const manuallyApproved = approvedRecords.length - autoApproved;

  return {
    total: students.length,
    pending: students.filter((student) => student.status === 'pending').length,
    onHold: students.filter((student) => student.status === 'on-hold').length,
    approved: approvedRecords.length,
    autoApproved,
    manuallyApproved,
    clashes: students.filter((student) => student.clashWithMiqaat).length,
    laptopRaza: students.filter((student) => student.needsLaptop).length,
  };
}

export function routeForAuthState({ user, profile, isAdmin, target }) {
  if (!user) return target === 'admin' ? 'admin-login' : 'student-login';
  if (target === 'admin') return isAdmin ? 'admin-dashboard' : 'unauthorized';
  if (!profile?.trNo) return 'profile-link';
  return 'student-dashboard';
}
