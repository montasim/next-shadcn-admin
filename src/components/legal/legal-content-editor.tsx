'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { Loader2, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { LegalContentType } from '@prisma/client'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LegalContent {
  id: string
  type: LegalContentType
  title: string
  content: string
  effectiveDate: string
  lastUpdatedBy: {
    id: string
    firstName: string
    lastName: string | null
    email: string
  } | null
  createdAt: string
  updatedAt: string
}

interface LegalContentEditorProps {
  type: LegalContentType
  title: string
  description: string
  placeholderTitle: string
  placeholderContent: string
}

export function LegalContentEditor({
  type,
  title,
  description,
  placeholderTitle,
  placeholderContent,
}: LegalContentEditorProps) {
  const [content, setContent] = useState<LegalContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [type])

  const fetchContent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/legal?type=${type}`)
      const result = await response.json()

      if (result.success && result.data) {
        setContent(result.data)
        setFormTitle(result.data.title)
        setFormContent(result.data.content)
      }
    } catch (error) {
      console.error('Error fetching legal content:', error)
      toast({
        title: 'Error',
        description: 'Failed to load legal content',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and content are required',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/legal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          title: formTitle,
          content: formContent,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setContent(result.data)
        toast({
          title: 'Success',
          description: result.message || 'Legal content saved successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save legal content',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving legal content:', error)
      toast({
        title: 'Error',
        description: 'Failed to save legal content',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="min-w-[120px]"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Last Updated Info */}
      {content && (
        <Alert>
          <AlertDescription className="text-sm">
            Last updated by{' '}
            <strong>
              {content.lastUpdatedBy?.firstName}{' '}
              {content.lastUpdatedBy?.lastName || ''}
            </strong>{' '}
            on {new Date(content.updatedAt).toLocaleDateString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Editor and Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Content</CardTitle>
            <CardDescription>
              Use Markdown syntax to format your content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={placeholderTitle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={placeholderContent}
                rows={20}
                className="font-mono text-sm"
              />
            </div>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Markdown basics:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li># Heading 1, ## Heading 2, ### Heading 3</li>
                <li>**bold**, *italic*, `code`</li>
                <li>- bullet list, 1. numbered list</li>
                <li>[link text](url), ![alt text](image-url)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                This is how users will see the content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <h1>{formTitle || placeholderTitle}</h1>
                <MDXViewer content={formContent} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
