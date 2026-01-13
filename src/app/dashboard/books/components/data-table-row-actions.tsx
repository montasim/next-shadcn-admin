'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconTrash, IconEdit, IconEye, IconSparkles, IconList, IconDatabase, IconBook, IconVolume } from '@tabler/icons-react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Book } from '../data/schema'
import { useBooksContext } from '../context/books-context'
import { toast } from '@/hooks/use-toast'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const book = row.original as Book
  const router = useRouter()
  const { setOpen, setCurrentRow } = useBooksContext()
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false)
  const [isRegeneratingOverview, setIsRegeneratingOverview] = useState(false)
  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState(false)
  const [isRegeneratingAudiobook, setIsRegeneratingAudiobook] = useState(false)
  const [isRegeneratingEmbeddings, setIsRegeneratingEmbeddings] = useState(false)

  const handleRegenerateSummary = async () => {
    setIsRegeneratingSummary(true)
    try {
      const response = await fetch(`/api/books/${book.id}/regenerate-summary`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate summary')
      }

      toast({
        title: 'Summary regeneration started',
        description: 'The AI summary will be regenerated shortly via PDF processor.',
      })
    } catch (error: any) {
      console.error('Error regenerating summary:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate summary. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRegeneratingSummary(false)
    }
  }

  const handleRegenerateOverview = async () => {
    setIsRegeneratingOverview(true)
    try {
      const response = await fetch(`/api/books/${book.id}/regenerate-overview`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate overview')
      }

      toast({
        title: 'Overview regeneration started',
        description: 'The AI overview will be regenerated shortly via PDF processor.',
      })
    } catch (error: any) {
      console.error('Error regenerating overview:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate overview. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRegeneratingOverview(false)
    }
  }

  const handleRegenerateQuestions = async () => {
    setIsRegeneratingQuestions(true)
    try {
      const response = await fetch(`/api/books/${book.id}/regenerate-questions`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate questions')
      }

      toast({
        title: 'Questions regeneration started',
        description: 'The suggested questions will be regenerated shortly via PDF processor.',
      })
    } catch (error: any) {
      console.error('Error regenerating questions:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate questions. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRegeneratingQuestions(false)
    }
  }

  const handleRegenerateAudiobook = async () => {
    setIsRegeneratingAudiobook(true)
    try {
      const response = await fetch(`/api/books/${book.id}/regenerate-audiobook`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate audiobook')
      }

      toast({
        title: 'Audiobook regeneration started',
        description: 'The audiobook will be regenerated shortly via PDF processor.',
      })
    } catch (error: any) {
      console.error('Error regenerating audiobook:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate audiobook. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRegeneratingAudiobook(false)
    }
  }

  const handleRegenerateEmbeddings = async () => {
    setIsRegeneratingEmbeddings(true)
    try {
      const response = await fetch(`/api/books/${book.id}/regenerate-embeddings`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate embeddings')
      }

      toast({
        title: 'Embeddings regeneration started',
        description: 'The embeddings will be regenerated shortly via PDF processor.',
      })
    } catch (error: any) {
      console.error('Error regenerating embeddings:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate embeddings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRegeneratingEmbeddings(false)
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[200px]'>
        <DropdownMenuItem
          onClick={() => {
            router.push(`/dashboard/books/${book.id}`)
          }}
        >
          View
          <DropdownMenuShortcut>
            <IconEye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(book)
            setOpen('edit')
          }}
        >
          Edit
          <DropdownMenuShortcut>
            <IconEdit size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Make a copy</DropdownMenuItem>
        {book.type !== 'HARD_COPY' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleRegenerateSummary}
              disabled={isRegeneratingSummary}
            >
              {isRegeneratingSummary ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  Regenerate Summary
                  <DropdownMenuShortcut>
                    <IconSparkles size={16} />
                  </DropdownMenuShortcut>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleRegenerateOverview}
              disabled={isRegeneratingOverview}
            >
              {isRegeneratingOverview ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  Regenerate Overview
                  <DropdownMenuShortcut>
                    <IconBook size={16} />
                  </DropdownMenuShortcut>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleRegenerateQuestions}
              disabled={isRegeneratingQuestions}
            >
              {isRegeneratingQuestions ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  Regenerate Questions
                  <DropdownMenuShortcut>
                    <IconList size={16} />
                  </DropdownMenuShortcut>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleRegenerateAudiobook}
              disabled={isRegeneratingAudiobook}
            >
              {isRegeneratingAudiobook ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  Regenerate Audiobook
                  <DropdownMenuShortcut>
                    <IconVolume size={16} />
                  </DropdownMenuShortcut>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleRegenerateEmbeddings}
              disabled={isRegeneratingEmbeddings}
            >
              {isRegeneratingEmbeddings ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Regenerating...
                </>
              ) : (
                <>
                  Regenerate Embeddings
                  <DropdownMenuShortcut>
                    <IconDatabase size={16} />
                  </DropdownMenuShortcut>
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(book)
            setOpen('delete')
          }}
        >
          Delete
          <DropdownMenuShortcut>
            <IconTrash size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}