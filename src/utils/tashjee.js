export const TASHJEE_DEFAULT_OPTIONS = [
  'Has achieved success in external exams',
  'Has shown outstanding performance in external exams',
];

import { PROOF_IMAGE_ACCEPT, PROOF_IMAGE_MAX_BYTES, describeProofImageRules, isProofImageFile } from './proofUpload';

export const TASHJEE_PROOF_MAX_BYTES = PROOF_IMAGE_MAX_BYTES;
export const TASHJEE_PROOF_ACCEPT = PROOF_IMAGE_ACCEPT;

export const TASHJEE_STATUS_LABELS = {
  pending: { label: 'Pending', tone: 'pending', dot: '🟡' },
  approved: { label: 'Approved', tone: 'approved', dot: '🟢' },
  rejected: { label: 'Rejected', tone: 'rejected', dot: '🔴' },
};

export function normalizeTashjeeOptions(options) {
  const seen = new Set();
  return (options || [])
    .map((option) => String(option || '').trim())
    .filter(Boolean)
    .filter((option) => {
      const normalized = option.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

export function isTashjeeProofFile(file) {
  return isProofImageFile(file);
}

export function isTashjeeRequestDeletable(status) {
  return ['pending', 'on-hold'].includes(status);
}

export function describeTashjeeProofRules() {
  return describeProofImageRules();
}

export function formatTashjeeTimestamp(value) {
  if (!value) return '';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}
