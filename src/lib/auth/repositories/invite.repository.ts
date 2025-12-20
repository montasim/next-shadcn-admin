/**
 * Invite Repository
 * 
 * Handles database operations for the Invite model.
 */

import { prisma } from '../../prisma'
import { generateToken } from '../crypto'

/**
 * Check if an invite exists for the email and is still valid
 */
export async function activeInviteExists(email: string) {
    const invite = await prisma.invite.findFirst({
        where: {
            email,
            used: false,
            expiresAt: {
                gt: new Date(),
            },
        },
    })
    return !!invite
}

/**
 * Create a new invite
 */
export async function createInvite(data: {
    email: string
    invitedBy: string
    expiresAt: Date
}) {
    // Generate secure token
    const token = generateToken()

    return prisma.invite.create({
        data: {
            email: data.email,
            token,
            invitedBy: data.invitedBy,
            expiresAt: data.expiresAt,
        },
    })
}

/**
 * Find valid invite by token
 */
export async function findValidInviteByToken(token: string) {
    return prisma.invite.findUnique({
        where: {
            token,
            used: false,
            expiresAt: {
                gt: new Date(),
            },
        },
    })
}

/**
 * Mark invite as used
 */
export async function markInviteAsUsed(id: string) {
    return prisma.invite.update({
        where: { id },
        data: {
            used: true,
            usedAt: new Date(),
        },
    })
}

/**
 * Find invite by email
 */
export async function findInviteByEmail(email: string) {
    return prisma.invite.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
    })
}
