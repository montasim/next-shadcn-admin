import { z } from 'zod'

// Campaign Status enum
const campaignStatusSchema = z.union([
  z.literal('DRAFT'),
  z.literal('SCHEDULED'),
  z.literal('SENDING'),
  z.literal('SENT'),
  z.literal('FAILED'),
  z.literal('CANCELLED'),
])
export type CampaignStatus = z.infer<typeof campaignStatusSchema>

// Campaign Type enum
const campaignTypeSchema = z.union([
  z.literal('ONE_TIME'),
  z.literal('RECURRING'),
])
export type CampaignType = z.infer<typeof campaignTypeSchema>

// Recurrence Frequency enum
const recurrenceFrequencySchema = z.union([
  z.literal('DAILY'),
  z.literal('WEEKLY'),
  z.literal('MONTHLY'),
  z.literal('CUSTOM'),
])
export type RecurrenceFrequency = z.infer<typeof recurrenceFrequencySchema>

// User Role enum
const userRoleSchema = z.union([
  z.literal('USER'),
  z.literal('ADMIN'),
  z.literal('SUPER_ADMIN'),
])
export type UserRole = z.infer<typeof userRoleSchema>

// Main Campaign schema
export const campaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Campaign name is required'),
  subject: z.string().min(1, 'Subject is required'),
  previewText: z.string().optional(),
  htmlContent: z.string(),
  markdownContent: z.string(),

  // Campaign type
  type: campaignTypeSchema.default('ONE_TIME'),

  // Recipients
  targetAllUsers: z.boolean().default(true),
  targetRole: userRoleSchema.optional(),
  recipientCount: z.number().default(0),

  // Status tracking
  status: campaignStatusSchema.default('DRAFT'),
  scheduledAt: z.string().nullable().optional(),
  sentAt: z.string().nullable().optional(),

  // Recurring settings
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: recurrenceFrequencySchema.optional(),
  recurrenceCron: z.string().optional(),
  recurrenceEndDate: z.string().nullable().optional(),
  nextRunAt: z.string().nullable().optional(),

  // Delivery stats
  sentCount: z.number().default(0),
  deliveredCount: z.number().default(0),
  failedCount: z.number().default(0),
  openedCount: z.number().default(0),
  clickedCount: z.number().default(0),
  unsubscribeCount: z.number().default(0),

  // Metadata
  entryById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Campaign = z.infer<typeof campaignSchema>

// Schema for creating a campaign (without auto-generated fields)
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  subject: z.string().min(1, 'Subject is required'),
  previewText: z.string().optional(),
  markdownContent: z.string().min(1, 'Email content is required'),

  // Campaign type
  type: campaignTypeSchema.default('ONE_TIME'),

  // Recipients
  targetAllUsers: z.boolean().default(true),
  targetRole: userRoleSchema.optional(),

  // Scheduling
  scheduledAt: z.string().optional(),

  // Recurring settings
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: recurrenceFrequencySchema.optional(),
  recurrenceCron: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
})
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>

// Schema for updating a campaign
export const updateCampaignSchema = createCampaignSchema.partial().extend({
  id: z.string(),
})
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>

// List schema
export const campaignListSchema = z.array(campaignSchema)

// Schema for campaign statistics
export const campaignStatsSchema = z.object({
  campaignId: z.string(),
  recipientCount: z.number(),
  sentCount: z.number(),
  deliveredCount: z.number(),
  failedCount: z.number(),
  openedCount: z.number(),
  clickedCount: z.number(),
  unsubscribeCount: z.number(),
  openRate: z.number(), // Percentage
  clickRate: z.number(), // Percentage
  unsubscribeRate: z.number(), // Percentage
})
export type CampaignStats = z.infer<typeof campaignStatsSchema>

// Schema for recipient count preview
export const recipientCountSchema = z.object({
  targetAllUsers: z.boolean(),
  targetRole: userRoleSchema.optional(),
})
export type RecipientCountInput = z.infer<typeof recipientCountSchema>

// Schema for campaign recipient
export const campaignRecipientSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  status: campaignStatusSchema.default('DRAFT'),
  sentAt: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  openedAt: z.string().nullable().optional(),
  clickedAt: z.string().nullable().optional(),
  unsubscribedAt: z.string().nullable().optional(),
  failedReason: z.string().optional(),
  clickedLinks: z.any().optional(),
  retryCount: z.number().default(0),
  lastRetryAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type CampaignRecipient = z.infer<typeof campaignRecipientSchema>
