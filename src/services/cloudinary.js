import { PROOF_IMAGE_MAX_BYTES } from '../utils/proofUpload';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzhzvaexh';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Certificates';
const CLOUDINARY_UPLOAD_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
const CLOUDINARY_DELETE_BY_TOKEN_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/delete_by_token`;

function validateImageProofFile(file) {
  if (!file) {
    throw new Error('Please choose a proof image before uploading.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Only JPG, JPEG, and PNG images are allowed.');
  }

  if (file.size > PROOF_IMAGE_MAX_BYTES) {
    throw new Error('Each proof image must be smaller than 2 MB.');
  }
}

export async function uploadCloudinaryImage(file, errorMessage = 'Unable to upload proof document.') {
  validateImageProofFile(file);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || errorMessage);
  }

  const payload = await response.json();
  if (!payload?.secure_url) {
    throw new Error('Cloudinary did not return a secure file URL.');
  }

  return {
    proofUrl: payload.secure_url,
    previewUrl: payload.secure_url,
    publicId: payload.public_id || '',
    deleteToken: payload.delete_token || '',
    assetId: payload.asset_id || '',
    format: payload.format || '',
  };
}

export async function deleteCloudinaryByToken(deleteToken, errorMessage = 'Unable to delete the uploaded proof from Cloudinary.') {
  if (!deleteToken) return;

  const response = await fetch(CLOUDINARY_DELETE_BY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({ token: deleteToken }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || errorMessage);
  }
}

