/**
 * Request Utilities
 * 
 * Following Single Responsibility Principle (SRP):
 * This module provides utilities for extracting information from Next.js requests
 */

import {NextRequest, NextResponse} from 'next/server'

/**
 * Extract client IP address from request
 * Considers proxy headers for accurate IP detection
 * 
 * @param {NextRequest} request - Next.js request object
 * @returns {string} Client IP address
 */
export function getClientIp(request: NextRequest): string {
    // Check for common proxy headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim()
    }

    const realIp = request.headers.get('x-real-ip')
    if (realIp) {
        return realIp.trim()
    }

    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    if (cfConnectingIp) {
        return cfConnectingIp.trim()
    }

    // Fallback to localhost if IP cannot be determined
    return '127.0.0.1'
}

/**
 * Parse JSON body from request with error handling
 * 
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<any>} Parsed JSON body or null if invalid
 */
export async function parseRequestBody(request: NextRequest): Promise<any> {
    try {
        return await request.json()
    } catch (error) {
        console.error('Error parsing request body:', error)
        return null
    }
}

/**
 * Create JSON response with standard error format
 * 
 * @param {string} error - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} Next.js Response object
 */
export function errorResponse(error: string, status: number = 400): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error,
        },
        {
            status,
        }
    )
}

/**
 * Create JSON response with success data
 * 
 * @param {any} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Response} Next.js Response object
 */
export function successResponse(data: any, status: number = 200): NextResponse {
    return NextResponse.json(
        {
            success: true,
            ...data,
        },
        {
            status,
        }
    )
}
