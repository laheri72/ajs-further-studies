import { z } from 'zod';
import { normalizeTrNo } from './registration';

const trimmed = z.string().trim();

export const profileSchema = z.object({
  trNo: trimmed.min(2, 'TR number is required').transform(normalizeTrNo),
  fullName: trimmed.min(2, 'Full name is required'),
});

export const registrationSchema = z
  .object({
    trNo: trimmed.min(2, 'TR number is required').transform(normalizeTrNo),
    fullName: trimmed.min(2, 'Full name is required'),
    nextQualificationIntent: z.string().optional().default(''),
    hasThoughtAboutNext: z.boolean({ required_error: 'Please choose Yes or No' }),
    stage: z.string().optional().default(''),
    needsLeavesThisYear: z.boolean().nullable().optional(),
    requiresAssistance: z.boolean().nullable().optional(),
    degreeApplying: trimmed.optional().default(''),
    institution: trimmed.optional().default(''),
    studyCommitment: trimmed.optional().default(''),
    razaDays: z.coerce.number().min(0, 'Raza days cannot be negative').optional().default(0),
    examMonths: z.array(z.string()).optional().default([]),
    clashWithMiqaat: z.boolean().nullable().optional(),
    clashEvents: z.array(z.string()).optional().default([]),
    clashDetails: trimmed.optional().default(''),
    additionalNotes: trimmed.optional().default(''),
  })
  .superRefine((value, ctx) => {
    const planning = value.nextQualificationIntent === 'planning' || (!value.nextQualificationIntent && value.hasThoughtAboutNext);
    const alreadyPursuing = value.nextQualificationIntent === 'already_pursuing';
    const needsProgrammeDetails = planning || alreadyPursuing;

    if (planning && !value.stage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stage'],
        message: 'Please select your current stage',
      });
    }

    if (alreadyPursuing && value.needsLeavesThisYear === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['needsLeavesThisYear'],
        message: 'Please choose whether leaves are needed this academic year',
      });
    }

    if (needsProgrammeDetails && value.degreeApplying.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['degreeApplying'],
        message: 'Degree or programme is required',
      });
    }

    if (needsProgrammeDetails && value.studyCommitment.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['studyCommitment'],
        message: 'Study commitment is required',
      });
    }

    if (needsProgrammeDetails && value.examMonths.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['examMonths'],
        message: 'Please select at least one exam month',
      });
    }

    if (needsProgrammeDetails && value.clashWithMiqaat === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['clashWithMiqaat'],
        message: 'Please choose Yes or No',
      });
    }

    if (value.nextQualificationIntent === 'not_now' && value.requiresAssistance === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requiresAssistance'],
        message: 'Please choose whether Idara assistance is needed',
      });
    }

    if (needsProgrammeDetails && value.clashWithMiqaat && value.clashEvents.length === 0 && !value.clashDetails?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['clashEvents'],
        message: 'Select a clash event or describe the clash',
      });
    }
  });

export function validateRegistration(values) {
  const result = registrationSchema.safeParse({
    ...values,
    hasThoughtAboutNext: values.hasThoughtAboutNext,
    clashWithMiqaat: values.clashWithMiqaat,
  });

  if (result.success) return {};

  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path[0], issue.message]),
  );
}

export function validateRegistrationStep(step, values) {
  const allErrors = validateRegistration(values);

  const stepFields = [
    ['trNo', 'fullName'],
    ['hasThoughtAboutNext', 'stage', 'requiresAssistance'],
    ['degreeApplying', 'studyCommitment', 'razaDays', 'examMonths', 'clashWithMiqaat', 'clashEvents', 'needsLeavesThisYear'],
    [],
  ][step];

  return Object.fromEntries(Object.entries(allErrors).filter(([key]) => stepFields.includes(key)));
}
