export const FORM_VERSION = 'v1';

export const MAIN_ADMIN_EMAIL = 'idrislaheri72@gmail.com';

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
  'Fasle Awwal',
  'Fasle Sani',
  'Rehlat Ilmiya',
  'Istefada Ilmiya',
  'Ashara Mubarakah',
  'Urs Mubarak',
  'other jamea Events'
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

export const NEXT_QUALIFICATION_OPTIONS = [
  {
    value: 'planning',
    label: 'Yes, I am planning to acquire the next qualification',
    shortLabel: 'Planning Next Qualification',
    continuesWorkflow: true,
  },
  {
    value: 'already_pursuing',
    label: 'I am already pursuing a degree or course',
    shortLabel: 'Already Pursuing',
    continuesWorkflow: true,
  },
  {
    value: 'not_now',
    label: 'No, I am not planning one right now',
    shortLabel: 'Not Planning Now',
    continuesWorkflow: false,
  },
];

export const STUDENT_STEPS = ['Details', 'Next Steps', 'Programme', 'Review'];

export const EMPTY_REGISTRATION = {
  trNo: '',
  fullName: '',
  nextQualificationIntent: '',
  hasThoughtAboutNext: null,
  stage: '',
  needsLeavesThisYear: null,
  requiresAssistance: null,
  degreeApplying: '',
  institution: '',
  studyCommitment: '',
  razaDays: '',
  examMonths: [],
  clashWithMiqaat: null,
  clashEvents: [],
  clashDetails: '',
  needsLaptop: null,
  laptopJustification: '',
  additionalNotes: '',
};

export const ADMIN_OWNED_FIELDS = ['status', 'adminNotes', 'reviewedAt', 'reviewedBy'];
