'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Grid3X3,
  List,
  FolderOpen,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal
} from 'lucide-react'

export default function UserShelvesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Mock shelves data - in a real app, this would come from your API
  const shelves = [
    {
      id: '1',
      name: 'Summer Reading',
      description: 'Perfect books-old for lazy summer days',
      bookCount: 12,
      isPublic: false,
      books: []
    },
    {
      id: '2',
      name: 'Classic Literature',
      description: 'Timeless masterpieces everyone should read',
      bookCount: 25,
      isPublic: true,
      books: []
    },
    {
      id: '3',
      name: 'Science Fiction',
      description: 'Exploring future worlds and technologies',
      bookCount: 18,
      isPublic: false,
      books: []
    }
  ]

  const filteredShelves = shelves.filter(shelf =>
    shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shelf.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Bookshelves</h1>
            <p className="text-muted-foreground">
              Organize your books into custom collections.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Bookshelf
            </Button>
          </div>
        </div>

        {/* Search and View Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookshelves..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bookshelves Grid */}
        {filteredShelves.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                {searchQuery ? (
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                ) : (
                  <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                )}
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No bookshelves found' : 'No bookshelves yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search terms.'
                    : 'Create your first bookshelf to start organizing your books-old.'}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Bookshelf
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
            {filteredShelves.map((shelf) => (
              <Card key={shelf.id} className="group cursor-pointer transition-all hover:shadow-lg">
                <CardContent className="p-4">
                  {/* Shelf Preview */}
                  <div className="w-full h-32 bg-muted rounded-lg mb-4 flex items-center justify-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground" />
                  </div>

                  {/* Shelf Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {shelf.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {shelf.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>

                    {shelf.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {shelf.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-muted-foreground">
                        {shelf.bookCount} books
                      </p>

                      {/* Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {shelves.length > 0 && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{shelves.length}</div>
                <p className="text-xs text-muted-foreground">Total Bookshelves</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {shelves.filter(s => s.isPublic).length}
                </div>
                <p className="text-xs text-muted-foreground">Public Shelves</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {shelves.reduce((sum, shelf) => sum + shelf.bookCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total Books</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {Math.round(shelves.reduce((sum, shelf) => sum + shelf.bookCount, 0) / shelves.length)}
                </div>
                <p className="text-xs text-muted-foreground">Avg Books per Shelf</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}