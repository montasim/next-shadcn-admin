'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mic, Loader2, CheckCircle2, XCircle, AudioLines } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface VoiceConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookDetails: {
    bookName: string
    authorName: string
    type: string
    edition?: string
    publisher?: string
    isbn?: string
    description?: string
  }
  onConfirm: () => void
}

export function VoiceConfirmationModal({
  open,
  onOpenChange,
  bookDetails,
  onConfirm
}: VoiceConfirmationModalProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'confirmed' | 'cancelled'>('idle')
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus)
    console.log('[Voice Confirm] Status:', newStatus)
  }, [])

  // Text-to-speech for confirmation prompt
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.lang = 'en-US'

      // When speech ends, call the callback
      utterance.onend = () => {
        console.log('[Voice Confirm] Speech synthesis finished')
        onEnd?.()
      }

      utterance.onerror = (event) => {
        console.error('[Voice Confirm] Speech synthesis error:', event)
        onEnd?.() // Start listening even if speech fails
      }

      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const getRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null

    const recognition = new SpeechRecognition()
    recognition.continuous = true  // Keep listening for better yes/no capture
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('[Voice Confirm] Recognition started')
      setIsListening(true)
      updateStatus('listening')
    }

    recognition.onend = () => {
      console.log('[Voice Confirm] Recognition ended')
      setIsListening(false)
    }

    recognition.onresult = (event: any) => {
      // Get the last result
      const lastResult = event.results[event.results.length - 1]
      const text = lastResult[0].transcript.toLowerCase().trim()
      const isFinal = lastResult.isFinal

      console.log('[Voice Confirm] Got result:', text, 'Is final:', isFinal)
      setTranscript(text)

      if (isFinal) {
        console.log('[Voice Confirm] Final result received, processing...')

        // Stop recognition immediately after getting final result
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        setIsListening(false)

        // Check for confirmation or cancellation
        if (text.includes('yes') || text.includes('confirm') || text.includes('correct') || text.includes('submit') || text === 'yes') {
          console.log('[Voice Confirm] User confirmed')
          updateStatus('confirmed')
          speak('Request confirmed. Submitting now.')
          setTimeout(() => {
            onConfirm()
            onOpenChange(false)
          }, 1500)
        } else if (text.includes('no') || text.includes('cancel') || text.includes("don't") || text === 'no') {
          console.log('[Voice Confirm] User cancelled')
          updateStatus('cancelled')
          speak('Request cancelled.')
          setTimeout(() => {
            onOpenChange(false)
          }, 1000)
        } else {
          console.log('[Voice Confirm] Not understood:', text)
          updateStatus('idle')
          toast({
            title: 'Not Understood',
            description: `You said "${text}". Please say "yes" to confirm or "no" to cancel.`,
            variant: 'default'
          })
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[Voice Confirm] Recognition error:', event.error)
      setIsListening(false)
      updateStatus('idle')

      if (event.error !== 'aborted') {
        toast({
          title: 'Voice Input Error',
          description: `Error: ${event.error}. Please try again.`,
          variant: 'destructive'
        })
      }
    }

    return recognition
  }, [onConfirm, onOpenChange, updateStatus, speak])

  const startListening = useCallback(() => {
    console.log('[Voice Confirm] Starting listening...')

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast({
        title: 'Voice Input Not Supported',
        description: 'Your browser does not support voice input.',
        variant: 'destructive'
      })
      return
    }

    try {
      // Create new recognition instance
      const recognition = getRecognition()
      if (!recognition) {
        throw new Error('Failed to create recognition instance')
      }

      recognitionRef.current = recognition

      // Set timeout to stop after 10 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        console.log('[Voice Confirm] Timeout reached')
        stopListening()
      }, 10000)

      recognition.start()
      console.log('[Voice Confirm] Recognition started successfully')
    } catch (error) {
      console.error('[Voice Confirm] Error starting recognition:', error)
      updateStatus('idle')
      toast({
        title: 'Error',
        description: 'Failed to start voice input. Please try again.',
        variant: 'destructive'
      })
    }
  }, [getRecognition, updateStatus, speak, onConfirm, onOpenChange])

  const stopListening = useCallback(() => {
    console.log('[Voice Confirm] Manual stop requested')
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log('[Voice Confirm] Recognition stopped')
      } catch (error) {
        console.log('[Voice Confirm] Recognition already stopped')
      }
    }
    setIsListening(false)
    updateStatus('idle')
  }, [updateStatus])

  // Speak confirmation details when modal opens and auto-start listening
  useEffect(() => {
    if (!open) return

    setTranscript('')
    updateStatus('idle')

    const details = `Please confirm your book request. Title: ${bookDetails.bookName}. Author: ${bookDetails.authorName || 'not specified'}. Type: ${bookDetails.type}. ${bookDetails.edition ? `Edition: ${bookDetails.edition}.` : ''} ${bookDetails.isbn ? `ISBN: ${bookDetails.isbn}.` : ''} ${bookDetails.publisher ? `Publisher: ${bookDetails.publisher}.` : ''} Say yes to confirm or no to cancel.`

    // Wait 1 second, then speak the details
    setTimeout(() => {
      console.log('[Voice Confirm] Speaking details...')
      speak(details, () => {
        // Start listening immediately after speech finishes
        console.log('[Voice Confirm] Speech finished, auto-starting listening...')
        setTimeout(() => {
          startListening()
        }, 500) // Small delay to ensure speech is fully done
      })
    }, 1000)

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [open, bookDetails, speak, updateStatus, startListening])

  // Cleanup timeout when modal closes
  useEffect(() => {
    return () => {
      console.log('[Voice Confirm] Cleaning up')
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
          recognitionRef.current = null
        } catch (error) {
          console.log('[Voice Confirm] Cleanup: recognition already stopped')
        }
      }
    }
  }, [])

  const getTypeLabel = (type: string) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Confirm Book Request
          </DialogTitle>
          <DialogDescription>
            System will speak your book details, then automatically listen for your "yes" or "no" response.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {status === 'confirmed' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Request Confirmed</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Submitting your request...</p>
                </div>
              </div>
            )}

            {status === 'cancelled' && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">Request Cancelled</p>
                  <p className="text-sm text-red-700 dark:text-red-300">You can modify and resubmit.</p>
                </div>
              </div>
            )}

            {status === 'idle' && !isListening && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Speaking book details...
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Listening will start automatically</p>
                </div>
              </div>
            )}

            {isListening && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg animate-pulse">
                <div className="relative">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Listening... Say "yes" or "no"
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">Speak clearly into your microphone</p>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg">Book Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Title:</span>
                  <p className="font-medium">{bookDetails.bookName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Author:</span>
                  <p className="font-medium">{bookDetails.authorName || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{getTypeLabel(bookDetails.type)}</p>
                </div>
                {bookDetails.edition && (
                  <div>
                    <span className="text-muted-foreground">Edition:</span>
                    <p className="font-medium">{bookDetails.edition}</p>
                  </div>
                )}
                {bookDetails.isbn && (
                  <div>
                    <span className="text-muted-foreground">ISBN:</span>
                    <p className="font-medium">{bookDetails.isbn}</p>
                  </div>
                )}
                {bookDetails.publisher && (
                  <div>
                    <span className="text-muted-foreground">Publisher:</span>
                    <p className="font-medium">{bookDetails.publisher}</p>
                  </div>
                )}
              </div>
              {bookDetails.description && (
                <div>
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <p className="text-sm mt-1">{bookDetails.description}</p>
                </div>
              )}
            </div>

            {transcript && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">System heard:</p>
                <p className="text-base font-semibold text-yellow-900 dark:text-yellow-100">"{transcript}"</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                  {transcript.includes('yes') || transcript.includes('confirm') ? '✓ Confirmed!' :
                   transcript.includes('no') || transcript.includes('cancel') ? '✗ Cancelled' :
                   '⚠️ Not recognized - please try again'}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mic className="h-4 w-4" />
              <p>Say <strong>"yes"</strong> to confirm or <strong>"no"</strong> to cancel</p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 px-6 pb-6">
          <Button
            variant="outline"
            onClick={isListening ? stopListening : startListening}
            disabled={status === 'confirmed' || status === 'cancelled'}
            className={cn(isListening && "bg-primary text-primary-foreground")}
          >
            {isListening ? (
              <>
                <div className="relative mr-2">
                  <AudioLines className="h-4 w-4 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </div>
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Voice Input
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={status === 'confirmed' || status === 'cancelled'}
          >
            Cancel
          </Button>

          <Button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            disabled={status === 'confirmed' || status === 'cancelled'}
          >
            Confirm Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
