'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Download, Settings, Bookmark } from 'lucide-react'

export default function UserReaderPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

  // In a real app, you would fetch the book data
  const book = {
    id: bookId,
    title: 'The Great Adventure',
    author: 'John Doe',
    type: 'EBOOK',
    fileUrl: '/books-old/sample.pdf'
  }

  const handleExitReader = () => {
    router.push('/user-library')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Reader Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExitReader}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>

              <div className="flex items-center gap-2">
                <h1 className="font-semibold">{book.title}</h1>
                <Badge variant="secondary" className="text-xs">
                  {book.type}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Reader Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">PDF Reader Coming Soon</h2>
              <p className="text-muted-foreground mb-4">
                The full PDF reading experience is being developed. For now, you can download the book to read offline.
              </p>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}