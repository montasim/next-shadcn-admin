'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, FolderTree, Search, ArrowUpDown } from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  entryDate: string
  bookCount: number
  viewCount?: number
  totalReaders?: number
  books: Array<{
    id: string
    name: string
    image: string | null
    type: string
    requiresPremium: boolean
    readersCount: number
  }>
}

type SortBy = 'name' | 'bookCount' | 'views' | 'popularity'
type SortOrder = 'asc' | 'desc'

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'bookCount-desc', label: 'Total Books (High to Low)' },
  { value: 'bookCount-asc', label: 'Total Books (Low to High)' },
  { value: 'views-desc', label: 'Views (High to Low)' },
  { value: 'views-asc', label: 'Views (Low to High)' },
  { value: 'popularity-desc', label: 'Popularity (High to Low)' },
  { value: 'popularity-asc', label: 'Popularity (Low to High)' },
]

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch categories')
    return res.json()
  }

  const { data, isLoading, error } = useSWR(
    `/api/public/categories?search=${encodeURIComponent(debouncedSearch)}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
    fetcher
  )

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-') as [SortBy, SortOrder]
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Failed to load categories</h2>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const categories = data.data.categories

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <NavigationBreadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Categories' }
            ]}
          />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FolderTree className="h-8 w-8" />
                Book Categories
              </h1>
              <p className="text-muted-foreground mt-2">
                Browse books by category
              </p>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative w-full sm:w-64">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground">
              {debouncedSearch ? 'Try a different search term' : 'No categories available yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category: Category) => (
              <Card key={category.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {category.bookCount} book{category.bookCount !== 1 ? 's' : ''}
                        {category.totalReaders !== undefined && ` · ${category.totalReaders.toLocaleString()} readers`}
                      </CardDescription>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {category.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent>
                  {category.books.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Popular books:</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {category.books.slice(0, 5).map((book) => (
                          <Link key={book.id} href={`/books/${book.id}`} className="flex-shrink-0">
                            <div className="relative w-16 h-24 rounded border overflow-hidden hover:border-primary transition-colors">
                              {book.image ? (
                                <Image
                                  src={getProxiedImageUrl(book.image) || book.image}
                                  alt={book.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground text-center px-1">
                                    {book.type}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                        {category.books.length > 5 && (
                          <div className="flex-shrink-0 w-16 h-24 rounded border flex items-center justify-center bg-muted">
                            <span className="text-xs text-muted-foreground">+{category.books.length - 5}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Link href={`/categories/${category.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      View Category
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
