'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Image as ImageIcon, Trash2 } from 'lucide-react'

interface ImageUploadProps {
  disabled?: boolean
  onChange: (value: File | null) => void
  onRemove: () => void
  value?: File | string | null
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
}) => {
  const [isMounted, setIsMounted] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value)
      setPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else if (typeof value === 'string') {
      setPreview(value)
    } else {
      setPreview(null)
    }
  }, [value])

  if (!isMounted) {
    return null
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    onChange(file)
  }

  return (
    <div>
      {preview ? (
        <div className='relative h-32 w-32'>
          <img src={preview} alt='Image preview' className='h-full w-full rounded-md object-cover' />
          <div className='absolute top-0 right-0'>
            <Button type='button' onClick={onRemove} variant='destructive' size='icon' disabled={disabled}>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex items-center justify-center h-32 w-32 border-2 border-dashed rounded-md overflow-hidden'>
          <label className='flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-accent transition-colors'>
            <ImageIcon className='h-8 w-8 text-gray-400' />
            <span className='text-sm text-gray-500'>Upload Image</span>
            <Input
              type='file'
              className='hidden'
              onChange={handleFileChange}
              accept='image/*'
              disabled={disabled}
            />
          </label>
        </div>
      )}
    </div>
  )
}
