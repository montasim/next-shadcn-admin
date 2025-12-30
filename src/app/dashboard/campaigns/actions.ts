'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { markdownToHtml, generateUnsubscribeUrl } from '@/lib/utils/markdown'
import { sendCampaignEmailFromMarkdown } from '@/lib/auth/email'
import { Campaign, CampaignStatus, CampaignType, RecurrenceFrequency, UserRole } from '@prisma/client'
import { logActivity } from '@/lib/activity/repositories/activity-log.repository'
import { Campaign as CampaignSchema } from './data/schema'

// Get all campaigns
export async function getCampaigns(): Promise<CampaignSchema[]> {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        entryBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return campaigns.map(mapPrismaCampaignToCampaign)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return [] as CampaignSchema[]
  }
}

// Get a single campaign
export async function getCampaign(id: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        entryBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        recipients: {
          take: 100, // Limit recipients for performance
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    return mapPrismaCampaignToCampaign(campaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    throw error
  }
}

// Create a new campaign
export async function createCampaign(formData: FormData) {
  const session = await requireAuth()

  try {
    const name = formData.get('name') as string
    const subject = formData.get('subject') as string
    const previewText = formData.get('previewText') as string
    const markdownContent = formData.get('markdownContent') as string
    const type = (formData.get('type') as CampaignType) || CampaignType.ONE_TIME
    const targetAllUsers = formData.get('targetAllUsers') === 'true'
    const targetRole = formData.get('targetRole') as UserRole | null
    const scheduledAt = formData.get('scheduledAt') as string | null
    const isRecurring = formData.get('isRecurring') === 'true'
    const recurrenceFrequency = formData.get('recurrenceFrequency') as RecurrenceFrequency | null
    const recurrenceEndDate = formData.get('recurrenceEndDate') as string | null

    // Validate required fields
    if (!name || !subject || !markdownContent) {
      throw new Error('Name, subject, and content are required')
    }

    // Convert Markdown to HTML
    const htmlContent = markdownToHtml(markdownContent)

    // Get recipient count
    const recipientCount = await getRecipientCountFromDb(targetAllUsers, targetRole)

    // Determine initial status
    let status: CampaignStatus = CampaignStatus.DRAFT
    let scheduledAtDate: Date | null = null

    if (scheduledAt) {
      status = CampaignStatus.SCHEDULED
      scheduledAtDate = new Date(scheduledAt)
    }

    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        subject,
        previewText,
        htmlContent,
        markdownContent,
        type,
        targetAllUsers,
        targetRole,
        recipientCount,
        status,
        scheduledAt: scheduledAtDate,
        isRecurring,
        recurrenceFrequency,
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        entryById: session.userId,
      },
    })

    // Log activity
    await logActivity({
      userId: session.userId,
      userRole: session.role as UserRole,
      action: 'CAMPAIGN_CREATED' as any,
      resourceType: 'CAMPAIGN' as any,
      resourceId: campaign.id,
      resourceName: name,
      description: `Created campaign "${name}"`,
    })

    revalidatePath('/dashboard/campaigns')
    return { success: true, campaignId: campaign.id }
  } catch (error) {
    console.error('Error creating campaign:', error)
    throw error || new Error('Failed to create campaign')
  }
}

// Update a campaign
export async function updateCampaign(id: string, formData: FormData) {
  const session = await requireAuth()

  try {
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!existingCampaign) {
      throw new Error('Campaign not found')
    }

    // Only allow updating DRAFT or FAILED campaigns
    if (existingCampaign.status !== CampaignStatus.DRAFT && existingCampaign.status !== CampaignStatus.FAILED) {
      throw new Error('Can only update draft or failed campaigns')
    }

    const name = formData.get('name') as string
    const subject = formData.get('subject') as string
    const previewText = formData.get('previewText') as string
    const markdownContent = formData.get('markdownContent') as string
    const type = (formData.get('type') as CampaignType) || existingCampaign.type
    const targetAllUsers = formData.get('targetAllUsers') === 'true'
    const targetRole = formData.get('targetRole') as UserRole | null
    const scheduledAt = formData.get('scheduledAt') as string | null
    const isRecurring = formData.get('isRecurring') === 'true'
    const recurrenceFrequency = formData.get('recurrenceFrequency') as RecurrenceFrequency | null
    const recurrenceEndDate = formData.get('recurrenceEndDate') as string | null

    // Convert Markdown to HTML
    const htmlContent = markdownToHtml(markdownContent)

    // Get recipient count
    const recipientCount = await getRecipientCountFromDb(targetAllUsers, targetRole)

    // Update the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        name,
        subject,
        previewText,
        htmlContent,
        markdownContent,
        type,
        targetAllUsers,
        targetRole,
        recipientCount,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isRecurring,
        recurrenceFrequency,
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      },
    })

    // Log activity
    await logActivity({
      userId: session.userId,
      userRole: session.role as UserRole,
      action: 'CAMPAIGN_UPDATED' as any,
      resourceType: 'CAMPAIGN' as any,
      resourceId: id,
      resourceName: name,
      description: `Updated campaign "${name}"`,
    })

    revalidatePath('/dashboard/campaigns')
    return { success: true, campaign: mapPrismaCampaignToCampaign(updatedCampaign) }
  } catch (error) {
    console.error('Error updating campaign:', error)
    throw error || new Error('Failed to update campaign')
  }
}

// Delete a campaign
export async function deleteCampaign(id: string) {
  const session = await requireAuth()

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Only allow deleting DRAFT, FAILED, or CANCELLED campaigns
    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.FAILED &&
      campaign.status !== CampaignStatus.CANCELLED
    ) {
      throw new Error('Can only delete draft, failed, or cancelled campaigns')
    }

    await prisma.campaign.delete({
      where: { id },
    })

    // Log activity
    await logActivity({
      userId: session.userId,
      userRole: session.role as UserRole,
      action: 'CAMPAIGN_DELETED' as any,
      resourceType: 'CAMPAIGN' as any,
      resourceId: id,
      resourceName: campaign.name,
      description: `Deleted campaign "${campaign.name}"`,
    })

    revalidatePath('/dashboard/campaigns')
    return { success: true }
  } catch (error) {
    console.error('Error deleting campaign:', error)
    throw error || new Error('Failed to delete campaign')
  }
}

// Send a campaign immediately
export async function sendCampaign(id: string) {
  const session = await requireAuth()

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.FAILED) {
      throw new Error('Campaign has already been sent or scheduled')
    }

    // Update status to SENDING
    await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.SENDING },
    })

    // Get recipients
    const users = await getCampaignRecipients(campaign.targetAllUsers, campaign.targetRole)

    if (users.length === 0) {
      throw new Error('No recipients found for this campaign')
    }

    // Create campaign recipients
    const recipients = await prisma.campaignRecipient.createMany({
      data: users.map((u) => ({
        campaignId: id,
        userId: u.id,
        userEmail: u.email,
        status: CampaignStatus.SCHEDULED,
      })),
    })

    // Update campaign recipient count
    await prisma.campaign.update({
      where: { id },
      data: {
        recipientCount: recipients.count,
        sentCount: recipients.count,
      },
    })

    // Send emails to all recipients (in production, this should be a background job)
    let sentCount = 0
    let failedCount = 0

    for (const userRecipient of users) {
      const unsubscribeUrl = generateUnsubscribeUrl(id, userRecipient.id)

      const result = await sendCampaignEmailFromMarkdown(
        userRecipient.email,
        campaign.subject,
        campaign.previewText || undefined,
        campaign.markdownContent,
        {
          userName: userRecipient.firstName && userRecipient.lastName
            ? `${userRecipient.firstName} ${userRecipient.lastName}`
            : userRecipient.email.split('@')[0],
          firstName: userRecipient.firstName || undefined,
          email: userRecipient.email,
          unsubscribeUrl,
        }
      )

      if (result.success) {
        sentCount++
        await prisma.campaignRecipient.updateMany({
          where: {
            campaignId: id,
            userId: userRecipient.id,
          },
          data: {
            status: CampaignStatus.SENT,
            sentAt: new Date(),
          },
        })
      } else {
        failedCount++
        await prisma.campaignRecipient.updateMany({
          where: {
            campaignId: id,
            userId: userRecipient.id,
          },
          data: {
            status: CampaignStatus.FAILED,
            failedReason: result.error,
          },
        })
      }
    }

    // Update campaign status
    const finalStatus = failedCount === 0 ? CampaignStatus.SENT : CampaignStatus.SENT
    await prisma.campaign.update({
      where: { id },
      data: {
        status: finalStatus,
        sentAt: new Date(),
        sentCount,
        failedCount,
        deliveredCount: sentCount,
      },
    })

    // Log activity
    await logActivity({
      userId: session.userId,
      userRole: session.role as UserRole,
      action: 'CAMPAIGN_SENT' as any,
      resourceType: 'CAMPAIGN' as any,
      resourceId: id,
      resourceName: campaign.name,
      description: `Sent campaign "${campaign.name}" to ${sentCount} recipients`,
    })

    revalidatePath('/dashboard/campaigns')
    return {
      success: true,
      sentCount,
      failedCount,
      totalRecipients: users.length,
    }
  } catch (error) {
    console.error('Error sending campaign:', error)

    // Update campaign status to FAILED
    await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.FAILED },
    }).catch(() => {})

    throw error || new Error('Failed to send campaign')
  }
}

// Schedule a campaign for later
export async function scheduleCampaign(id: string, scheduledAt: Date) {
  const session = await requireAuth()

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.FAILED) {
      throw new Error('Campaign has already been sent or scheduled')
    }

    await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.SCHEDULED,
        scheduledAt,
      },
    })

    // Log activity
    await logActivity({
      userId: session.userId,
      userRole: session.role as UserRole,
      action: 'CAMPAIGN_UPDATED' as any,
      resourceType: 'CAMPAIGN' as any,
      resourceId: id,
      resourceName: campaign.name,
      description: `Scheduled campaign "${campaign.name}" for ${scheduledAt.toISOString()}`,
    })

    revalidatePath('/dashboard/campaigns')
    return { success: true }
  } catch (error) {
    console.error('Error scheduling campaign:', error)
    throw error || new Error('Failed to schedule campaign')
  }
}

// Cancel a scheduled campaign
export async function cancelCampaign(id: string) {
  const session = await requireAuth()

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    if (campaign.status !== CampaignStatus.SCHEDULED && campaign.status !== CampaignStatus.SENDING) {
      throw new Error('Can only cancel scheduled or sending campaigns')
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.CANCELLED },
    })

    // Log activity
    await logActivity({
      userId: session.userId,
      userRole: session.role as UserRole,
      action: 'CAMPAIGN_CANCELLED' as any,
      resourceType: 'CAMPAIGN' as any,
      resourceId: id,
      resourceName: campaign.name,
      description: `Cancelled campaign "${campaign.name}"`,
    })

    revalidatePath('/dashboard/campaigns')
    return { success: true }
  } catch (error) {
    console.error('Error cancelling campaign:', error)
    throw error || new Error('Failed to cancel campaign')
  }
}

// Get campaign statistics
export async function getCampaignStats(id: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 1000, // Limit for performance
        },
      },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    const recipientCount = campaign.recipientCount
    const sentCount = campaign.sentCount
    const deliveredCount = campaign.deliveredCount
    const failedCount = campaign.failedCount
    const openedCount = campaign.openedCount
    const clickedCount = campaign.clickedCount
    const unsubscribeCount = campaign.unsubscribeCount

    const openRate = sentCount > 0 ? (openedCount / sentCount) * 100 : 0
    const clickRate = sentCount > 0 ? (clickedCount / sentCount) * 100 : 0
    const unsubscribeRate = sentCount > 0 ? (unsubscribeCount / sentCount) * 100 : 0

    return {
      campaignId: id,
      recipientCount,
      sentCount,
      deliveredCount,
      failedCount,
      openedCount,
      clickedCount,
      unsubscribeCount,
      openRate,
      clickRate,
      unsubscribeRate,
    }
  } catch (error) {
    console.error('Error fetching campaign stats:', error)
    throw error
  }
}

// Get recipient count preview
export async function getRecipientCount(targetAllUsers: boolean, targetRole?: string) {
  try {
    return await getRecipientCountFromDb(targetAllUsers, targetRole)
  } catch (error) {
    console.error('Error getting recipient count:', error)
    return 0
  }
}

// Helper function to get recipients based on targeting
async function getCampaignRecipients(targetAllUsers: boolean, targetRole?: string | null) {
  const where: any = {
    isActive: true,
    marketingEmails: true, // Only users who have opted in to marketing emails
  }

  if (!targetAllUsers && targetRole) {
    where.role = targetRole
  }

  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  })
}

// Helper function to get recipient count
async function getRecipientCountFromDb(targetAllUsers: boolean, targetRole?: string | null) {
  const where: any = {
    isActive: true,
    marketingEmails: true,
  }

  if (!targetAllUsers && targetRole) {
    where.role = targetRole
  }

  return await prisma.user.count({ where })
}

// Test run a campaign - sends to current user only
export async function testRunCampaign(id: string) {
  const session = await requireAuth()

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Send test email to current user
    const unsubscribeUrl = generateUnsubscribeUrl(id, user.id)

    const result = await sendCampaignEmailFromMarkdown(
      user.email,
      `[TEST] ${campaign.subject}`,
      campaign.previewText || undefined,
      campaign.markdownContent,
      {
        userName: user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email.split('@')[0],
        firstName: user.firstName || undefined,
        email: user.email,
        unsubscribeUrl,
      }
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to send test email')
    }

    // Log activity
    await logActivity({
      userId: session.userId,
      userRole: session.role as UserRole,
      action: 'CAMPAIGN_SENT' as any,
      resourceType: 'CAMPAIGN' as any,
      resourceId: id,
      resourceName: campaign.name,
      description: `Test run for campaign "${campaign.name}" sent to ${user.email}`,
    })

    revalidatePath('/dashboard/campaigns')
    return {
      success: true,
      message: `Test email sent successfully to ${user.email}`,
    }
  } catch (error) {
    console.error('Error running test campaign:', error)
    throw error || new Error('Failed to send test email')
  }
}

// Test run a campaign with custom content (for testing before saving)
export async function testRunCampaignWithContent(
  subject: string,
  previewText: string,
  markdownContent: string
) {
  const session = await requireAuth()

  try {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Generate a temporary ID for unsubscribe URL
    const tempCampaignId = 'test-campaign'

    // Send test email to current user
    const unsubscribeUrl = generateUnsubscribeUrl(tempCampaignId, user.id)

    const result = await sendCampaignEmailFromMarkdown(
      user.email,
      `[TEST] ${subject}`,
      previewText || undefined,
      markdownContent,
      {
        userName: user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email.split('@')[0],
        firstName: user.firstName || undefined,
        email: user.email,
        unsubscribeUrl,
      }
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to send test email')
    }

    return {
      success: true,
      message: `Test email sent successfully to ${user.email}`,
    }
  } catch (error) {
    console.error('Error running test campaign with custom content:', error)
    throw error || new Error('Failed to send test email')
  }
}

// Helper function to map Prisma Campaign to Campaign type
function mapPrismaCampaignToCampaign(prismaCampaign: any): CampaignSchema {
  const { entryBy, recipients, createdAt, updatedAt, scheduledAt, sentAt, recurrenceEndDate, nextRunAt, ...campaign } = prismaCampaign
  return {
    ...campaign,
    scheduledAt: scheduledAt?.toISOString() || null,
    sentAt: sentAt?.toISOString() || null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    recurrenceEndDate: recurrenceEndDate?.toISOString() || null,
    nextRunAt: nextRunAt?.toISOString() || null,
  }
}
