import { storage } from './admin';

const BUCKET_NAME = "studio-2363340782-5ffd7.appspot.com";

export async function getSignedUrl(file: {name: string, type: string}, path: string) {
    if (!BUCKET_NAME) {
        throw new Error('Storage bucket name not configured.');
    }
    const bucket = storage.bucket(BUCKET_NAME);
    const fileRef = bucket.file(path);

    const [url] = await fileRef.getSignedUrl({
        action: 'write',
        version: 'v4',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: file.type,
    });
    
    // For a v4 signed URL, the client performs a PUT request directly to the URL.
    // The 'fields' are not needed for this simple case. We are providing them for potential
    // compatibility with form-based uploads, but the primary mechanism is a direct PUT.
    return { url, fields: { bucket: BUCKET_NAME, key: path }, publicUrl: fileRef.publicUrl() };
}
