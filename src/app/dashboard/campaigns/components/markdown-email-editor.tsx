'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { markdownToHtml } from '@/lib/auth/email'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownEmailEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MarkdownEmailEditor({
  value,
  onChange,
  placeholder = 'Write your email content in Markdown...',
  className = '',
}: MarkdownEmailEditorProps) {
  const [htmlPreview, setHtmlPreview] = useState('')

  useEffect(() => {
    setHtmlPreview(markdownToHtml(value))
  }, [value])

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Markdown Editor */}
      <div className="space-y-2">
        <Label htmlFor="markdown-editor">Markdown Content</Label>
        <Textarea
          id="markdown-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[400px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use Markdown syntax. Available variables: {'{' + '{'}userName{'}' + '}'}, {'{' + '{'}firstName{'}' + '}'}, {'{' + '{'}email{'}' + '}'}, {'{' + '{'}unsubscribeUrl{'}' + '}'}
        </p>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label>Preview</Label>
        <Card className="h-[400px]">
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-full p-4">
              <Tabs defaultValue="html" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="html">HTML Preview</TabsTrigger>
                  <TabsTrigger value="raw">Raw HTML</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="mt-0">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlPreview }}
                  />
                </TabsContent>
                <TabsContent value="raw" className="mt-0">
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                    <code>{htmlPreview}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper component for showing available variables
export function TemplateVariablesHint() {
  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Available Variables</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <ul className="space-y-1">
          <li><code className="bg-background px-1 py-0.5 rounded text-xs">{'{' + '{'}userName{'}' + '}'}</code> - Full name of the user</li>
          <li><code className="bg-background px-1 py-0.5 rounded text-xs">{'{' + '{'}firstName{'}' + '}'}</code> - First name of the user</li>
          <li><code className="bg-background px-1 py-0.5 rounded text-xs">{'{' + '{'}email{'}' + '}'}</code> - Email address of the user</li>
          <li><code className="bg-background px-1 py-0.5 rounded text-xs">{'{' + '{'}unsubscribeUrl{'}' + '}'}</code> - Unsubscribe link (auto-added to footer)</li>
        </ul>
      </CardContent>
    </Card>
  )
}
