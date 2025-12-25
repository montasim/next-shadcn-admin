import { Queue, Worker, Job } from 'bullmq'
import { config } from '@/config'
import { extractBookContent } from '@/lib/ai/book-content-extractor'
import { updateBookExtractedContent } from '@/lib/lms/repositories/book.repository'

// Queue configuration
export const QUEUE_NAME = 'book-content-extraction'

// Create Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
}

// Type for job data
export interface BookExtractionJobData {
  bookId: string
  fileUrl: string
  directFileUrl?: string | null
}

// Type for job result
export interface BookExtractionJobResult {
  wordCount: number
  pageCount: number
  size: number
  version: number
}

/**
 * Create a BullMQ queue for book content extraction
 */
export function createBookExtractionQueue(): Queue<BookExtractionJobData, BookExtractionJobResult> {
  const queue = new Queue<BookExtractionJobData, BookExtractionJobResult>(QUEUE_NAME, {
    connection: redisOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
        age: 24 * 3600, // 24 hours
      },
      removeOnFail: {
        count: 500, // Keep last 500 failed jobs
        age: 7 * 24 * 3600, // 7 days
      },
    },
  })

  console.log('[Queue] Book extraction queue created')
  return queue
}

/**
 * Create a worker to process book extraction jobs
 */
export function createBookExtractionWorker(): Worker<BookExtractionJobData, BookExtractionJobResult> {
  const worker = new Worker<BookExtractionJobData, BookExtractionJobResult>(
    QUEUE_NAME,
    async (job: Job<BookExtractionJobData, BookExtractionJobResult>) => {
      const { bookId, fileUrl, directFileUrl } = job.data

      console.log(`[Queue Worker] Processing job ${job.id} for book ${bookId}`)

      try {
        // Update job progress
        await job.updateProgress(10)

        // Extract content from PDF
        const content = await extractBookContent({ fileUrl, directFileUrl })

        await job.updateProgress(80)

        // Save to database
        await updateBookExtractedContent(bookId, {
          extractedContent: content.text,
          contentHash: content.hash,
          contentPageCount: content.numPages,
          contentWordCount: content.wordCount,
          contentSize: content.size,
          extractionStatus: 'completed'
        })

        await job.updateProgress(100)

        console.log(`[Queue Worker] Job ${job.id} completed successfully`)

        return {
          wordCount: content.wordCount,
          pageCount: content.numPages,
          size: content.size,
          version: 0, // Will be incremented by updateBookExtractedContent
        }
      } catch (error: any) {
        console.error(`[Queue Worker] Job ${job.id} failed:`, error)

        // Update extraction status to failed
        try {
          const prisma = await import('@/lib/prisma').then(m => m.prisma)
          await prisma.book.update({
            where: { id: bookId },
            data: { extractionStatus: 'failed' }
          })
        } catch (dbError) {
          console.error('[Queue Worker] Failed to update status:', dbError)
        }

        throw error
      }
    },
    {
      connection: redisOptions,
      concurrency: 3, // Process up to 3 jobs concurrently
      limiter: {
        max: 10, // Max 10 jobs per interval
        duration: 60000, // Per minute
      },
    }
  )

  // Event listeners
  worker.on('completed', (job: Job) => {
    console.log(`[Queue Worker] Job ${job.id} completed`)
  })

  worker.on('failed', (job: Job | undefined, error: Error) => {
    console.error(`[Queue Worker] Job ${job?.id} failed:`, error.message)
  })

  worker.on('progress', (job: Job, progress: number) => {
    console.log(`[Queue Worker] Job ${job.id} progress: ${progress}%`)
  })

  console.log('[Queue Worker] Book extraction worker started')
  return worker
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const redis = await import('ioredis').then(m => new m.default(redisOptions))
    await redis.ping()
    await redis.quit()
    return true
  } catch (error) {
    console.warn('[Queue] Redis not available:', error)
    return false
  }
}

/**
 * Add a book extraction job to the queue
 */
export async function addBookExtractionJob(
  queue: Queue<BookExtractionJobData, BookExtractionJobResult>,
  bookId: string,
  fileUrl: string,
  directFileUrl?: string | null
): Promise<Job<BookExtractionJobData, BookExtractionJobResult>> {
  const job = await queue.add(
    'extract-book-content',
    { bookId, fileUrl, directFileUrl },
    {
      jobId: bookId, // Use bookId as jobId to prevent duplicate jobs
      priority: 5, // Normal priority
    }
  )

  console.log(`[Queue] Job ${job.id} added to queue for book ${bookId}`)
  return job
}
