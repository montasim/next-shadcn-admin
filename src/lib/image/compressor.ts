import tinify from 'tinify';
import { config } from '@/config';

// Initialize Tinify API key
if (config.tinifyApiKey) {
  tinify.key = config.tinifyApiKey;
} else {
  console.warn('[Image Compressor] TINIFY_API_KEY not found in config. Image compression will be disabled.');
}

export interface CompressedImageResult {
  buffer: Buffer;
  sourceSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress and convert image to PNG using Tinify
 * @param file - The image file to compress
 * @returns Compressed image buffer and metadata
 */
export async function compressImage(file: File): Promise<CompressedImageResult> {
  if (!config.tinifyApiKey) {
    throw new Error('Tinify API key is not configured. Please set TINIFY_API_KEY in your environment.');
  }

  try {
    const sourceBuffer = Buffer.from(await file.arrayBuffer());
    const sourceSize = sourceBuffer.length;

    console.log('[Image Compressor] Compressing image:', file.name, 'Size:', (sourceSize / 1024).toFixed(2), 'KB');

    // Upload source image to Tinify
    const source = tinify.fromBuffer(sourceBuffer);

    // Convert to PNG format
    const converted = source.convert({ type: 'image/png' });

    // Get compressed buffer
    const compressedBuffer = await converted.toBuffer();
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((sourceSize - compressedSize) / sourceSize) * 100;

    console.log('[Image Compressor] Compression successful:');
    console.log('  - Original:', (sourceSize / 1024).toFixed(2), 'KB');
    console.log('  - Compressed:', (compressedSize / 1024).toFixed(2), 'KB');
    console.log('  - Saved:', compressionRatio.toFixed(2), '%');

    return {
      buffer: Buffer.from(compressedBuffer),
      sourceSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error: any) {
    console.error('[Image Compressor] Compression failed:', error.message);

    // Check if it's an authentication error
    if (error.message?.includes('Credentials') || error.message?.includes('API key')) {
      throw new Error('Invalid Tinify API key. Please check your TINIFY_API_KEY.');
    }

    // Check if it's a quota exceeded error
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      throw new Error('Tinify API quota exceeded. Please upgrade your plan or try again later.');
    }

    throw new Error(`Failed to compress image: ${error.message}`);
  }
}

/**
 * Create a File object from compressed buffer
 * @param buffer - The compressed image buffer
 * @param originalFilename - The original filename
 * @returns A new File object with PNG extension
 */
export function createCompressedFile(buffer: Buffer, originalFilename: string): File {
  const filename = originalFilename.replace(/\.[^/.]+$/, '') + '.png';
  const uint8Array = new Uint8Array(buffer);

  return new File([uint8Array], filename, { type: 'image/png' });
}

/**
 * Check if image compression is available
 * @returns true if Tinify API key is configured
 */
export function isCompressionAvailable(): boolean {
  return !!config.tinifyApiKey;
}
