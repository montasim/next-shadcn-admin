// /**
//  * Prisma Client Singleton
//  * 
//  * Following Dependency Inversion Principle (DIP):
//  * This module provides a singleton instance of Prisma Client
//  * to prevent multiple instances and connection pool exhaustion
//  * 
//  * In production: Creates a single instance
//  * In development: Uses globalThis to prevent hot reload issues
//  */

// import { PrismaClient } from '@prisma/client'

// // Extend globalThis to include prisma property
// declare global {
//     // eslint-disable-next-line no-var
//     var prisma: PrismaClient | undefined
// }

// // Create Prisma Client
// const createPrismaClient = () => {
//     return new PrismaClient({
//         log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
//     })
// }

// // Singleton instance
// export const prisma = globalThis.prisma || createPrismaClient()

// // In development, attach to globalThis to prevent multiple instances during hot reload
// if (process.env.NODE_ENV !== 'production') {
//     globalThis.prisma = prisma
// }

// // Graceful shutdown
// if (typeof window === 'undefined') {
//     process.on('beforeExit', async () => {
//         await prisma.$disconnect()
//     })
// }

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from '@/config'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
    const pool = new Pool({ connectionString: config.databaseUrl })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (config.isDevelopment) globalForPrisma.prisma = prisma
