import { z } from 'zod'

export const moodSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  name: z.string(),
  emoji: z.string(),
  description: z.string(),
  color: z.string(),
  isActive: z.boolean(),
  order: z.number(),
  categoryIds: z.array(z.string()),
  entryById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createMoodSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  name: z.string().min(1, 'Name is required'),
  emoji: z.string().min(1, 'Emoji is required'),
  description: z.string().min(1, 'Description is required'),
  color: z.string().min(1, 'Color is required'),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
  categoryIds: z.array(z.string()).default([]),
})

export const updateMoodSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  name: z.string().min(1, 'Name is required'),
  emoji: z.string().min(1, 'Emoji is required'),
  description: z.string().min(1, 'Description is required'),
  color: z.string().min(1, 'Color is required'),
  isActive: z.boolean(),
  order: z.number(),
  categoryIds: z.array(z.string()),
})

// Types
export type Mood = z.infer<typeof moodSchema>
export type CreateMoodData = z.infer<typeof createMoodSchema>
export type UpdateMoodData = z.infer<typeof updateMoodSchema>

// Color options for moods
export const MOOD_COLORS = [
  {
    value: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-700',
    label: 'Yellow',
    preview: 'bg-yellow-100',
  },
  {
    value: 'bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-700',
    label: 'Blue',
    preview: 'bg-blue-100',
  },
  {
    value: 'bg-pink-100 hover:bg-pink-200 border-pink-300 dark:bg-pink-900/20 dark:hover:bg-pink-900/30 dark:border-pink-700',
    label: 'Pink',
    preview: 'bg-pink-100',
  },
  {
    value: 'bg-purple-100 hover:bg-purple-200 border-purple-300 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:border-purple-700',
    label: 'Purple',
    preview: 'bg-purple-100',
  },
  {
    value: 'bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-700',
    label: 'Green',
    preview: 'bg-green-100',
  },
  {
    value: 'bg-amber-100 hover:bg-amber-200 border-amber-300 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:border-amber-700',
    label: 'Amber',
    preview: 'bg-amber-100',
  },
  {
    value: 'bg-teal-100 hover:bg-teal-200 border-teal-300 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 dark:border-teal-700',
    label: 'Teal',
    preview: 'bg-teal-100',
  },
  {
    value: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:border-indigo-700',
    label: 'Indigo',
    preview: 'bg-indigo-100',
  },
  {
    value: 'bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-700',
    label: 'Red',
    preview: 'bg-red-100',
  },
  {
    value: 'bg-orange-100 hover:bg-orange-200 border-orange-300 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:border-orange-700',
    label: 'Orange',
    preview: 'bg-orange-100',
  },
]

// Column configuration for data table
export const moodColumns = [
  {
    key: 'emoji',
    label: '',
    sortable: false,
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'identifier',
    label: 'Identifier',
    sortable: true,
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
  },
  {
    key: 'categoryCount',
    label: 'Categories',
    sortable: true,
  },
  {
    key: 'isActive',
    label: 'Active',
    sortable: true,
  },
  {
    key: 'order',
    label: 'Order',
    sortable: true,
  },
]
