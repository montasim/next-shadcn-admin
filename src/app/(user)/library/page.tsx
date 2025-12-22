'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
    Plus,
    Search,
    Grid3X3,
    List,
    FolderOpen,
    Upload,
    BookOpen,
    Clock,
    TrendingUp,
    Target
} from 'lucide-react'
import { BookList } from './book-list'
import { BookshelfMutateDrawer } from './bookshelf-mutate-drawer'
import { BookCard } from './book-card'
import { useRouter } from 'next/navigation'
import { getBookshelves } from './actions'
import {UploadBooksMutateDrawer} from "@/app/(user)/library/upload-books-mutate-drawer";

// Mock stats data
const stats = {
    completedBooks: 8,
    readingTime: 45, // hours
    currentlyReading: 3,
}

export default function LibraryPage() {
  const [shelves, setShelves] = useState<any[]>([])
  const [isLoadingShelves, setIsLoadingShelves] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isBookDrawerOpen, setIsBookDrawerOpen] = useState(false)
  const [isShelfDrawerOpen, setIsShelfDrawerOpen] = useState(false)
  const [selectedShelf, setSelectedShelf] = useState<any | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchShelves = async () => {
        setIsLoadingShelves(true)
        const userShelves = await getBookshelves()
        setShelves(userShelves)
        setIsLoadingShelves(false)
    }
    fetchShelves()
  }, [])

  const filteredShelves = shelves.filter(shelf =>
    shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shelf.description && shelf.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSuccess = () => {
    const fetchShelves = async () => {
        const userShelves = await getBookshelves()
        setShelves(userShelves)
    }
    fetchShelves()
    router.refresh()
  }

  if (selectedShelf) {
    return (
        <div className="space-y-4">
            <Button variant="outline" onClick={() => setSelectedShelf(null)}>
                &larr; Back to Bookshelves
            </Button>
            <h2 className="text-2xl font-bold">{selectedShelf.name}</h2>
            <p className="text-muted-foreground">{selectedShelf.description}</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* This part needs real book data for the shelf */}
                <p>Book display for this shelf is not implemented yet.</p>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <p className="text-muted-foreground">
            Organize your books into custom collections and manage your uploads.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
           <Button onClick={() => setIsBookDrawerOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Book
          </Button>
          <Button onClick={() => setIsShelfDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Bookshelf
          </Button>
        </div>
      </div>

      <Tabs defaultValue="uploads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="uploads">My Uploads</TabsTrigger>
          <TabsTrigger value="shelves">Bookshelves</TabsTrigger>
        </TabsList>
        <TabsContent value="uploads" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Books Read</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.completedBooks}</div>
                    <p className="text-xs text-muted-foreground">2 this month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.readingTime}h</div>
                    <p className="text-xs text-muted-foreground">Total time invested</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.currentlyReading}</div>
                    <p className="text-xs text-muted-foreground">Active books</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reading Goal</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">67%</div>
                    <p className="text-xs text-muted-foreground">8 of 12 books</p>
                    <Progress value={67} className="mt-2 h-2" />
                </CardContent>
            </Card>
          </div>
          <BookList openDrawer={() => setIsBookDrawerOpen(true)} />
        </TabsContent>
        <TabsContent value="shelves" className="space-y-4">
          {/* Search and View Controls */}
          <div className="flex flex-col md:flex-row gap-4">
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
          {isLoadingShelves ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <div className="w-full h-32 bg-muted rounded-lg mb-4" />
                        <CardContent className="p-4 space-y-2">
                            <div className="h-5 bg-muted rounded w-3/4" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                        </CardContent>
                    </Card>
                ))}
             </div>
          ) : filteredShelves.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookshelves yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first bookshelf to start organizing your books.
                  </p>
                  <Button onClick={() => setIsShelfDrawerOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Bookshelf
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
              {filteredShelves.map((shelf) => (
                <Card key={shelf.id} className="group cursor-pointer transition-all hover:shadow-lg" onClick={() => setSelectedShelf(shelf)}>
                  <CardContent className="p-4">
                    <div className="w-full h-32 bg-muted rounded-lg mb-4 flex items-center justify-center">
                      <FolderOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {shelf.name}
                        </h3>
                        {shelf.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            Public
                          </Badge>
                        )}
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <UploadBooksMutateDrawer
        open={isBookDrawerOpen} 
        onOpenChange={setIsBookDrawerOpen}
        onSuccess={handleSuccess}
      />
      <BookshelfMutateDrawer
        open={isShelfDrawerOpen}
        onOpenChange={setIsShelfDrawerOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
