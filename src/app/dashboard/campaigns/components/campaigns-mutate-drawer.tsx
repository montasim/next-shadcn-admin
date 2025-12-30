'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCampaignsContext } from '../context/campaigns-context'
import { createCampaignSchema, CreateCampaignInput, Campaign } from '../data/schema'
import { createCampaign, updateCampaign, getRecipientCount, testRunCampaignWithContent } from '../actions'
import { toast } from '@/hooks/use-toast'
import { MarkdownEmailEditor, TemplateVariablesHint } from './markdown-email-editor'
import { Loader2, TestTube } from 'lucide-react'

interface CampaignsMutateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Campaign | null
  onSuccess?: () => void
}

export function CampaignsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: CampaignsMutateDialogProps) {
  const router = useRouter()
  const isEdit = !!currentRow
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recipientCount, setRecipientCount] = useState(0)
  const [isTesting, setIsTesting] = useState(false)

  const form = useForm<CreateCampaignInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      subject: '',
      previewText: '',
      markdownContent: '',
      type: 'ONE_TIME',
      targetAllUsers: true,
      targetRole: undefined,
      scheduledAt: undefined,
      isRecurring: false,
      recurrenceFrequency: undefined,
      recurrenceEndDate: undefined,
    },
  })

  // Load existing data when editing
  useEffect(() => {
    if (currentRow && isEdit) {
      form.reset({
        name: currentRow.name,
        subject: currentRow.subject,
        previewText: currentRow.previewText || '',
        markdownContent: currentRow.markdownContent,
        type: currentRow.type,
        targetAllUsers: currentRow.targetAllUsers,
        targetRole: currentRow.targetRole || undefined,
        scheduledAt: currentRow.scheduledAt || undefined,
        isRecurring: currentRow.isRecurring,
        recurrenceFrequency: currentRow.recurrenceFrequency || undefined,
        recurrenceEndDate: currentRow.recurrenceEndDate || undefined,
      })
      setRecipientCount(currentRow.recipientCount)
    } else {
      form.reset()
      setRecipientCount(0)
    }
  }, [currentRow, isEdit, form])

  // Update recipient count when targeting options change
  useEffect(() => {
    const updateRecipientCount = async () => {
      const targetAllUsers = form.watch('targetAllUsers')
      const targetRole = form.watch('targetRole')
      const count = await getRecipientCount(targetAllUsers, targetRole)
      setRecipientCount(count)
    }

    const subscription = form.watch(() => {
      updateRecipientCount()
    })

    // Initial count
    updateRecipientCount()

    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = async (data: CreateCampaignInput) => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('subject', data.subject)
      if (data.previewText) formData.append('previewText', data.previewText)
      formData.append('markdownContent', data.markdownContent)
      formData.append('type', data.type)
      formData.append('targetAllUsers', String(data.targetAllUsers))
      if (data.targetRole) formData.append('targetRole', data.targetRole)
      if (data.scheduledAt) formData.append('scheduledAt', data.scheduledAt)
      formData.append('isRecurring', String(data.isRecurring))
      if (data.recurrenceFrequency) formData.append('recurrenceFrequency', data.recurrenceFrequency)
      if (data.recurrenceEndDate) formData.append('recurrenceEndDate', data.recurrenceEndDate)

      if (isEdit && currentRow) {
        await updateCampaign(currentRow.id, formData)
        toast({
          title: 'Campaign updated',
          description: 'Campaign has been updated successfully',
        })
      } else {
        await createCampaign(formData)
        toast({
          title: 'Campaign created',
          description: 'Campaign has been created successfully',
        })
      }

      onSuccess?.()
      router.refresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving campaign:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save campaign',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onTest = async () => {
    const values = form.getValues()
    if (!values.subject || !values.markdownContent) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a subject and email content before testing',
        variant: 'destructive',
      })
      return
    }

    setIsTesting(true)
    try {
      await testRunCampaignWithContent(
        values.subject,
        values.previewText || '',
        values.markdownContent
      )
      toast({
        title: 'Test Email Sent',
        description: 'Check your inbox for the test email',
      })
    } catch (error) {
      console.error('Error sending test email:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test email',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the campaign details' : 'Create a new email campaign to send to your users'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-1">
            {/* Basic Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer Newsletter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Check out our latest updates!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previewText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preview Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief preview shown in email inbox" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional short text shown in email clients before opening
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campaign Type */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select campaign type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ONE_TIME">One-time (send once)</SelectItem>
                        <SelectItem value="RECURRING">Recurring (scheduled)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('type') === 'RECURRING' && (
                <>
                  <FormField
                    control={form.control}
                    name="recurrenceFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="CUSTOM">Custom (cron)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Targeting */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="targetAllUsers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Target All Users</FormLabel>
                      <FormDescription className="text-xs">
                        Send to all users with marketing emails enabled
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!form.watch('targetAllUsers') && (
                <FormField
                  control={form.control}
                  name="targetRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USER">Users</SelectItem>
                          <SelectItem value="ADMIN">Admins</SelectItem>
                          <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium">Estimated Recipients</p>
                <p className="text-2xl font-bold">{recipientCount}</p>
                <p className="text-xs text-muted-foreground">
                  Users with marketing emails enabled
                </p>
              </div>
            </div>

            {/* Email Content */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="markdownContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Content</FormLabel>
                    <FormControl>
                      <MarkdownEmailEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write your email in Markdown...&#10;&#10;## Hello {{firstName}}!&#10;&#10;We're excited to share...&#10;&#10;- Feature 1&#10;- Feature 2&#10;- Feature 3&#10;&#10;[Learn More](https://example.com)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <TemplateVariablesHint />
            </div>

            {/* Scheduling */}
            {!form.watch('isRecurring') && (
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule For Later (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Leave empty to send immediately when you click "Send"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onTest}
                  disabled={isTesting || isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Run
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEdit ? (
                    'Update Campaign'
                  ) : (
                    'Create Campaign'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
