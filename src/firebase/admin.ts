import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        // When running in a Google Cloud environment, the SDK automatically
        // detects the project ID and credentials.
        // For local development, you would set GOOGLE_APPLICATION_CREDENTIALS
        // to point to your service account key file.
    });
}

export const firestore = admin.firestore();
export const storage = admin.storage();
