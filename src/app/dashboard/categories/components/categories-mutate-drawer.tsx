'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MDXEditor } from '@/components/ui/mdx-editor'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Category } from '../data/schema'
import { createCategory, updateCategory } from '../actions'
import {
  checkCategoryNameAvailability,
} from '../actions'
import { cn } from '@/lib/utils'
import { IconLoader2, IconCheck, IconX } from '@tabler/icons-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Category
  onSuccess?: () => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Category name is required.'),
  description: z.string().optional(),
  image: z.string().optional(),
})

type CategoryForm = z.infer<typeof formSchema>

export function CategoriesMutateDrawer({ open, onOpenChange, currentRow, onSuccess }: Props) {
  const isUpdate = !!currentRow

  const [checkingFields, setCheckingFields] = useState<Set<string>>(new Set())
  const [fieldAvailability, setFieldAvailability] = useState<{
    name?: boolean
  }>({})

  const form = useForm<CategoryForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isUpdate && currentRow ? {
      name: currentRow.name || '',
      description: currentRow.description || '',
      image: currentRow.image || '',
    } : {
      name: '',
      description: '',
      image: '',
    },
    mode: 'onChange',
  })

  // Watch fields for real-time validation
  const nameValue = form.watch('name')

  // Check name availability
  useEffect(() => {
    const checkName = async () => {
      if (!nameValue) return

      // For updates, only check if name has changed
      if (isUpdate && nameValue === currentRow?.name) {
        setFieldAvailability(prev => ({ ...prev, name: true }))
        return
      }

      // Only check if field is dirty for new users
      if (!isUpdate && !form.formState.dirtyFields.name) return

      const isNameValid = await form.trigger('name')
      if (!isNameValid) return

      setCheckingFields(prev => new Set(prev).add('name'))
      setFieldAvailability(prev => ({ ...prev, name: undefined }))

      try {
        const result = await checkCategoryNameAvailability(nameValue, currentRow?.id)
        if (result.isAvailable) {
          setFieldAvailability(prev => ({ ...prev, name: true }))
          form.clearErrors('name')
        } else {
          setFieldAvailability(prev => ({ ...prev, name: false }))
          form.setError('name', {
            type: 'manual',
            message: result.error || 'Category name is not available',
          })
        }
      } catch (error) {
        console.error('Category name check failed:', error)
      } finally {
        setCheckingFields(prev => {
          const next = new Set(prev)
          next.delete('name')
          return next
        })
      }
    }

    const timeoutId = setTimeout(() => {
      if (nameValue) checkName()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [nameValue, form, currentRow?.id, isUpdate, currentRow?.name])

  // Initialize validation state for updates
  useEffect(() => {
    if (isUpdate && open && currentRow) {
      // Pre-validate existing data
      setFieldAvailability({
        name: true,
      })
    }
  }, [isUpdate, open, currentRow])

  // Check if form should be disabled
  const isFormDisabled = () => {
    // If any field is being checked, disable
    if (checkingFields.size > 0) return true

    // For updates, only validate changed fields
    if (isUpdate) {
      // If name changed and failed validation, disable
      if (nameValue !== currentRow?.name && fieldAvailability.name === false) return true
    }

    // For new categories, validate all fields
    if (!isUpdate) {
      // If name has failed validation, disable
      if (fieldAvailability.name === false) return true
    }

    return false
  }

  const onSubmit = async (data: CategoryForm) => {
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })

      if (isUpdate && currentRow) {
        await updateCategory(currentRow.id, formData)
        toast({
          title: 'Category updated successfully',
          description: (
            <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
              <code className='text-white'>{JSON.stringify(data, null, 2)}</code>
            </pre>
          ),
        })
        onSuccess?.()
      } else {
        await createCategory(formData)
        toast({
          title: 'Category created successfully',
          description: (
            <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
              <code className='text-white'>{JSON.stringify(data, null, 2)}</code>
            </pre>
          ),
        })
        onSuccess?.()
      }

      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isUpdate ? 'update' : 'create'} category`,
        variant: 'destructive',
      })
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-left'>
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Category</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the category by providing necessary info.'
              : 'Add a new category by providing necessary info.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='categories-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-5 flex-1'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Category Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder='Enter category name'
                        className={cn(
                          fieldAvailability.name === false && "border-red-500 focus-visible:ring-red-500",
                          fieldAvailability.name === true && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingFields.has('name') && <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {!checkingFields.has('name') && fieldAvailability.name === true && <IconCheck className="h-4 w-4 text-green-500" />}
                        {!checkingFields.has('name') && fieldAvailability.name === false && <IconX className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <MDXEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder='Enter category description in markdown format...'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='image'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Enter image URL'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button
            form='categories-form'
            type='submit'
            disabled={isFormDisabled() || !form.formState.isValid}
          >
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}