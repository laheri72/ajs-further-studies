import { describe, expect, it } from 'vitest';
import { EMPTY_REGISTRATION } from '../data/constants';
import {
  examProofStateLabel,
  isProofImageFile,
  PROOF_IMAGE_MAX_BYTES,
} from '../utils/proofUpload';
import {
  canStudentEdit,
  filterStudents,
  isAutoApprovedRegistration,
  isValidStudentEmail,
  needsProgrammeDetails,
  nextQualificationLabel,
  normalizeTrNo,
  routeForAuthState,
  statsForStudents,
  studentWritablePayload,
  trFromStudentEmail,
} from '../utils/registration';
import { isTashjeeProofFile, isTashjeeRequestDeletable, normalizeTashjeeOptions, TASHJEE_PROOF_MAX_BYTES } from '../utils/tashjee';
import { validateRegistration, validateRegistrationStep } from '../utils/validation';

const user = { uid: 'uid-1', email: '25687@jameasaifiyah.edu' };
const profile = { trNo: 'TR100', fullName: 'Student One' };

function validValues(overrides = {}) {
  return {
    ...EMPTY_REGISTRATION,
    trNo: 'TR100',
    fullName: 'Student One',
    hasThoughtAboutNext: true,
    nextQualificationIntent: 'planning',
    stage: 'apply_raza',
    degreeApplying: 'LLB',
    institution: 'University',
    studyCommitment: 'Evening classes',
    razaDays: 12,
    examMonths: ['March'],
    clashWithMiqaat: false,
    ...overrides,
  };
}

describe('registration helpers', () => {
  it('normalizes TR numbers', () => {
    expect(normalizeTrNo(' tr 123 ')).toBe('TR123');
  });

  it('accepts only five-digit education emails and derives TR', () => {
    expect(isValidStudentEmail('25687@jameasaifiyah.edu')).toBe(true);
    expect(isValidStudentEmail('idrislaheri72@gmail.com')).toBe(false);
    expect(isValidStudentEmail('abcde@jameasaifiyah.edu')).toBe(false);
    expect(trFromStudentEmail('25687@jameasaifiyah.edu')).toBe('25687');
  });

  it('keeps admin-owned fields out of student payloads', () => {
    const payload = studentWritablePayload(
      validValues({ status: 'approved', adminNotes: 'hidden', reviewedAt: 'date', reviewedBy: 'admin', qualifications: ['legacy'], otherQual: 'legacy' }),
      profile,
      user,
    );

    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('adminNotes');
    expect(payload).not.toHaveProperty('reviewedAt');
    expect(payload).not.toHaveProperty('reviewedBy');
    expect(payload).not.toHaveProperty('qualifications');
    expect(payload).not.toHaveProperty('otherQual');
    expect(payload.uid).toBe(user.uid);
    expect(payload.trNo).toBe('TR100');
  });

  it('allows student edits only before submission or when on hold', () => {
    expect(canStudentEdit(null)).toBe(true);
    expect(canStudentEdit({ status: 'pending' })).toBe(true);
    expect(canStudentEdit({ status: 'pending', submittedAt: 'date' })).toBe(false);
    expect(canStudentEdit({ status: 'on-hold' })).toBe(true);
    expect(canStudentEdit({ status: 'approved' })).toBe(false);
  });

  it('summarizes next qualification intent', () => {
    expect(nextQualificationLabel(validValues({ nextQualificationIntent: 'already_pursuing' }))).toBe('Already Pursuing');
    expect(nextQualificationLabel(validValues({ nextQualificationIntent: '', hasThoughtAboutNext: false }))).toBe('Not Planning Now');
  });

  it('detects programme detail and auto-approval paths', () => {
    expect(needsProgrammeDetails(validValues({ nextQualificationIntent: 'planning' }))).toBe(true);
    expect(needsProgrammeDetails(validValues({ nextQualificationIntent: 'already_pursuing', needsLeavesThisYear: true }))).toBe(true);
    expect(needsProgrammeDetails(validValues({ nextQualificationIntent: 'already_pursuing', needsLeavesThisYear: false }))).toBe(true);
    expect(isAutoApprovedRegistration(validValues({ nextQualificationIntent: 'already_pursuing', needsLeavesThisYear: false }))).toBe(true);
    expect(isAutoApprovedRegistration(validValues({ nextQualificationIntent: 'not_now', hasThoughtAboutNext: false, requiresAssistance: false }))).toBe(true);
  });
});

describe('validation', () => {
  it('does not require legacy qualifications in registration', () => {
    expect(validateRegistrationStep(0, validValues({ qualifications: [] }))).toEqual({});
    expect(validateRegistration(validValues({ qualifications: [], otherQual: '' }))).toEqual({});
  });

  it('requires programme details only when pursuing the next qualification', () => {
    expect(validateRegistration(validValues({ degreeApplying: '' })).degreeApplying).toBeTruthy();
    expect(
      validateRegistration(
        validValues({
          nextQualificationIntent: 'not_now',
          hasThoughtAboutNext: false,
          stage: '',
          requiresAssistance: true,
          degreeApplying: '',
          studyCommitment: '',
          examMonths: [],
          clashWithMiqaat: null,
        }),
      ),
    ).toEqual({});
  });

  it('requires programme details when already pursuing and leaves are needed', () => {
    const errors = validateRegistration(
      validValues({
        nextQualificationIntent: 'already_pursuing',
        hasThoughtAboutNext: true,
        needsLeavesThisYear: true,
        degreeApplying: '',
      }),
    );
    expect(errors.degreeApplying).toBeTruthy();
  });

  it('already pursuing still requires programme details before auto-approval', () => {
    const errors = validateRegistration(
      validValues({
        nextQualificationIntent: 'already_pursuing',
        hasThoughtAboutNext: true,
        needsLeavesThisYear: false,
        stage: '',
        degreeApplying: '',
        studyCommitment: '',
        examMonths: [],
        clashWithMiqaat: null,
      }),
    );

    expect(errors.degreeApplying).toBeTruthy();
    expect(errors.stage).toBeUndefined();
  });

  it('not planning with no assistance does not require programme details', () => {
    expect(
      validateRegistration(
        validValues({
          nextQualificationIntent: 'not_now',
          hasThoughtAboutNext: false,
          requiresAssistance: false,
          stage: '',
          degreeApplying: '',
          studyCommitment: '',
          examMonths: [],
          clashWithMiqaat: null,
        }),
      ),
    ).toEqual({});
  });

  it('requires clash event context when a clash is declared', () => {
    const errors = validateRegistration(validValues({ clashWithMiqaat: true, clashEvents: [], clashDetails: '' }));
    expect(errors.clashEvents).toMatch(/clash event/i);
  });
});

describe('admin dashboard helpers', () => {
  const students = [
    { trNo: 'TR1', fullName: 'Ali', email: 'a@example.com', degreeApplying: 'LLB', status: 'pending', clashWithMiqaat: true },
    { trNo: 'TR2', fullName: 'Musa', email: 'm@example.com', degreeApplying: 'MBBS', status: 'approved', clashWithMiqaat: false },
    { trNo: 'TR3', fullName: 'Hasan', email: 'h@example.com', degreeApplying: 'BSc', status: 'on-hold', clashWithMiqaat: false },
  ];

  it('filters students by query and status', () => {
    expect(filterStudents(students, 'mbbs', 'approved')).toHaveLength(1);
    expect(filterStudents(students, 'ali', 'approved')).toHaveLength(0);
  });

  it('calculates summary stats', () => {
    expect(statsForStudents(students)).toEqual({ total: 3, pending: 1, onHold: 1, approved: 1, clashes: 1 });
  });
});

describe('tashjee helpers', () => {
  it('normalizes request options before saving', () => {
    expect(normalizeTashjeeOptions(['  Alpha  ', 'alpha', '', 'Beta'])).toEqual(['Alpha', 'Beta']);
  });

  it('accepts only image proof files under 2 MB', () => {
    expect(isTashjeeProofFile({ type: 'image/png', size: TASHJEE_PROOF_MAX_BYTES })).toBe(true);
    expect(isTashjeeProofFile({ type: 'image/jpeg', size: TASHJEE_PROOF_MAX_BYTES - 1 })).toBe(true);
    expect(isTashjeeProofFile({ type: 'image/jpeg', size: TASHJEE_PROOF_MAX_BYTES + 1 })).toBe(false);
    expect(isTashjeeProofFile({ type: 'text/plain' })).toBe(false);
  });

  it('allows deleting only pending or on-hold requests', () => {
    expect(isTashjeeRequestDeletable('pending')).toBe(true);
    expect(isTashjeeRequestDeletable('on-hold')).toBe(true);
    expect(isTashjeeRequestDeletable('approved')).toBe(false);
    expect(isTashjeeRequestDeletable('rejected')).toBe(false);
  });
});

describe('exam proof helpers', () => {
  it('accepts only image proof files under 2 MB', () => {
    expect(isProofImageFile({ type: 'image/png', size: PROOF_IMAGE_MAX_BYTES })).toBe(true);
    expect(isProofImageFile({ type: 'image/jpeg', size: PROOF_IMAGE_MAX_BYTES + 1 })).toBe(false);
    expect(isProofImageFile({ type: 'text/plain', size: 100 })).toBe(false);
  });

  it('labels exam proof states', () => {
    expect(examProofStateLabel('uploaded')).toBe('Uploaded');
    expect(examProofStateLabel('not_generated_yet')).toBe('Not Generated Yet');
    expect(examProofStateLabel()).toBe('Missing');
  });
});

describe('route guards', () => {
  it('routes guests to the correct login screen', () => {
    expect(routeForAuthState({ target: 'student' })).toBe('student-login');
    expect(routeForAuthState({ target: 'admin' })).toBe('admin-login');
  });

  it('routes signed-in users by profile and admin state', () => {
    expect(routeForAuthState({ user, profile: null, target: 'student' })).toBe('profile-link');
    expect(routeForAuthState({ user, profile, target: 'student' })).toBe('student-dashboard');
    expect(routeForAuthState({ user, isAdmin: false, target: 'admin' })).toBe('unauthorized');
    expect(routeForAuthState({ user, isAdmin: true, target: 'admin' })).toBe('admin-dashboard');
  });
});
