# Book Content Extraction System

This document explains how the book content extraction and caching system works.

## Overview

The system extracts text content from PDF files to enable AI chat functionality. Content is cached in the database so it only needs to be extracted once per book, regardless of how many users chat about it.

## Architecture

### Components

1. **Content Extraction API** (`/api/books/[id]/extract-content`)
   - Triggers extraction for a book
   - Uses job queue if Redis is available
   - Falls back to synchronous processing if not

2. **Database Cache** (Book model)
   - `extractedContent`: Full text content
   - `contentHash`: MD5 hash for change detection
   - `contentVersion`: Incremented on each extraction
   - `contentExtractedAt`: Timestamp of extraction
   - `extractionStatus`: 'pending', 'completed', 'failed'

3. **Job Queue** (Optional - BullMQ + Redis)
   - Processes extraction jobs asynchronously
   - Allows concurrent processing (up to 3 jobs)
   - Gracefully degrades to synchronous if Redis unavailable

4. **Chat Modal**
   - Shows progress indicator while content is being prepared
   - Auto-starts chat when content is ready
   - Polls for updates every 2 seconds

## Flow

### Book Upload (Admin)

```
1. Admin uploads PDF
2. File is compressed (if aPDF.io configured)
3. Book is created in database
4. Content extraction is triggered (waits for completion)
   - If Redis: Job is queued and processed by worker
   - If no Redis: Extraction happens synchronously
5. Book upload completes with success message
```

### User Opens Chat

```
1. User opens chat modal
2. Modal checks extraction status via API
3. If content ready:
   - Chat starts immediately
4. If content not ready:
   - Shows "Preparing Book Content" indicator
   - Polls every 2 seconds
   - Auto-starts when ready
5. All subsequent users get instant responses
```

## Configuration

### Environment Variables

```bash
# Required
DATABASE_URL=...
ZHIPU_AI_API_KEY=...

# Optional - Image Compression
TINIFY_API_KEY=...

# Optional - PDF Compression
APDF_API_KEY=...

# Optional - Job Queue (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Without Redis

If Redis is not configured:
- Jobs are processed synchronously
- Book uploads take longer (30-60 seconds)
- First user still waits for content
- Subsequent users get instant responses

### With Redis

If Redis is configured:
- Jobs are queued and processed asynchronously
- Book uploads complete faster
- Worker processes jobs in background
- Better scalability for multiple uploads

## Performance Optimization

### Current Implementation (Option 1+2)

- ✅ Progress indicator shows extraction status
- ✅ Book upload waits for extraction (synchronous)
- ✅ Content cached after first extraction
- ✅ Subsequent users get instant responses

### Future Enhancement (Option 3)

With Redis + BullMQ:
- Book uploads complete immediately
- Extraction happens in background
- Multiple books can be processed concurrently
- Better user experience for admins

## Troubleshooting

### Content Extraction Taking Too Long

1. Check PDF file size (large files take longer)
2. Check network speed to Google Drive
3. Check Zhipu AI API status
4. Check server logs for errors

### Users Not Seeing Chat

1. Verify book type is EBOOK or AUDIO
2. Check if fileUrl is set
3. Verify extraction status in database
4. Check user has access permissions

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis.log
```

## Monitoring

### Check Extraction Status

```bash
curl http://localhost:3000/api/books/{bookId}/extract-content
```

Response:
```json
{
  "hasContent": true,
  "status": "completed",
  "wordCount": 50000,
  "pageCount": 250,
  "version": 1,
  "extractedAt": "2024-01-01T00:00:00.000Z"
}
```

### Force Re-extraction

```sql
UPDATE books
SET "extractedContent" = NULL,
    "extractionStatus" = 'pending'
WHERE id = 'book-id';
```

Then trigger extraction via API:
```bash
curl -X POST http://localhost:3000/api/books/{bookId}/extract-content
```

## Cost Savings

Without caching:
- 100 users × 2 minutes = 200 minutes of processing
- 100 PDF downloads (bandwidth intensive)
- 100 API calls to Zhipu AI

With caching:
- 1 extraction (2 minutes)
- 1 PDF download
- Content cached indefinitely
- All 100 users get instant responses

**Savings: 99% reduction in processing time and bandwidth!**
