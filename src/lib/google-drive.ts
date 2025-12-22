import { google } from 'googleapis'
import { Readable } from 'stream'

const SCOPES = ['https://www.googleapis.com/auth/drive']

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
})

const drive = google.drive({ version: 'v3', auth })

/**
 * Upload a file to a shared Google Drive folder.
 * @param file The file object to upload
 * @param folderId The ID of the folder shared with the service account
 * @returns The webViewLink (URL) of the uploaded file
 */
export async function uploadFile(file: File, folderId: string | undefined): Promise<string> {
  if (!folderId) {
    throw new Error('Google Drive Folder ID is not configured. Please set GOOGLE_DRIVE_FOLDER_ID in your environment variables.')
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const stream = Readable.from(buffer)

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        mimeType: file.type,
        parents: [folderId], // The ID of the folder shared with the service account
      },
      media: {
        mimeType: file.type,
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

    // Return embeddable preview URL instead of webViewLink
    // webViewLink doesn't work in iframes due to X-Frame-Options
    const fileId = response.data.id
    return `https://drive.google.com/file/d/${fileId}/preview`
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
