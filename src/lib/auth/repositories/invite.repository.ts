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
export async function createInvite({
    email,
    invitedBy,
    role,
    desc,
    expiresAt,
}: {
    email: string
    invitedBy: string
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    desc?: string
    expiresAt: Date
}) {
    const token = generateToken()

    return prisma.invite.upsert({
        where: { email },
        update: {
            token,
            invitedBy,
            role,
            desc,
            expiresAt,
            used: false,
            usedAt: null,
            createdAt: new Date(), // Reset created at to show it's "new"
        },
        create: {
            email,
            token,
            invitedBy,
            role,
            desc,
            expiresAt,
        },
    })
}

/**
 * Find valid invite by token
 */
export async function findValidInviteByToken(token: string) {
    return prisma.invite.findFirst({
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
 * Find invite by token (including used)
 */
export async function findInviteByToken(token: string) {
    return prisma.invite.findUnique({
        where: { token },
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
