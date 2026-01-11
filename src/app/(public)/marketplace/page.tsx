'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SellPostGrid, type SellPostCardProps } from '@/components/marketplace'
import Link from 'next/link'
import {
    SlidersHorizontal,
    X,
    ShoppingBag,
    Filter,
    ArrowUpDown,
} from 'lucide-react'
import { BookCondition } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

interface MarketplaceFilters {
    search: string
    condition?: BookCondition
    city?: string
    minPrice?: number
    maxPrice?: number
    negotiable?: boolean
    sortBy: 'createdAt' | 'price' | 'updatedAt' | 'views'
    sortOrder: 'asc' | 'desc'
    page: number
    limit: number
}

interface MarketplaceResponse {
    success: boolean
    data: {
        posts: SellPostCardProps[]
        pagination: {
            currentPage: number
            totalPages: number
            totalItems: number
            limit: number
            hasNextPage: boolean
            hasPreviousPage: boolean
        }
    }
    message?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONDITION_OPTIONS = [
    { value: 'NEW', label: 'New' },
    { value: 'LIKE_NEW', label: 'Like New' },
    { value: 'GOOD', label: 'Good' },
    { value: 'FAIR', label: 'Fair' },
    { value: 'POOR', label: 'Poor' },
]

// ============================================================================
// HELPERS
// ============================================================================

function deriveFiltersFromSearchParams(searchParams: ReturnType<typeof useSearchParams>): MarketplaceFilters {
    return {
        search: searchParams?.get('search') || '',
        condition: searchParams?.get('condition') as BookCondition | undefined,
        city: searchParams?.get('city') || undefined,
        minPrice: searchParams?.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
        maxPrice: searchParams?.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
        negotiable: searchParams?.get('negotiable') === 'true' ? true : undefined,
        sortBy: (searchParams?.get('sortBy') as any) || 'createdAt',
        sortOrder: (searchParams?.get('sortOrder') as any) || 'desc',
        page: Number(searchParams?.get('page')) || 1,
        limit: Number(searchParams?.get('limit')) || 20,
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

function MarketplacePageContent({
    initialFilters,
    user,
}: {
    initialFilters: MarketplaceFilters
    user: any
}) {
    const [filters, setFilters] = useState<MarketplaceFilters>(initialFilters)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [data, setData] = useState<MarketplaceResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch sell posts
    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams()
                if (filters.search) params.set('search', filters.search)
                if (filters.condition) params.set('condition', filters.condition)
                if (filters.city) params.set('city', filters.city)
                if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString())
                if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString())
                if (filters.negotiable !== undefined) params.set('negotiable', filters.negotiable.toString())
                params.set('sortBy', filters.sortBy)
                params.set('sortOrder', filters.sortOrder)
                params.set('page', filters.page.toString())
                params.set('limit', filters.limit.toString())

                const response = await fetch(`/api/marketplace/posts?${params.toString()}`)
                const result: MarketplaceResponse = await response.json()

                if (result.success) {
                    setData(result)
                } else {
                    setError(result.message || 'Failed to fetch listings')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch listings')
            } finally {
                setIsLoading(false)
            }
        }

        fetchPosts()
    }, [filters])

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams()
        if (filters.search) params.set('search', filters.search)
        if (filters.condition) params.set('condition', filters.condition)
        if (filters.city) params.set('city', filters.city)
        if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString())
        if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString())
        if (filters.negotiable !== undefined) params.set('negotiable', filters.negotiable.toString())
        if (filters.sortBy !== 'createdAt') params.set('sortBy', filters.sortBy)
        if (filters.sortOrder !== 'desc') params.set('sortOrder', filters.sortOrder)
        if (filters.page !== 1) params.set('page', filters.page.toString())

        const newUrl = `/marketplace${params.toString() ? '?' + params.toString() : ''}`
        window.history.replaceState(null, '', newUrl)
    }, [filters])

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : value
        }))
    }

    const handleSearch = (query: string) => {
        handleFilterChange('search', query)
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            condition: undefined,
            city: '',
            minPrice: undefined,
            maxPrice: undefined,
            negotiable: undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            limit: 20,
        })
    }

    const hasActiveFilters = filters.condition || filters.city || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.negotiable !== undefined

    const posts = data?.data.posts || []
    const pagination = data?.data.pagination

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-4 pb-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Book Marketplace</h1>
                            <p className="text-muted-foreground text-sm">
                                {pagination?.totalItems || 0} listings available
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Input
                                type="search"
                                placeholder="Search by title, author..."
                                value={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Filter Toggle - Mobile */}
                        <Button
                            variant={hasActiveFilters ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="lg:hidden"
                        >
                            <Filter className="h-4 w-4" />
                            {hasActiveFilters && <span className="ml-1 h-2 w-2 bg-current rounded-full" />}
                        </Button>

                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Filters Sidebar - Desktop */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Filters</CardTitle>
                                    {hasActiveFilters && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="h-auto px-2 py-1"
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Condition Filter */}
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">Condition</Label>
                                    <Select
                                        value={filters.condition || 'all'}
                                        onValueChange={(value) => handleFilterChange('condition', value === 'all' ? undefined : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Conditions</SelectItem>
                                            {CONDITION_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Negotiable Filter */}
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="negotiable"
                                            checked={filters.negotiable === true}
                                            onCheckedChange={(checked) => handleFilterChange('negotiable', checked ? true : undefined)}
                                        />
                                        <Label htmlFor="negotiable" className="text-sm cursor-pointer">
                                            Negotiable Only
                                        </Label>
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">Price Range</Label>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Min:</span>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={filters.minPrice || ''}
                                                onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                                                className="flex-1"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Max:</span>
                                            <Input
                                                type="number"
                                                placeholder="Any"
                                                value={filters.maxPrice || ''}
                                                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* City */}
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">Location</Label>
                                    <Input
                                        placeholder="Enter city..."
                                        value={filters.city || ''}
                                        onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                                    />
                                </div>

                                {/* Sort Options */}
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">
                                        <ArrowUpDown className="h-4 w-4 inline mr-1" />
                                        Sort By
                                    </Label>
                                    <div className="space-y-3">
                                        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="createdAt">Newest First</SelectItem>
                                                <SelectItem value="price">Price</SelectItem>
                                                <SelectItem value="views">Most Viewed</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="sortOrder"
                                                checked={filters.sortOrder === 'asc'}
                                                onCheckedChange={(checked) => handleFilterChange('sortOrder', checked ? 'asc' : 'desc')}
                                            />
                                            <Label htmlFor="sortOrder" className="text-sm cursor-pointer">
                                                Ascending Order
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Listings Grid */}
                    <div className="flex-1">
                        {/* Mobile Filter Sheet */}
                        {isFilterOpen && (
                            <div className="lg:hidden fixed inset-0 z-50 flex mb-20">
                                <div className="fixed inset-0 bg-black/50" onClick={() => setIsFilterOpen(false)} />
                                <div className="relative bg-background w-80 h-full overflow-y-auto animate-in slide-in-from-left">
                                    <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">Filters</h2>
                                        <Button variant="ghost" size="sm" onClick={() => setIsFilterOpen(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="p-4 space-y-6">
                                        {/* Condition Filter */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block">Condition</Label>
                                            <Select
                                                value={filters.condition || 'all'}
                                                onValueChange={(value) => handleFilterChange('condition', value === 'all' ? undefined : value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Conditions</SelectItem>
                                                    {CONDITION_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Negotiable Filter */}
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="mobile-negotiable"
                                                    checked={filters.negotiable === true}
                                                    onCheckedChange={(checked) => handleFilterChange('negotiable', checked ? true : undefined)}
                                                />
                                                <Label htmlFor="mobile-negotiable" className="text-sm cursor-pointer">
                                                    Negotiable Only
                                                </Label>
                                            </div>
                                        </div>

                                        {/* Price Range */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block">Price Range</Label>
                                            <div className="space-y-3">
                                                <Input
                                                    type="number"
                                                    placeholder="Min price"
                                                    value={filters.minPrice || ''}
                                                    onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Max price"
                                                    value={filters.maxPrice || ''}
                                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                                                />
                                            </div>
                                        </div>

                                        {/* City */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block">Location</Label>
                                            <Input
                                                placeholder="Enter city..."
                                                value={filters.city || ''}
                                                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                                            />
                                        </div>

                                        {/* Sort */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block">Sort By</Label>
                                            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="createdAt">Newest First</SelectItem>
                                                    <SelectItem value="price">Price</SelectItem>
                                                    <SelectItem value="views">Most Viewed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex gap-2 pt-4 border-t">
                                            <Button variant="outline" className="flex-1" onClick={clearFilters}>
                                                Clear All
                                            </Button>
                                            <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                                                Apply
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Filters - Mobile */}
                        {hasActiveFilters && (
                            <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
                                {filters.condition && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        Condition: {filters.condition}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('condition', undefined)} />
                                    </Badge>
                                )}
                                {filters.negotiable && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        Negotiable
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('negotiable', undefined)} />
                                    </Badge>
                                )}
                                {filters.city && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        {filters.city}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('city', undefined)} />
                                    </Badge>
                                )}
                                {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        ${filters.minPrice || 0} - ${filters.maxPrice || 'Any'}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => {
                                                handleFilterChange('minPrice', undefined)
                                                handleFilterChange('maxPrice', undefined)
                                            }}
                                        />
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[...Array(8)].map((_, i) => (
                                    <Card key={i} className="overflow-hidden">
                                        <div className="aspect-[4/3] bg-muted animate-pulse" />
                                        <CardContent className="p-4 space-y-2">
                                            <div className="h-4 bg-muted animate-pulse rounded" />
                                            <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">{error}</p>
                                <Button onClick={() => window.location.reload()}>Try Again</Button>
                            </div>
                        )}

                        {/* Results */}
                        {!isLoading && !error && (
                            <>
                                <SellPostGrid posts={posts} showSeller={true} />

                                {/* Pagination */}
                                {pagination && pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleFilterChange('page', filters.page - 1)}
                                            disabled={!pagination.hasPreviousPage}
                                        >
                                            Previous
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                const pageNum = i + 1
                                                const isCurrentPage = pageNum === filters.page

                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={isCurrentPage ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleFilterChange('page', pageNum)}
                                                        disabled={isCurrentPage}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                )
                                            })}

                                            {pagination.totalPages > 5 && (
                                                <>
                                                    <span className="px-2 text-sm text-muted-foreground">...</span>
                                                    <Button
                                                        variant={filters.page === pagination.totalPages ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleFilterChange('page', pagination.totalPages)}
                                                    >
                                                        {pagination.totalPages}
                                                    </Button>
                                                </>
                                            )}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleFilterChange('page', filters.page + 1)}
                                            disabled={!pagination.hasNextPage}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

// Wrapper component
function MarketplacePageWrapper() {
    const searchParams = useSearchParams()
    const { user } = useAuth()

    const initialFilters = useMemo(() => deriveFiltersFromSearchParams(searchParams), [searchParams])

    return <MarketplacePageContent initialFilters={initialFilters} user={user} />
}

// Export with Suspense
export default function MarketplacePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <MarketplacePageWrapper />
        </Suspense>
    )
}
