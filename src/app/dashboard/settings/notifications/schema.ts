import { z } from 'zod'

export const notificationsFormSchema = z.object({
  notificationType: z.enum(['all', 'mentions', 'none'], {
    required_error: 'You need to select a notification type.',
  }).default('all'),
  mobileNotifications: z.boolean().default(false),
  communicationEmails: z.boolean().default(false),
  socialEmails: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  securityEmails: z.boolean().default(true),
})

export type NotificationsFormValues = z.infer<typeof notificationsFormSchema>
