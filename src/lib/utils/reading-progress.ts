/**
 * Calculate reading progress percentage from current and total values
 * @param current - Current page or position (e.g., current page, current time)
 * @param total - Total pages or duration
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(current: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, (current / total) * 100))
}

/**
 * Calculate reading progress percentage for audio books
 * @param currentTime - Current playback time in seconds
 * @param duration - Total duration in seconds
 * @returns Progress percentage (0-100)
 */
export function calculateAudioProgress(currentTime: number, duration: number): number {
  return calculateProgress(currentTime, duration)
}

/**
 * Calculate reading progress percentage for books (page-based)
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @returns Progress percentage (0-100)
 */
export function calculatePageProgress(currentPage: number, totalPages: number): number {
  return calculateProgress(currentPage, totalPages)
}

/**
 * Clamp progress value to valid range (0-100)
 * @param progress - Progress value to clamp
 * @returns Clamped progress value (0-100)
 */
export function clampProgress(progress: number | undefined | null): number {
  return Math.min(100, Math.max(0, progress || 0))
}

/**
 * Determine if a book is completed based on progress
 * @param progress - Progress percentage
 * @param threshold - Completion threshold (default: 95)
 * @returns True if book is considered completed
 */
export function isBookCompleted(progress: number, threshold: number = 95): boolean {
  return progress >= threshold
}

/**
 * Get progress state information
 * @param progress - Progress percentage (0-100)
 * @param completionThreshold - Threshold for completion (default: 95)
 * @returns Progress state with status info
 */
export function getProgressState(
  progress: number | undefined | null,
  completionThreshold: number = 95
) {
  const clampedProgress = clampProgress(progress)

  return {
    progress: clampedProgress,
    isCompleted: clampedProgress >= completionThreshold,
    isStarted: clampedProgress > 0,
    isNotStarted: clampedProgress === 0,
  }
}

/**
 * Calculate pages remaining
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @returns Number of pages remaining
 */
export function calculatePagesRemaining(currentPage: number, totalPages: number): number {
  return Math.max(0, totalPages - currentPage)
}

/**
 * Calculate estimated progress based on multiple progress entries
 * @param progresses - Array of progress values
 * @returns Average progress percentage
 */
export function calculateAverageProgress(progresses: number[]): number {
  if (progresses.length === 0) return 0
  const sum = progresses.reduce((acc, p) => acc + clampProgress(p), 0)
  return sum / progresses.length
}
