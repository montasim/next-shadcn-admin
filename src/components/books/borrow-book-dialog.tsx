'use client'

import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface BorrowBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId: string
  bookName: string
  onSuccess?: () => void
}

export function BorrowBookDialog({
  open,
  onOpenChange,
  bookId,
  bookName,
  onSuccess
}: BorrowBookDialogProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate default due date (14 days from now)
  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 14)

  const handleBorrow = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/books/${bookId}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes || null
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to borrow book')
      }

      toast({
        title: 'Success',
        description: `You have successfully borrowed "${bookName}". Due date: ${format(defaultDueDate, 'PPP')}.`,
      })

      onSuccess?.()
      onOpenChange(false)
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to borrow book')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to borrow book',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNotes('')
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Borrow Book</DialogTitle>
          <DialogDescription>
            Borrow &quot;{bookName}&quot; from the physical library for 14 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          {/* Due Date Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Due Date</p>
              <p className="text-sm text-muted-foreground">{format(defaultDueDate, 'PPP')}</p>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleBorrow} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Borrowing...
              </>
            ) : (
              'Borrow Book'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
