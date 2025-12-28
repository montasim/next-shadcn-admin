import { z } from 'zod'

export const seriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  directImageUrl: z.string().nullable(),
  entryDate: z.string(),
  entryById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({
    books: z.number(),
  }).optional(),
})

export type Series = z.infer<typeof seriesSchema>
