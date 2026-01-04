"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateDisplay } from './actions'
import { type DisplayFormValues, displayFormSchema, items } from './schema'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface DisplayFormClientProps {
  defaultValues: Partial<DisplayFormValues>
}

export function DisplayFormClient({ defaultValues }: DisplayFormClientProps) {
  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues,
  })

  // Watch form values to detect changes
  const currentItems = form.watch('items')

  // Check if items have changed from default values
  const defaultItems = defaultValues.items || ["recents", "home", "applications", "desktop", "downloads", "documents"]
  const itemsChanged = JSON.stringify(currentItems?.sort()) !== JSON.stringify(defaultItems.sort())

  const hasChanges = itemsChanged
  const isFormValid = form.formState.isValid
  const hasValidationErrors = Object.keys(form.formState.errors).length > 0
  const isSubmitting = form.formState.isSubmitting

  const shouldDisableSubmit = !hasChanges || !isFormValid || hasValidationErrors || isSubmitting

  async function onSubmit(data: DisplayFormValues) {
    const result = await updateDisplay(data)

    if (result.status === 'error') {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Success',
      description: result.message,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='items'
          render={() => (
            <FormItem>
              <div className='mb-4'>
                <FormLabel className='text-base'>Sidebar</FormLabel>
                <FormDescription>
                  Select the items you want to display in the sidebar.
                </FormDescription>
              </div>
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name='items'
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className='flex flex-row items-start space-x-3 space-y-0'
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={shouldDisableSubmit}>
          {isSubmitting ? 'Updating...' : hasChanges ? 'Update display' : 'No changes made'}
        </Button>
      </form>
    </Form>
  )
}
