import { log } from '@/lib/logger'

interface ActivityLogEntry {
  data: any
  timestamp: Date
  retries: number
}

class ActivityQueue {
  private queue: ActivityLogEntry[] = []
  private processing = false
  private maxRetries = 3
  private batchSize = 100
  private flushInterval = 5000 // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    this.startFlushInterval()
  }

  /**
   * Add activity to queue (non-blocking)
   */
  async add(data: any): Promise<void> {
    this.queue.push({
      data,
      timestamp: new Date(),
      retries: 0,
    })

    // Auto-flush if queue gets too big
    if (this.queue.length >= this.batchSize) {
      await this.flush()
    }
  }

  /**
   * Process queue and batch insert to database
   * Public method to allow manual flushing (e.g., before process exit)
   */
  async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    const batch = this.queue.splice(0, this.batchSize)

    try {
      const { prisma } = await import('@/lib/prisma')

      await prisma.activityLog.createMany({
        data: batch.map(entry => entry.data),
        skipDuplicates: true,
      })

      log.debug('[ActivityQueue] Flushed batch', { count: batch.length })
    } catch (error: any) {
      log.error('[ActivityQueue] Failed to flush batch', {
        error: error.message,
        count: batch.length,
      })

      // Re-queue failed items with retry count
      batch.forEach(entry => {
        if (entry.retries < this.maxRetries) {
          entry.retries++
          this.queue.push(entry)
        } else {
          log.error('[ActivityQueue] Dropped activity after max retries', {
            data: entry.data,
          })
        }
      })
    } finally {
      this.processing = false
    }
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval(): void {
    if (this.flushTimer) return

    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        log.error('[ActivityQueue] Interval flush error', { error: error.message })
      })
    }, this.flushInterval)
  }

  /**
   * Stop automatic flush interval
   */
  stopFlushInterval(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length
  }
}

// Singleton instance
export const activityQueue = new ActivityQueue()

// Ensure queue is flushed before process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await activityQueue.flush()
  })

  process.on('SIGINT', async () => {
    await activityQueue.flush()
  })

  process.on('SIGTERM', async () => {
    await activityQueue.flush()
  })
}
