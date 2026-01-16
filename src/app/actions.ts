
'use server'

import { getSignedUrl as getStorageSignedUrl } from '@/firebase/storage';

/**
 * This server action is a pass-through to the Firebase Admin SDK's storage functionality.
 * It's used to generate a signed URL that allows the client to upload a file directly
 * to a specific path in Google Cloud Storage, bypassing the server to save bandwidth.
 *
 * @param file - An object containing the file's name and MIME type.
 * @param patientId - The UID of the patient, used to create a unique and secure path.
 * @returns A promise that resolves to an object containing the signed URL and the
 *          necessary form fields for the upload.
 */
export async function getUploadUrl(file: {name: string, type: string}, patientId: string) {
  // Construct a secure path for the file in the format: wound-images/USER_ID/UNIQUE_FILE_NAME
  const path = `wound-images/${patientId}/${Date.now()}-${file.name}`;
  const { url, fields } = await getStorageSignedUrl(file, path);
  
  // The public URL is constructed differently from the signed URL used for writing.
  // This is the URL that will be stored in Firestore to view the image later.
  const publicUrl = `https://storage.googleapis.com/${fields.bucket}/${path}`;
  
  return { url, fields, publicUrl };
}
