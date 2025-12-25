import { config } from '@/config';

const APDF_API_BASE = 'https://apdf.io/api';

export interface CompressedPdfResult {
  buffer: Buffer;
  sourceSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface ApdfCompressResponse {
  file: string;
  expiration: string;
  size_original: number;
  size_compressed: number;
}

/**
 * Compress PDF using aPDF.io API (direct file upload)
 * @param file - The PDF file to compress
 * @returns Compressed PDF buffer and metadata
 */
export async function compressPdf(file: File): Promise<CompressedPdfResult> {
  if (!config.apdfApiKey) {
    throw new Error('aPDF.io API key is not configured. Please set APDF_API_KEY in your environment.');
  }

  // Check if file is a PDF
  if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
    throw new Error('File is not a PDF. Only PDF files can be compressed.');
  }

  console.log('[PDF Compressor] Compressing PDF:', file.name);

  try {
    // Create FormData with the file
    const formData = new FormData();
    formData.append('file', file);

    // Call aPDF.io API to compress the PDF directly
    const response = await fetch(`${APDF_API_BASE}/pdf/file/compress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apdfApiKey}`,
        'Accept': 'application/json',
        // Don't set Content-Type for FormData - let the browser set it with the correct boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PDF Compressor] API Error:', errorText);

      if (response.status === 401) {
        throw new Error('Invalid aPDF.io API key. Please check your APDF_API_KEY.');
      }

      throw new Error(`aPDF.io API error (${response.status}): ${errorText}`);
    }

    const result: ApdfCompressResponse = await response.json();

    console.log('[PDF Compressor] Compression successful:');
    console.log('  - Original size:', formatBytes(result.size_original));
    console.log('  - Compressed size:', formatBytes(result.size_compressed));
    console.log('  - Saved:', ((result.size_original - result.size_compressed) / result.size_original * 100).toFixed(2), '%');

    // Download the compressed PDF
    console.log('[PDF Compressor] Downloading compressed PDF...');
    const pdfResponse = await fetch(result.file);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download compressed PDF: ${pdfResponse.statusText}`);
    }

    const buffer = Buffer.from(await pdfResponse.arrayBuffer());

    return {
      buffer,
      sourceSize: result.size_original,
      compressedSize: result.size_compressed,
      compressionRatio: ((result.size_original - result.size_compressed) / result.size_original) * 100,
    };
  } catch (error: any) {
    console.error('[PDF Compressor] Compression failed:', error.message);
    throw error;
  }
}

/**
 * Compress PDF from URL using aPDF.io API
 * @param fileUrl - Public URL of the PDF file
 * @param filename - Original filename for reference
 * @returns Compressed PDF buffer and metadata
 */
export async function compressPdfFromUrl(
  fileUrl: string,
  filename?: string
): Promise<CompressedPdfResult> {
  if (!config.apdfApiKey) {
    throw new Error('aPDF.io API key is not configured. Please set APDF_API_KEY in your environment.');
  }

  console.log('[PDF Compressor] Compressing PDF from URL:', filename || fileUrl);

  try {
    // Call aPDF.io API to compress the PDF
    const response = await fetch(`${APDF_API_BASE}/pdf/file/compress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apdfApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: fileUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PDF Compressor] API Error:', errorText);

      if (response.status === 401) {
        throw new Error('Invalid aPDF.io API key. Please check your APDF_API_KEY.');
      }

      throw new Error(`aPDF.io API error (${response.status}): ${errorText}`);
    }

    const result: ApdfCompressResponse = await response.json();

    console.log('[PDF Compressor] Compression successful:');
    console.log('  - Original size:', formatBytes(result.size_original));
    console.log('  - Compressed size:', formatBytes(result.size_compressed));
    console.log('  - Saved:', ((result.size_original - result.size_compressed) / result.size_original * 100).toFixed(2), '%');

    // Download the compressed PDF
    console.log('[PDF Compressor] Downloading compressed PDF...');
    const pdfResponse = await fetch(result.file);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download compressed PDF: ${pdfResponse.statusText}`);
    }

    const buffer = Buffer.from(await pdfResponse.arrayBuffer());

    return {
      buffer,
      sourceSize: result.size_original,
      compressedSize: result.size_compressed,
      compressionRatio: ((result.size_original - result.size_compressed) / result.size_original) * 100,
    };
  } catch (error: any) {
    console.error('[PDF Compressor] Compression failed:', error.message);
    throw error;
  }
}

/**
 * Create a File object from compressed PDF buffer
 * @param buffer - The compressed PDF buffer
 * @param originalFilename - The original filename
 * @returns A new File object with _compressed suffix
 */
export function createCompressedPdfFile(buffer: Buffer, originalFilename: string): File {
  const filename = originalFilename.replace(/\.pdf$/i, '') + '_compressed.pdf';
  const blob = new Blob([buffer], { type: 'application/pdf' });

  return new File([blob], filename, { type: 'application/pdf' });
}

/**
 * Check if PDF compression is available
 * @returns true if aPDF.io API key is configured
 */
export function isPdfCompressionAvailable(): boolean {
  return !!config.apdfApiKey;
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
