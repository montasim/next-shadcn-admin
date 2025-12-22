'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { File as FileIcon, Trash2, UploadCloud } from 'lucide-react'

interface FileUploadProps {
  disabled?: boolean
  onChange: (value: File | null) => void
  onRemove: () => void
  value?: File | string | null
  accept?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
  accept,
}) => {
  const [isMounted, setIsMounted] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value)
      setPreviewUrl(objectUrl)
      setFileType(value.type)
      return () => URL.revokeObjectURL(objectUrl)
    } else if (typeof value === 'string' && value) {
      setPreviewUrl(value)
      // Infer file type from URL extension
      const extension = value.split('.').pop()?.toLowerCase()
      if (extension === 'pdf') {
        setFileType('application/pdf')
      } else if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
        setFileType('audio/mpeg') // Generic audio type
      } else {
        setFileType(null)
      }
    } else {
      setPreviewUrl(null)
      setFileType(null)
    }
  }, [value])

  if (!isMounted) {
    return null
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    onChange(file)
  }

  const renderPreview = () => {
    if (!previewUrl) return null

    if (fileType?.startsWith('audio/')) {
      return (
        <div className='relative p-4 border rounded-md'>
          <audio controls className='w-full'>
            <source src={previewUrl} type={fileType} />
            Your browser does not support the audio element.
          </audio>
          <div className='absolute top-2 right-2'>
            <Button type='button' onClick={onRemove} variant='destructive' size='icon' disabled={disabled}>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )
    }

    if (fileType === 'application/pdf') {
      return (
        <div className='relative border rounded-md'>
          <iframe src={previewUrl} title="PDF Preview" width="100%" height="500px" style={{ border: 'none' }}>
            <p>Your browser does not support PDFs. Please download the PDF to view it: <a href={previewUrl}>Download PDF</a>.</p>
          </iframe>
          <div className='absolute top-2 right-2'>
            <Button type='button' onClick={onRemove} variant='destructive' size='icon' disabled={disabled}>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )
    }

    // Fallback for other file types or if type is unknown
    const fileName = typeof value === 'string' ? value.split('/').pop() : (value as File)?.name
    return (
      <div className='flex items-center justify-between p-3 border rounded-md'>
        <div className='flex items-center gap-2'>
          <FileIcon className='h-6 w-6 text-gray-500' />
          <span className='text-sm font-medium truncate'>{fileName}</span>
        </div>
        <Button type='button' onClick={onRemove} variant='destructive' size='icon' disabled={disabled}>
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    )
  }

  return (
    <div>
      {previewUrl ? (
        renderPreview()
      ) : (
        <div className='flex items-center justify-center w-full'>
          <label className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent transition-colors'>
            <div className='flex flex-col items-center justify-center pt-5 pb-6'>
              <UploadCloud className='h-8 w-8 text-gray-400' />
              <p className='mb-2 text-sm text-gray-500'>
                <span className='font-semibold'>Click to upload</span> or drag and drop
              </p>
              {accept && (
                <p className='text-xs text-gray-500'>
                  {accept.split(',').map(type => type.toUpperCase()).join(', ')}
                </p>
              )}
            </div>
            <Input
              type='file'
              className='hidden'
              onChange={handleFileChange}
              accept={accept}
              disabled={disabled}
            />
          </label>
        </div>
      )}
    </div>
  )
}
