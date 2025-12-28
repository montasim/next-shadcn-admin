'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Loader2, AudioLines } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
  onListeningChange?: (isListening: boolean) => void
}

export function VoiceInputButton({
  onTranscript,
  onError,
  disabled = false,
  className,
  onListeningChange
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isListeningRef = useRef(false)

  const updateListeningState = useCallback((listening: boolean) => {
    setIsListening(listening)
    isListeningRef.current = listening
    onListeningChange?.(listening)
  }, [onListeningChange])

  const stopRecognition = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log('[Voice] Stopped recognition')
      } catch (error) {
        console.error('[Voice] Error stopping recognition:', error)
      }
    }
    updateListeningState(false)
  }, [updateListeningState])

  const getRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null

    const recognition = new SpeechRecognition()
    recognition.continuous = true  // Keep listening until manually stopped
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('[Voice] Recognition started')
      updateListeningState(true)

      // Set a timeout to stop after 10 seconds of inactivity
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        console.log('[Voice] Timeout reached, stopping recognition')
        stopRecognition()
      }, 10000)  // 10 seconds total max
    }

    recognition.onend = () => {
      console.log('[Voice] Recognition ended')
      updateListeningState(false)
    }

    recognition.onresult = (event: any) => {
      // Get the last result
      const lastResult = event.results[event.results.length - 1]
      const transcript = lastResult[0].transcript
      const confidence = lastResult[0].confidence
      const isFinal = lastResult.isFinal

      console.log('[Voice] Got result:', transcript, 'Confidence:', confidence, 'Is final:', isFinal)

      if (isFinal) {
        console.log('[Voice] Final result received, waiting 5 seconds before stopping...')

        // Reset the timeout to wait 5 more seconds after this result
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          console.log('[Voice] Delay completed, stopping recognition')
          stopRecognition()
          onTranscript(transcript)
        }, 5000)  // Wait 5 seconds after final result
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[Voice] Recognition error:', event.error)

      // Don't show toast for 'aborted' - it's expected when we stop it
      if (event.error !== 'aborted') {
        updateListeningState(false)
        const errorMessage = getErrorMessage(event.error)
        onError?.(errorMessage)
        toast({
          title: 'Voice Input Error',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    }

    return recognition
  }, [onTranscript, onError, onListeningChange, updateListeningState, stopRecognition])

  const startListening = useCallback(() => {
    console.log('[Voice] Starting listening...')

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast({
        title: 'Voice Input Not Supported',
        description: 'Your browser does not support voice input. Please use Chrome, Edge, or Safari.',
        variant: 'destructive'
      })
      return
    }

    try {
      // Create new recognition instance each time
      const recognition = getRecognition()
      if (!recognition) {
        throw new Error('Failed to create recognition instance')
      }

      recognitionRef.current = recognition
      recognition.start()
      console.log('[Voice] Recognition started successfully')
    } catch (error) {
      console.error('[Voice] Error starting recognition:', error)
      updateListeningState(false)
      toast({
        title: 'Error',
        description: 'Failed to start voice input. Please try again.',
        variant: 'destructive'
      })
    }
  }, [getRecognition, updateListeningState])

  const stopListening = useCallback(() => {
    console.log('[Voice] Manual stop requested')
    stopRecognition()
  }, [stopRecognition])

  const handleClick = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[Voice] Cleaning up recognition')
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
          recognitionRef.current = null
        } catch (error) {
          console.log('[Voice] Cleanup: recognition already stopped')
        }
      }
    }
  }, [])

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.'
      case 'audio-capture':
        return 'Microphone not found or not allowed.'
      case 'not-allowed':
        return 'Microphone permission denied. Please allow microphone access.'
      case 'network':
        return 'Network error. Voice recognition requires internet access. Check if any extension or firewall is blocking it.'
      case 'aborted':
        return 'Voice input was cancelled.'
      default:
        return `Failed to process voice input (${error}). Please try again.`
    }
  }

  const isSupported = typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  if (!isSupported) {
    return null
  }

  return (
    <div className="relative">
      {/* Pulse animation when listening */}
      {isListening && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-primary" />
      )}

      <Button
        type="button"
        size="icon"
        variant={isListening ? "default" : "outline"}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative",
          isListening && "animate-pulse",
          className
        )}
        title={isListening ? "Tap to stop recording" : "Start voice input"}
      >
        {isListening ? (
          <div className="relative">
            <AudioLines className="h-4 w-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
