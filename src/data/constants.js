export const FORM_VERSION = 'v1';

export const QUALIFICATIONS = [
  'Hifz ul Quran',
  'Dars-e-Nizami (Alimiyah)',
  'Jamea Diploma',
  'Jamea Certificate',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Other',
];

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MIQAAT_EVENTS = [
  'Milad un Nabi',
  'Ashura',
  'Eid ul Fitr',
  'Eid ul Adha',
  'Shab-e-Baraat',
  'Laylatul Qadr',
  'Ashara Mubarakah',
  'Urs Mubarak',
  'Jamea Annual Event',
  'Other Jamea Event',
];

export const STAGES = [
  {
    value: 'apply_raza',
    label: 'I have decided and would like to apply for raza',
    shortLabel: 'Applying for Raza',
  },
  {
    value: 'istirshaad',
    label: 'I am still considering my options and would like to do an istirshaad araz',
    shortLabel: 'Istirshaad Araz',
  },
  {
    value: 'research',
    label: 'I need more time to do research before doing any araz',
    shortLabel: 'Needs More Research',
  },
];

export const STUDENT_STEPS = ['Details', 'Qualifications', 'Next Steps', 'Programme', 'Review'];

export const EMPTY_REGISTRATION = {
  trNo: '',
  fullName: '',
  qualifications: [],
  otherQual: '',
  hasThoughtAboutNext: null,
  stage: '',
  requiresAssistance: null,
  degreeApplying: '',
  institution: '',
  studyCommitment: '',
  razaDays: '',
  examMonths: [],
  clashWithMiqaat: null,
  clashEvents: [],
  clashDetails: '',
  additionalNotes: '',
};

export const ADMIN_OWNED_FIELDS = ['status', 'adminNotes', 'reviewedAt', 'reviewedBy'];
