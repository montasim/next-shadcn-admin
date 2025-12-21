'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BookOpen,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Share2,
  Eye,
  EyeOff,
  Grid3X3,
  List,
  Search
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useBookshelves, useCreateBookshelf, useUpdateBookshelf, useDeleteBookshelf } from '@/hooks/use-bookshelves'
import type { Bookshelf } from '@/hooks/use-bookshelves'

interface BookshelfProps {
  bookshelf: Bookshelf
  viewMode?: 'grid' | 'list'
  onEdit?: (bookshelf: Bookshelf) => void
  onDelete?: (id: string) => void
  onTogglePublic?: (id: string, isPublic: boolean) => void
}

export function BookshelfCard({
  bookshelf,
  viewMode = 'grid',
  onEdit,
  onDelete,
  onTogglePublic
}: BookshelfProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg",
        viewMode === 'list' ? "flex" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/library/shelves/${bookshelf.id}`} className="flex-1">
        <CardContent className={cn(
          "p-4",
          viewMode === 'list' ? "flex items-center gap-4 p-4" : ""
        )}>
          {/* Shelf Preview */}
          <div className={cn(
            "flex-shrink-0",
            viewMode === 'list' ? "w-16 h-20" : "w-full h-32 mb-4"
          )}>
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              {bookshelf.books && bookshelf.books.length > 0 ? (
                <div className="relative w-full h-full">
                  {bookshelf.books.slice(0, viewMode === 'list' ? 1 : 3).map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        "absolute inset-0",
                        viewMode === 'list' ? "" : `transform ${index === 0 ? "" : index === 1 ? "scale-75 opacity-75" : "scale-50 opacity-50"}`
                      )}
                    >
                      {item.book.image ? (
                        <Image
                          src={item.book.image}
                          alt={item.book.name}
                          fill
                          className="object-cover rounded"
                          sizes={viewMode === 'list' ? "64px" : "128px"}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Shelf Info */}
          <div className={cn(
            "flex-1 min-w-0",
            viewMode === 'list' ? "flex-1" : ""
          )}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {bookshelf.name}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {bookshelf.isPublic && (
                  <Badge variant="secondary" className="text-xs">
                    Public
                  </Badge>
                )}
              </div>
            </div>

            {bookshelf.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {bookshelf.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {bookshelf._count?.books || bookshelf.books?.length || 0} books
              </p>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit?.(bookshelf) }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); onTogglePublic?.(bookshelf.id, !bookshelf.isPublic) }}>
                    {bookshelf.isPublic ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Make Public
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => { e.preventDefault(); onDelete?.(bookshelf.id) }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

interface BookshelfGridProps {
  bookshelves: Bookshelf[]
  viewMode?: 'grid' | 'list'
  onEdit?: (bookshelf: Bookshelf) => void
  onDelete?: (id: string) => void
  onTogglePublic?: (id: string, isPublic: boolean) => void
}

export function BookshelfGrid({
  bookshelves,
  viewMode = 'grid',
  onEdit,
  onDelete,
  onTogglePublic
}: BookshelfGridProps) {
  return (
    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
      {bookshelves.map((bookshelf) => (
        <BookshelfCard
          key={bookshelf.id}
          bookshelf={bookshelf}
          viewMode={viewMode}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePublic={onTogglePublic}
        />
      ))}
    </div>
  )
}

interface CreateBookshelfDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateBookshelfDialog({ open, onOpenChange, onSuccess }: CreateBookshelfDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const createMutation = useCreateBookshelf()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      })

      // Reset form
      setName('')
      setDescription('')
      setIsPublic(false)

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create bookshelf:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Bookshelf</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium mb-2 block">
              Shelf Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Reading, Favorite Classics"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium mb-2 block">
              Description (optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this bookshelf is about..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isPublic" className="text-sm font-medium">
              Make this bookshelf public
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isLoading || !name.trim()}>
              {createMutation.isLoading ? 'Creating...' : 'Create Bookshelf'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditBookshelfDialogProps {
  bookshelf: Bookshelf | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditBookshelfDialog({ bookshelf, open, onOpenChange, onSuccess }: EditBookshelfDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const updateMutation = useUpdateBookshelf(bookshelf?.id || '')

  // Initialize form with bookshelf data
  React.useEffect(() => {
    if (bookshelf) {
      setName(bookshelf.name)
      setDescription(bookshelf.description || '')
      setIsPublic(bookshelf.isPublic)
    }
  }, [bookshelf])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookshelf || !name.trim()) return

    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to update bookshelf:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Bookshelf</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="text-sm font-medium mb-2 block">
              Shelf Name
            </label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Reading, Favorite Classics"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="text-sm font-medium mb-2 block">
              Description (optional)
            </label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this bookshelf is about..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="edit-isPublic" className="text-sm font-medium">
              Make this bookshelf public
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isLoading || !name.trim()}>
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}