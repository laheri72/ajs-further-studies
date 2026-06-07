export const PROOF_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const PROOF_IMAGE_ACCEPT = 'image/*';

export function isProofImageFile(file) {
  if (!file) return false;
  return file.type.startsWith('image/') && file.size <= PROOF_IMAGE_MAX_BYTES;
}

export function describeProofImageRules() {
  return 'Upload a JPG, JPEG, or PNG image under 2 MB.';
}

export function examProofStateLabel(state) {
  if (state === 'uploaded') return 'Uploaded';
  if (state === 'not_generated_yet') return 'Not Generated Yet';
  return 'Missing';
}

