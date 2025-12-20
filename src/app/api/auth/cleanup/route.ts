/**
 * Cleanup Jobs Endpoint
 * 
 * POST /api/auth/cleanup
 * 
 * Manually trigger cleanup of expired OTPs and sessions
 * 
 * Security:
 * - Should be protected in production (e.g., API key, internal only)
 * - For development/testing or cron job invocation
 */

import { NextRequest } from 'next/server'
import { runAllCleanupJobs } from '@/lib/auth/cleanup'
import { successResponse, errorResponse } from '@/lib/auth/request-utils'

export async function POST(request: NextRequest) {
    try {
        // In production, add authentication check here
        // For example: verify API key from headers

        const results = await runAllCleanupJobs()

        return successResponse({
            message: 'Cleanup completed successfully',
            results,
        })
    } catch (error) {
        console.error('Cleanup jobs error:', error)
        return errorResponse('Cleanup failed', 500)
    }
}
