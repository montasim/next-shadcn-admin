'use client'

import { useState } from 'react'
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
import { Notice } from '../data/schema'
import { createNotice, updateNotice } from '../actions'
import { NoticeForm, type NoticeFormValues } from './notice-form'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Notice | null
  onSuccess?: () => void
}

export function NoticesMutateDrawer({ open, onOpenChange, currentRow, onSuccess }: Props) {
  const isUpdate = !!currentRow
  const [loading, setLoading] = useState(false)

  const getInitialData = () => {
    if (isUpdate && currentRow) {
      return {
        title: currentRow.title,
        content: currentRow.content,
        isActive: currentRow.isActive,
        validFrom: currentRow.validFrom,
        validTo: currentRow.validTo,
        order: currentRow.order,
      }
    }
    return {}
  }

  const onSubmit = async (data: NoticeFormValues) => {
    setLoading(true)
    try {
      if (isUpdate && currentRow) {
        await updateNotice(currentRow.id, data)
        toast({
          title: 'Notice updated successfully',
        })
      } else {
        await createNotice(data)
        toast({
          title: 'Notice created successfully',
        })
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isUpdate ? 'update' : 'create'} notice`,
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
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Notice</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the notice details.'
              : 'Add a new notice to display to users.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <NoticeForm
            initialData={getInitialData()}
            onSubmit={onSubmit}
            isEdit={isUpdate}
            onCancel={handleCancel}
            loading={loading}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
