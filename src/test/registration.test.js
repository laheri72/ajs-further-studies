import { describe, expect, it } from 'vitest';
import { EMPTY_REGISTRATION } from '../data/constants';
import {
  canStudentEdit,
  filterStudents,
  isValidStudentEmail,
  normalizeTrNo,
  routeForAuthState,
  statsForStudents,
  studentWritablePayload,
  trFromStudentEmail,
} from '../utils/registration';
import { validateRegistration, validateRegistrationStep } from '../utils/validation';

const user = { uid: 'uid-1', email: '25687@jameasaifiyah.edu' };
const profile = { trNo: 'TR100', fullName: 'Student One' };

function validValues(overrides = {}) {
  return {
    ...EMPTY_REGISTRATION,
    trNo: 'TR100',
    fullName: 'Student One',
    qualifications: ['Jamea Diploma'],
    hasThoughtAboutNext: true,
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
      validValues({ status: 'approved', adminNotes: 'hidden', reviewedAt: 'date', reviewedBy: 'admin' }),
      profile,
      user,
    );

    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('adminNotes');
    expect(payload).not.toHaveProperty('reviewedAt');
    expect(payload).not.toHaveProperty('reviewedBy');
    expect(payload.uid).toBe(user.uid);
    expect(payload.trNo).toBe('25687');
  });

  it('allows student edits only before approval', () => {
    expect(canStudentEdit(null)).toBe(true);
    expect(canStudentEdit({ status: 'pending' })).toBe(true);
    expect(canStudentEdit({ status: 'approved' })).toBe(false);
  });
});

describe('validation', () => {
  it('requires qualifications on step two', () => {
    const errors = validateRegistrationStep(1, validValues({ qualifications: [] }));
    expect(errors.qualifications).toMatch(/at least one/i);
  });

  it('requires programme details only when pursuing the next qualification', () => {
    expect(validateRegistration(validValues({ degreeApplying: '' })).degreeApplying).toBeTruthy();
    expect(
      validateRegistration(
        validValues({
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

  it('requires clash event context when a clash is declared', () => {
    const errors = validateRegistration(validValues({ clashWithMiqaat: true, clashEvents: [], clashDetails: '' }));
    expect(errors.clashEvents).toMatch(/clash event/i);
  });
});

describe('admin dashboard helpers', () => {
  const students = [
    { trNo: 'TR1', fullName: 'Ali', email: 'a@example.com', degreeApplying: 'LLB', status: 'pending', clashWithMiqaat: true },
    { trNo: 'TR2', fullName: 'Musa', email: 'm@example.com', degreeApplying: 'MBBS', status: 'approved', clashWithMiqaat: false },
  ];

  it('filters students by query and status', () => {
    expect(filterStudents(students, 'mbbs', 'approved')).toHaveLength(1);
    expect(filterStudents(students, 'ali', 'approved')).toHaveLength(0);
  });

  it('calculates summary stats', () => {
    expect(statsForStudents(students)).toEqual({ total: 2, pending: 1, approved: 1, clashes: 1 });
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
