import { z } from 'zod'

export const noticeSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  isActive: z.boolean(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  order: z.number(),
  entryDate: z.string(),
  entryBy: z.string(),
  entryById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createNoticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isActive: z.boolean().default(true),
  validFrom: z.string().nullable().default(null),
  validTo: z.string().nullable().default(null),
  order: z.number().default(0),
})

export const updateNoticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isActive: z.boolean(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  order: z.number(),
})

export type Notice = z.infer<typeof noticeSchema>
export type CreateNoticeData = z.infer<typeof createNoticeSchema>
export type UpdateNoticeData = z.infer<typeof updateNoticeSchema>
