'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { updateSellPost, permanentlyDeleteSellPost } from '@/lib/marketplace/repositories'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateSellPostSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    price: z.coerce.number().positive().optional(),
    status: z.enum(['AVAILABLE', 'PENDING', 'SOLD', 'EXPIRED', 'HIDDEN']).optional(),
})

/**
 * PATCH /api/admin/marketplace/posts/[id]
 * Edit any sell post (admin)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth()
        if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            )
        }

        const { id } = await params
        const body = await request.json()

        const validation = UpdateSellPostSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: 'Invalid input' },
                { status: 400 }
            )
        }

        const data = validation.data

        // Admin can update any post (skip ownership check by passing admin flag)
        const post = await updateSellPost(id, 'admin', data)

        revalidatePath('/dashboard/marketplace/posts')
        revalidatePath('/marketplace')
        revalidatePath(`/marketplace/${id}`)

        return NextResponse.json({
            success: true,
            data: post,
            message: 'Sell post updated successfully',
        })
    } catch (error: any) {
        console.error('Update admin sell post error:', error)

        if (error.message === 'Sell post not found') {
            return NextResponse.json(
                { success: false, message: 'Sell post not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to update sell post' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/marketplace/posts/[id]
 * Permanently delete any sell post (admin)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth()
        if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            )
        }

        const { id } = await params

        await permanentlyDeleteSellPost(id)

        revalidatePath('/dashboard/marketplace/posts')
        revalidatePath('/marketplace')

        return NextResponse.json({
            success: true,
            message: 'Sell post deleted successfully',
        })
    } catch (error: any) {
        console.error('Delete admin sell post error:', error)

        return NextResponse.json(
            { success: false, message: 'Failed to delete sell post' },
            { status: 500 }
        )
    }
}
