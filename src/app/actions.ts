
'use server'

import fs from "fs";
import path from "path";

/**
 * Save image locally to public/uploads folder
 * This is perfect for college project demos - no cloud credentials needed!
 * 
 * @param file - The uploaded file
 * @returns Promise<string> - The relative path to the saved image
 */
export async function saveImageLocally(file: File) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileName = `${Date.now()}-${file.name}`;
    
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file locally
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // Return relative path for storage in database
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('Failed to save image locally:', error);
    throw new Error('Failed to save image locally');
  }
}

/**
 * Legacy function for backward compatibility
 * Now uses local storage instead of Google Cloud
 */
export async function getUploadUrl(file: {name: string, type: string}, patientId: string) {
  // This function is kept for backward compatibility but now throws an error
  // to encourage using the new saveImageLocally function
  throw new Error('getUploadUrl is deprecated. Use saveImageLocally instead.');
}
