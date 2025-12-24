/**
 * Extract file ID from various Google Drive URL formats
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;

  // Preview URL: https://drive.google.com/file/d/{fileId}/preview
  const previewMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (previewMatch) return previewMatch[1];

  // View URL: https://drive.google.com/file/d/{fileId}/view
  const viewMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (viewMatch) return viewMatch[1];

  // Direct URL: https://drive.google.com/uc?export=download&id={fileId}
  const directMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (directMatch) return directMatch[1];

  return null;
}

/**
 * Generate direct download URL from preview URL
 */
export function generateDirectDownloadUrl(previewUrl: string): string | null {
  const fileId = extractGoogleDriveFileId(previewUrl);
  if (!fileId) return null;

  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Check if URL is already in direct download format
 */
export function isDirectDownloadUrl(url: string): boolean {
  return url.includes('/uc?export=download');
}

/**
 * Check if URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}
