'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconTrash, IconEdit, IconEye, IconSparkles, IconList } from '@tabler/icons-react'
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
  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState(false)

  const handleRegenerateSummary = async () => {
    if (!book.extractedContent) {
      toast({
        title: 'Cannot regenerate summary',
        description: 'Book content must be extracted first.',
        variant: 'destructive',
      })
      return
    }

    setIsRegeneratingSummary(true)
    try {
      const response = await fetch(`/api/books/${book.id}/regenerate-summary`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate summary')
      }

      toast({
        title: 'Summary regeneration started',
        description: 'The AI summary will be regenerated shortly.',
      })
    } catch (error) {
      console.error('Error regenerating summary:', error)
      toast({
        title: 'Error',
        description: 'Failed to regenerate summary. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRegeneratingSummary(false)
    }
  }

  const handleRegenerateQuestions = async () => {
    if (!book.extractedContent) {
      toast({
        title: 'Cannot regenerate questions',
        description: 'Book content must be extracted first.',
        variant: 'destructive',
      })
      return
    }

    setIsRegeneratingQuestions(true)
    try {
      const response = await fetch(`/api/books/${book.id}/regenerate-questions`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate questions')
      }

      toast({
        title: 'Questions regeneration started',
        description: 'The suggested questions will be regenerated shortly.',
      })
    } catch (error) {
      console.error('Error regenerating questions:', error)
      toast({
        title: 'Error',
        description: 'Failed to regenerate questions. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRegeneratingQuestions(false)
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleRegenerateSummary}
          disabled={isRegeneratingSummary || !book.extractedContent}
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
          onClick={handleRegenerateQuestions}
          disabled={isRegeneratingQuestions || !book.extractedContent}
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