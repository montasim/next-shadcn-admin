'use client'

import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Mood } from '../data/schema'
import { createMood, updateMood, getCategories } from '../actions'
import { MoodForm } from './mood-form'
import type { MoodFormValues } from './mood-form'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Mood | null
  onSuccess?: () => void
}

export function MoodsMutateDrawer({ open, onOpenChange, currentRow, onSuccess }: Props) {
  const isUpdate = !!currentRow
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([])

  // Load categories when drawer opens
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories()
        setCategories(cats.map((c: any) => ({ value: c.id, label: c.name })))
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    if (open) {
      loadCategories()
    }
  }, [open])

  const getInitialData = () => {
    if (isUpdate && currentRow) {
      return {
        identifier: currentRow.identifier,
        name: currentRow.name,
        emoji: currentRow.emoji,
        description: currentRow.description,
        color: currentRow.color,
        isActive: currentRow.isActive,
        order: currentRow.order,
        categoryIds: currentRow.categoryIds || [],
      }
    }
    return {}
  }

  const onSubmit = async (data: MoodFormValues) => {
    setLoading(true)
    try {
      if (isUpdate && currentRow) {
        await updateMood(currentRow.id, data)
        toast({
          title: 'Mood updated successfully',
        })
      } else {
        await createMood(data)
        toast({
          title: 'Mood created successfully',
        })
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isUpdate ? 'update' : 'create'} mood`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Mood</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the mood and its category mappings.'
              : 'Add a new mood for book recommendations.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <MoodForm
            initialData={getInitialData()}
            onSubmit={onSubmit}
            isEdit={isUpdate}
            onCancel={handleCancel}
            loading={loading}
            categories={categories}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
