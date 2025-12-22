'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Book, Headphones, Upload } from 'lucide-react'
import { MyBooksMutateDrawer } from './my-books-mutate-drawer'
import { useRouter } from 'next/navigation'

interface BookListProps {
  initialBooks: any[]
}

export function BookList({ initialBooks }: BookListProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
          <p className="text-muted-foreground">
            Manage your uploaded books and audiobooks.
          </p>
        </div>
        <Button onClick={() => setIsDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Book
        </Button>
      </div>

      <MyBooksMutateDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        onSuccess={handleSuccess}
      />

      {initialBooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No books uploaded yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first ebook or audiobook to get started.
            </p>
            <Button onClick={() => setIsDrawerOpen(true)}>
              Upload Book
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialBooks.map((book) => (
            <Card key={book.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base line-clamp-1">{book.name}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {book.authors.map((a: any) => a.author.name).join(', ')}
                  </CardDescription>
                </div>
                {book.type === 'AUDIO' ? (
                  <Headphones className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Book className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                  <div className="flex items-center">
                    {book.isPublic ? (
                      <span className="text-green-600 flex items-center text-xs bg-green-50 px-2 py-1 rounded-full">
                        Public
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center text-xs bg-yellow-50 px-2 py-1 rounded-full">
                        Private
                      </span>
                    )}
                  </div>
                  <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
