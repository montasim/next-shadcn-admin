import { z } from 'zod'

export const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
] as const

export const accountFormSchema = z.object({
  firstName: z
    .string()
    .min(1, {
      message: 'First name is required.',
    })
    .max(50, {
      message: 'First name must not be longer than 50 characters.',
    }),
  lastName: z
    .string()
    .max(50, {
      message: 'Last name must not be longer than 50 characters.',
    })
    .optional(),
  dob: z.date({
    required_error: 'Date of birth is required.',
  }).refine(
    (date) => {
      const today = new Date()
      const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
      const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
      return date <= maxDate && date >= minDate
    },
    {
      message: 'You must be between 13 and 120 years old.',
    }
  ),
  language: z.string({
    required_error: 'Please select a language.',
  }).default('en'),
})

export type AccountFormValues = z.infer<typeof accountFormSchema>
