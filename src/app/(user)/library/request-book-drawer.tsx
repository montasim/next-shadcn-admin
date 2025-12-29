'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookOpen, Mic, Loader2 } from 'lucide-react'
import { BookType } from '@prisma/client'
import { VoiceInputButton } from '@/components/voice/voice-input-button'
import { VoiceConfirmationModal } from '@/components/voice/voice-confirmation-modal'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const formSchema = z.object({
  bookName: z.string().min(1, 'Book name is required.'),
  authorName: z.string().min(1, 'Author name is required.'),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO'] as const),
  edition: z.string().optional(),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
})

type BookRequestForm = z.infer<typeof formSchema>

export function RequestBookDrawer({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')

  const form = useForm<BookRequestForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookName: '',
      authorName: '',
      type: 'HARD_COPY',
      edition: '',
      publisher: '',
      isbn: '',
      description: '',
    },
  })

  const onSubmit = async (data: BookRequestForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/book-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: result.message })
        form.reset()
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error: any) {
      console.error('Error submitting request:', error)
      toast({ title: 'Failed to submit request', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceInput = async (transcript: string) => {
    console.log('[RequestDrawer] Voice transcript received:', transcript)
    setVoiceTranscript(transcript)
    setIsParsing(true)

    try {
      toast({
        title: 'Processing Voice Input',
        description: 'AI is extracting book details...',
      })

      const response = await fetch('/api/user/parse-voice-book-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voiceText: transcript }),
      })

      // Check response status before parsing JSON
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('[RequestDrawer] API error:', response.status, errorText)
        toast({
          title: 'Processing Failed',
          description: `Server error (${response.status}). Please try again.`,
          variant: 'destructive'
        })
        return
      }

      const result = await response.json()

      if (result.success && result.data) {
        // Auto-fill form with parsed data
        console.log('[RequestDrawer] Parsed data:', result.data)
        form.reset(result.data)

        toast({
          title: 'Voice Input Processed',
          description: 'Book details extracted! Review below, edit if needed, then click "Voice Submit" to confirm.',
        })

        // Note: We DON'T automatically show confirmation modal anymore
        // User reviews the form, edits if needed, then clicks "Voice Submit" button
      } else {
        toast({
          title: 'Processing Failed',
          description: result.error || 'Failed to parse voice input. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Error parsing voice input:', error)
      toast({
        title: 'Error',
        description: 'Failed to process voice input. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsParsing(false)
    }
  }

  const handleVoiceSubmit = () => {
    const formValues = form.getValues()

    // Check if required fields have valid data
    if (formValues.bookName && formValues.authorName && formValues.type) {
      setShowConfirmation(true)
    } else {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in the required fields (Book Title and Author) before submitting.',
        variant: 'destructive'
      })
    }
  }

  const handleConfirmSubmit = () => {
    setShowConfirmation(false)
    form.handleSubmit(onSubmit)()
  }

  const getTypeLabel = (type: BookType) => {
    switch (type) {
      case 'HARD_COPY':
        return 'Hard Copy'
      case 'EBOOK':
        return 'E-Book'
      case 'AUDIO':
        return 'Audio Book'
      default:
        return type
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            form.reset()
            setVoiceTranscript('')
          }
          onOpenChange(v)
        }}
      >
        <SheetContent className="flex flex-col max-w-2xl overflow-y-auto">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SheetTitle>Request a Book</SheetTitle>
                <SheetDescription>
                  {voiceTranscript
                    ? 'Voice input processed! Review the extracted details below, edit if needed, then click "Voice Submit with Confirmation" button.'
                    : 'Provide book details manually or use voice input. Click the mic button to speak. (Note: Voice input requires internet connection)'
                  }
                </SheetDescription>
              </div>
              <VoiceInputButton
                onTranscript={handleVoiceInput}
                disabled={isParsing || loading}
                className="shrink-0"
                onListeningChange={setIsListening}
              />
            </div>

            {/* Voice Status Indicators */}
            {(isListening || isParsing || voiceTranscript) && (
              <div className="mt-3 space-y-2">
                {isListening && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg animate-pulse">
                    <div className="relative">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-red-900 dark:text-red-100">
                        Listening... Keep speaking (waits 5 seconds after you stop)
                      </span>
                    </div>
                  </div>
                )}

                {isParsing && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        AI is analyzing your voice...
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                        Extracting book details
                      </p>
                    </div>
                  </div>
                )}

                {voiceTranscript && !isParsing && !isListening && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                      ✓ Voice captured successfully
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="italic">"{voiceTranscript}"</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </SheetHeader>
        <Form {...form}>
          <form
            id="request-book-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 flex-1 mt-4"
          >
            <FormField
              control={form.control}
              name="bookName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Book Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter book title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Author <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter author name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Book Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select book type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HARD_COPY">Hard Copy</SelectItem>
                      <SelectItem value="EBOOK">E-Book</SelectItem>
                      <SelectItem value="AUDIO">Audio Book</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the format you prefer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="edition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edition</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 2nd Edition" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISBN</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="978-0-1234567-8-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="publisher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publisher</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter publisher name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormDescription>
                    Any additional information about the book (optional)
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter book description, summary, or any additional notes..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <div className="space-y-2">
          {/* Voice Submit Button */}
          <Button
            variant="outline"
            onClick={handleVoiceSubmit}
            disabled={loading || isParsing || isListening || !form.formState.isValid}
            className="w-full"
          >
            {loading || isParsing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                {voiceTranscript ? 'Review & Confirm with Voice' : 'Voice Submit with Confirmation'}
              </>
            )}
          </Button>

          {/* Cancel and Submit Buttons */}
          <SheetFooter className="gap-2 sm:flex-row py-0">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </SheetClose>
            <Button
              form="request-book-form"
              type="submit"
              disabled={loading || isParsing || isListening || !form.formState.isValid}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>

      {/* Voice Confirmation Modal */}
      <VoiceConfirmationModal
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        bookDetails={form.getValues()}
        onConfirm={handleConfirmSubmit}
      />
    </>
  )
}
