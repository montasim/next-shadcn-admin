/**
 * Simple in-memory cache for PDF downloads
 * Cache entries expire after 1 hour to prevent stale data
 */

interface CacheEntry {
  buffer: ArrayBuffer;
  timestamp: number;
  accessCount: number;
}

class PDFCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached PDFs
  private readonly MAX_CACHE_SIZE_MB = 500; // Maximum total cache size in MB

  /**
   * Get cached PDF buffer
   */
  get(key: string): ArrayBuffer | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.DEFAULT_TTL) {
      this.cache.delete(key);
      console.log('[PDF Cache] Cache entry expired:', key);
      return null;
    }

    // Update access count for LRU eviction
    entry.accessCount++;
    console.log('[PDF Cache] Cache hit:', key, `Access count: ${entry.accessCount}`);

    return entry.buffer;
  }

  /**
   * Set cached PDF buffer
   */
  set(key: string, buffer: ArrayBuffer): void {
    // Check cache size before adding
    this.evictIfNeeded(buffer.byteLength);

    const entry: CacheEntry = {
      buffer,
      timestamp: Date.now(),
      accessCount: 1
    };

    this.cache.set(key, entry);
    const sizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);
    console.log('[PDF Cache] Cached PDF:', key, `Size: ${sizeMB}MB`);
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log('[PDF Cache] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalSize = 0;
    let totalAccessCount = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.buffer.byteLength;
      totalAccessCount += entry.accessCount;
    }

    return {
      entryCount: this.cache.size,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalAccessCount,
      maxSizeEntries: this.MAX_CACHE_SIZE,
      maxSizeMB: this.MAX_CACHE_SIZE_MB
    };
  }

  /**
   * Evict least recently used entries if cache is too large
   */
  private evictIfNeeded(newEntrySize: number): void {
    // Check entry count limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRU();
    }

    // Check total size limit
    const currentTotalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.buffer.byteLength, 0);

    const currentTotalSizeMB = currentTotalSize / (1024 * 1024);
    const newEntrySizeMB = newEntrySize / (1024 * 1024);

    if (currentTotalSizeMB + newEntrySizeMB > this.MAX_CACHE_SIZE_MB) {
      console.log('[PDF Cache] Cache size limit approaching, evicting entries...');
      while (
        this.cache.size > 0 &&
        (currentTotalSize + newEntrySize) / (1024 * 1024) > this.MAX_CACHE_SIZE_MB * 0.8  // Evict until under 80% of limit
      ) {
        this.evictLRU();
      }
    }
  }

  /**
   * Evict least recently used entry (lowest access count, oldest timestamp)
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruEntry: CacheEntry | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!lruEntry ||
          entry.accessCount < lruEntry.accessCount ||
          (entry.accessCount === lruEntry.accessCount && entry.timestamp < lruEntry.timestamp)) {
        lruKey = key;
        lruEntry = entry;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      console.log('[PDF Cache] Evicted LRU entry:', lruKey);
    }
  }
}

// Export singleton instance
export const pdfCache = new PDFCache();

/**
 * Generate cache key from URL
 */
export function generateCacheKey(url: string): string {
  // Use URL hash as cache key
  // For Google Drive URLs, extract file ID for consistent key
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return `gdrive:${fileIdMatch[1]}`;
  }

  // Fallback to simple hash for other URLs
  return `url:${Buffer.from(url).toString('base64').substring(0, 32)}`;
}
