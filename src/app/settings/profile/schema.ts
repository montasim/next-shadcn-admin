import { z } from 'zod'

export const profileFormSchema = z.object({
  username: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 2 && val.length <= 30), {
      message: 'Username must be between 2 and 30 characters if provided.',
    }),
  email: z
    .string({
      required_error: 'Email is required.',
    })
    .email({
      message: 'Please enter a valid email address.',
    }),
  bio: z.string().max(160).optional(),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: 'Please enter a valid URL.' }),
      })
    )
    .default([]),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>
