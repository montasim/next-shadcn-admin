import { google } from 'googleapis'
import { Readable } from 'stream'
import { config } from '@/config'
import { compressImage, createCompressedFile, isCompressionAvailable } from '@/lib/image/compressor'
import { compressPdf, createCompressedPdfFile, isPdfCompressionAvailable } from '@/lib/pdf/compressor'

const SCOPES = ['https://www.googleapis.com/auth/drive']

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: config.google.clientEmail,
    private_key: config.google.privateKey?.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
})

const drive = google.drive({ version: 'v3', auth })

export interface UploadResult {
  previewUrl: string
  directUrl: string
  fileId: string
}

/**
 * Upload a file to a shared Google Drive folder.
 * @param file The file object to upload
 * @param folderId The ID of the folder shared with the service account
 * @returns Object containing preview URL, direct download URL, and file ID
 */
export async function uploadFile(file: File, folderId: string | undefined): Promise<UploadResult> {
  if (!folderId) {
    throw new Error('Google Drive Folder ID is not configured. Please set GOOGLE_DRIVE_FOLDER_ID in your environment variables.')
  }

  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  try {
    // Handle PDF compression with aPDF.io
    if (isPdf && isPdfCompressionAvailable()) {
      try {
        console.log('[Google Drive] Compressing PDF before upload...');

        // Step 1: Compress PDF using direct file upload
        const compressed = await compressPdf(file);

        // Step 2: Only use compressed version if it's actually smaller
        let fileToUpload: File;
        if (compressed.compressedSize < compressed.sourceSize) {
          console.log('[Google Drive] Using compressed PDF (smaller size)');
          fileToUpload = createCompressedPdfFile(compressed.buffer, file.name);
        } else {
          console.log('[Google Drive] Compression did not reduce size, using original PDF');
          fileToUpload = file;
        }

        // Step 3: Upload only the chosen version (compressed or original)
        const buffer = Buffer.from(await fileToUpload.arrayBuffer());
        const stream = Readable.from(buffer);

        const response = await drive.files.create({
          requestBody: {
            name: fileToUpload.name,
            mimeType: 'application/pdf',
            parents: [folderId],
          },
          media: {
            mimeType: 'application/pdf',
            body: stream,
          },
          fields: 'id',
        });

        if (!response.data.id) {
          throw new Error('PDF uploaded but no ID was returned.');
        }

        const fileId = response.data.id;

        // Make file publicly readable
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        console.log('[Google Drive] PDF upload successful');

        return {
          previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
          fileId: fileId
        };
      } catch (error: any) {
        console.warn('[Google Drive] PDF compression failed, uploading original:', error.message);
        // Fall through to upload original PDF
      }
    }

    // Handle image compression with Tinify
    let fileToUpload = file;

    if (isImage && isCompressionAvailable()) {
      try {
        console.log('[Google Drive] Compressing image before upload...');
        const compressed = await compressImage(file);
        fileToUpload = createCompressedFile(compressed.buffer, file.name);
        console.log('[Google Drive] Image compressed successfully');
      } catch (error: any) {
        console.warn('[Google Drive] Image compression failed, uploading original:', error.message);
        // Continue with original file if compression fails
      }
    }

    // Regular upload (no compression or compression failed)
    const buffer = Buffer.from(await fileToUpload.arrayBuffer())
    const stream = Readable.from(buffer)

    const response = await drive.files.create({
      requestBody: {
        name: fileToUpload.name,
        mimeType: fileToUpload.type,
        parents: [folderId], // The ID of the folder shared with the service account
      },
      media: {
        mimeType: fileToUpload.type,
        body: stream,
      },
      fields: 'id, webViewLink',
    })

    if (!response.data.id) {
      throw new Error('File uploaded but no ID was returned from Google Drive.')
    }

    // Make the file publicly readable so the link works
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Return both preview URL and direct download URL
    const fileId = response.data.id
    return {
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      fileId: fileId
    }
  } catch (error: any) {
    // Log the detailed error for better debugging
    console.error('Full error object from Google Drive API:', JSON.stringify(error, null, 2));

    if (error.code === 403) {
      throw new Error('Permission denied. Please double-check these two things: 1) The Google Drive API is enabled in your Google Cloud project. 2) The service account has "Editor" access to the specified Google Drive folder.')
    }
    if (error.code === 404) {
       throw new Error(`Google Drive folder with ID "${folderId}" not found. Please check your GOOGLE_DRIVE_FOLDER_ID.`)
    }
    throw new Error('Failed to upload file to Google Drive.')
  }
}

/**
 * Delete a file from a Google Drive folder
 * @param fileUrl The URL of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  if (!fileUrl) return false

  try {
    // Extract ID from a Google Drive URL
    const match = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
    const fileId = match ? match[1] : null

    if (!fileId) {
      console.warn('Could not extract file ID from URL for deletion:', fileUrl)
      return false
    }

    await drive.files.delete({
      fileId,
    })
    return true
  } catch (error: any) {
    console.error('Failed to delete file from Google Drive. It may have been already deleted:', error.message)
    return false
  }
}
