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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'
import { User, UserRole, UserStatus } from '../data/schema'
import { createUser, updateUser } from '../actions'
import {
  checkEmailAvailability,
  checkUsernameAvailability,
  checkPhoneNumberAvailability
} from '../actions'
import { userTypes } from '../data/data'
import { cn } from '@/lib/utils'
import { IconLoader2, IconCheck, IconX } from '@tabler/icons-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: User
  onSuccess?: () => void
}

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().optional(),
  username: z.string().min(1, 'Username is required.'),
  email: z.string().email('Invalid email address.'),
  phoneNumber: z.string().optional(),
  status: z.enum(['active', 'inactive', 'invited', 'suspended'] as const),
  role: z.enum(['superadmin', 'admin', 'cashier', 'manager'] as const),
})
type UsersForm = z.infer<typeof formSchema>

export function UsersMutateDrawer({ open, onOpenChange, currentRow, onSuccess }: Props) {
  const isUpdate = !!currentRow

  const [checkingFields, setCheckingFields] = useState<Set<string>>(new Set())
  const [fieldAvailability, setFieldAvailability] = useState<{
    email?: boolean
    username?: boolean
    phoneNumber?: boolean
  }>({})

  const form = useForm<UsersForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isUpdate && currentRow ? {
      firstName: currentRow.firstName || '',
      lastName: currentRow.lastName || '',
      username: currentRow.username || '',
      email: currentRow.email || '',
      phoneNumber: currentRow.phoneNumber || '',
      status: currentRow.status || 'active',
      role: currentRow.role || 'cashier',
    } : {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phoneNumber: '',
      status: 'active',
      role: 'cashier',
    },
    mode: 'onChange',
  })

  // Watch fields for real-time validation
  const emailValue = form.watch('email')
  const usernameValue = form.watch('username')
  const phoneNumberValue = form.watch('phoneNumber')

  // Check email availability
  useEffect(() => {
    const checkEmail = async () => {
      if (!emailValue) return

      // For updates, only check if email has changed
      if (isUpdate && emailValue === currentRow?.email) {
        setFieldAvailability(prev => ({ ...prev, email: true }))
        return
      }

      // Only check if field is dirty for new users
      if (!isUpdate && !form.formState.dirtyFields.email) return

      const isEmailValid = await form.trigger('email')
      if (!isEmailValid) return

      setCheckingFields(prev => new Set(prev).add('email'))
      setFieldAvailability(prev => ({ ...prev, email: undefined }))

      try {
        const result = await checkEmailAvailability(emailValue, currentRow?.id)
        if (result.isAvailable) {
          setFieldAvailability(prev => ({ ...prev, email: true }))
          form.clearErrors('email')
        } else {
          setFieldAvailability(prev => ({ ...prev, email: false }))
          form.setError('email', {
            type: 'manual',
            message: result.error || 'Email is not available',
          })
        }
      } catch (error) {
        console.error('Email check failed:', error)
      } finally {
        setCheckingFields(prev => {
          const next = new Set(prev)
          next.delete('email')
          return next
        })
      }
    }

    const timeoutId = setTimeout(() => {
      if (emailValue) checkEmail()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [emailValue, form, currentRow?.id, isUpdate, currentRow?.email])

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!usernameValue) return

      // For updates, only check if username has changed
      const currentUsername = currentRow?.username
      if (isUpdate && usernameValue === currentUsername) {
        setFieldAvailability(prev => ({ ...prev, username: true }))
        return
      }

      // Only check if field is dirty for new users
      if (!isUpdate && !form.formState.dirtyFields.username) return

      setCheckingFields(prev => new Set(prev).add('username'))
      setFieldAvailability(prev => ({ ...prev, username: undefined }))

      try {
        const result = await checkUsernameAvailability(usernameValue, currentRow?.id)
        if (result.isAvailable) {
          setFieldAvailability(prev => ({ ...prev, username: true }))
          form.clearErrors('username')
        } else {
          setFieldAvailability(prev => ({ ...prev, username: false }))
          form.setError('username', {
            type: 'manual',
            message: result.error || 'Username is not available',
          })
        }
      } catch (error) {
        console.error('Username check failed:', error)
      } finally {
        setCheckingFields(prev => {
          const next = new Set(prev)
          next.delete('username')
          return next
        })
      }
    }

    const timeoutId = setTimeout(() => {
      if (usernameValue) checkUsername()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [usernameValue, form, currentRow?.id, isUpdate, currentRow?.email])

  // Check phone number availability
  useEffect(() => {
    const checkPhone = async () => {
      if (!phoneNumberValue) {
        // Clear phone number availability when empty
        setFieldAvailability(prev => ({ ...prev, phoneNumber: undefined }))
        return
      }

      // For updates, only check if phone number has changed
      if (isUpdate && phoneNumberValue === currentRow?.phoneNumber) {
        setFieldAvailability(prev => ({ ...prev, phoneNumber: true }))
        return
      }

      // Only check if field is dirty for new users
      if (!isUpdate && !form.formState.dirtyFields.phoneNumber) return

      setCheckingFields(prev => new Set(prev).add('phoneNumber'))
      setFieldAvailability(prev => ({ ...prev, phoneNumber: undefined }))

      try {
        const result = await checkPhoneNumberAvailability(phoneNumberValue, currentRow?.id)
        if (result.isAvailable) {
          setFieldAvailability(prev => ({ ...prev, phoneNumber: true }))
          form.clearErrors('phoneNumber')
        } else {
          setFieldAvailability(prev => ({ ...prev, phoneNumber: false }))
          form.setError('phoneNumber', {
            type: 'manual',
            message: result.error || 'Phone number is not available',
          })
        }
      } catch (error) {
        console.error('Phone number check failed:', error)
      } finally {
        setCheckingFields(prev => {
          const next = new Set(prev)
          next.delete('phoneNumber')
          return next
        })
      }
    }

    const timeoutId = setTimeout(() => {
      if (phoneNumberValue) checkPhone()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [phoneNumberValue, form, currentRow?.id, isUpdate, currentRow?.phoneNumber])

  // Initialize validation state for updates
  useEffect(() => {
    if (isUpdate && open && currentRow) {
      // Pre-validate existing data
      setFieldAvailability({
        email: true,
        username: true,
        phoneNumber: currentRow.phoneNumber ? true : undefined
      })
    }
  }, [isUpdate, open, currentRow])

  // Check if form should be disabled
  const isFormDisabled = () => {
    // If any field is being checked, disable
    if (checkingFields.size > 0) return true

    // For updates, only validate changed fields
    if (isUpdate) {
      // If email changed and failed validation, disable
      if (emailValue !== currentRow?.email && fieldAvailability.email === false) return true

      // If username changed and failed validation, disable
      if (usernameValue !== currentRow?.username && fieldAvailability.username === false) return true

      // If phone number changed and failed validation, disable
      if (phoneNumberValue !== currentRow?.phoneNumber && phoneNumberValue && fieldAvailability.phoneNumber === false) return true
    }

    // For new users, validate all fields
    if (!isUpdate) {
      // If email has failed validation, disable
      if (fieldAvailability.email === false) return true

      // If username has failed validation, disable
      if (fieldAvailability.username === false) return true

      // If phone number is provided and has failed validation, disable
      if (phoneNumberValue && fieldAvailability.phoneNumber === false) return true
    }

    return false
  }

  const onSubmit = async (data: UsersForm) => {
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })

      if (isUpdate && currentRow) {
        await updateUser(currentRow.id, formData)
        toast({
          title: 'User updated successfully',
          description: (
            <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
              <code className='text-white'>{JSON.stringify(data, null, 2)}</code>
            </pre>
          ),
        })
        onSuccess?.()
      } else {
        await createUser(formData)
        toast({
          title: 'User created successfully',
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
        description: `Failed to ${isUpdate ? 'update' : 'create'} user`,
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
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} User</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the user by providing necessary info.'
              : 'Add a new user by providing necessary info.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='users-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-5 flex-1'
          >
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter first name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='lastName'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter last name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Username <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder='Enter username'
                        className={cn(
                          fieldAvailability.username === false && "border-red-500 focus-visible:ring-red-500",
                          fieldAvailability.username === true && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingFields.has('username') && <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {!checkingFields.has('username') && fieldAvailability.username === true && <IconCheck className="h-4 w-4 text-green-500" />}
                        {!checkingFields.has('username') && fieldAvailability.username === false && <IconX className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type='email'
                        placeholder='Enter email'
                        className={cn(
                          fieldAvailability.email === false && "border-red-500 focus-visible:ring-red-500",
                          fieldAvailability.email === true && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingFields.has('email') && <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {!checkingFields.has('email') && fieldAvailability.email === true && <IconCheck className="h-4 w-4 text-green-500" />}
                        {!checkingFields.has('email') && fieldAvailability.email === false && <IconX className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder='Enter phone number'
                        className={cn(
                          fieldAvailability.phoneNumber === false && "border-red-500 focus-visible:ring-red-500",
                          fieldAvailability.phoneNumber === true && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingFields.has('phoneNumber') && <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {!checkingFields.has('phoneNumber') && fieldAvailability.phoneNumber === true && <IconCheck className="h-4 w-4 text-green-500" />}
                        {!checkingFields.has('phoneNumber') && fieldAvailability.phoneNumber === false && <IconX className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select status'
                    items={[
                      { label: 'Active', value: 'active' },
                      { label: 'Inactive', value: 'inactive' },
                      { label: 'Invited', value: 'invited' },
                      { label: 'Suspended', value: 'suspended' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Role <span className="text-destructive">*</span></FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select role'
                    items={userTypes.map(({ label, value }) => ({
                      label,
                      value,
                    }))}
                  />
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
            form='users-form'
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
