import {
  createBookExtractionQueue,
  createBookExtractionWorker,
  isRedisAvailable,
  addBookExtractionJob,
  type BookExtractionJobData,
  type BookExtractionJobResult
} from './config'

let queueInstance: Awaited<ReturnType<typeof createBookExtractionQueue>> | null = null
let workerInstance: Awaited<ReturnType<typeof createBookExtractionWorker>> | null = null
let queueAvailable: boolean | null = null

/**
 * Initialize the job queue system
 * Creates queue and worker if Redis is available
 */
export async function initializeJobQueue() {
  if (queueAvailable !== null) {
    return { available: queueAvailable, queue: queueInstance }
  }

  console.log('[Job Queue] Initializing...')

  const redisOk = await isRedisAvailable()
  queueAvailable = redisOk

  if (!redisOk) {
    console.warn('[Job Queue] Redis not available. Jobs will be processed synchronously.')
    return { available: false, queue: null }
  }

  try {
    // Create queue
    queueInstance = createBookExtractionQueue()
    console.log('[Job Queue] Queue created successfully')

    // Create worker (only in server environment)
    if (typeof window === 'undefined') {
      workerInstance = createBookExtractionWorker()
      console.log('[Job Queue] Worker started successfully')
    }

    return { available: true, queue: queueInstance }
  } catch (error) {
    console.error('[Job Queue] Failed to initialize:', error)
    queueAvailable = false
    return { available: false, queue: null }
  }
}

/**
 * Add a book extraction job
 * Falls back to synchronous processing if queue is not available
 */
export async function queueBookExtraction(
  bookId: string,
  fileUrl: string,
  directFileUrl?: string | null
): Promise<{ queued: boolean; jobId?: string }> {
  // Initialize queue if not already done
  const { available, queue } = await initializeJobQueue()

  if (!available || !queue) {
    console.log('[Job Queue] Queue not available, extraction will be processed synchronously')
    return { queued: false }
  }

  try {
    const job = await addBookExtractionJob(queue, bookId, fileUrl, directFileUrl)
    return { queued: true, jobId: job.id }
  } catch (error) {
    console.error('[Job Queue] Failed to add job:', error)
    return { queued: false }
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  if (!queueInstance) {
    return null
  }

  try {
    const job = await queueInstance.getJob(jobId)
    if (!job) {
      return null
    }

    const state = await job.getState()
    const progress = job.progress

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
    }
  } catch (error) {
    console.error('[Job Queue] Failed to get job status:', error)
    return null
  }
}

/**
 * Close the queue and worker
 */
export async function closeJobQueue() {
  console.log('[Job Queue] Closing...')

  if (workerInstance) {
    await workerInstance.close()
    workerInstance = null
  }

  if (queueInstance) {
    await queueInstance.close()
    queueInstance = null
  }

  queueAvailable = null
  console.log('[Job Queue] Closed')
}
