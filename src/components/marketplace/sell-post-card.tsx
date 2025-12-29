'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatPrice, formatDistanceToNow } from '@/lib/utils'
import { MapPin, Eye, MessageSquare } from 'lucide-react'
import { BookCondition } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface SellPostCardProps {
    id: string
    title: string
    description?: string | null
    price: number
    negotiable: boolean
    condition: BookCondition
    images: string[]
    directImageUrls?: any
    location?: string | null
    city?: string | null
    status: string
    createdAt: Date
    seller: {
        id: string
        name: string
        firstName?: string | null
        lastName?: string | null
        avatar?: string | null
        directAvatarUrl?: any
    }
    book?: {
        id: string
        name: string
        image?: string | null
        directImageUrl?: any
    } | null
    _count?: {
        views?: number
        offers?: number
    } | null
    showSeller?: boolean
    compact?: boolean
}

// ============================================================================
// UTILITIES
// ============================================================================

const conditionLabels: Record<BookCondition, string> = {
    NEW: 'New',
    LIKE_NEW: 'Like New',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
}

const conditionColors: Record<BookCondition, string> = {
    NEW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    LIKE_NEW: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    GOOD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    FAIR: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    POOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

const getInitials = (firstName?: string | null, lastName?: string | null, name?: string | null) => {
    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (name) {
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        }
        return name.slice(0, 2).toUpperCase()
    }
    return '??'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SellPostCard({
    id,
    title,
    description,
    price,
    negotiable,
    condition,
    images,
    directImageUrls,
    location,
    city,
    status,
    createdAt,
    seller,
    book,
    _count,
    showSeller = true,
    compact = false,
}: SellPostCardProps) {
    const coverImage = images[0]
    const displayName = seller.firstName && seller.lastName
        ? `${seller.firstName} ${seller.lastName}`
        : seller.name
    const initials = getInitials(seller.firstName, seller.lastName, seller.name)

    return (
        <Link href={`/marketplace/${id}`}>
            <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {coverImage ? (
                        <Image
                            src={coverImage}
                            alt={title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            No image
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Top badges */}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                        <Badge className={conditionColors[condition]}>
                            {conditionLabels[condition]}
                        </Badge>
                        {negotiable && (
                            <Badge variant="secondary" className="bg-white/90 text-black">
                                Negotiable
                            </Badge>
                        )}
                    </div>

                    {/* Price badge */}
                    <div className="absolute right-2 top-2">
                        <Badge className="bg-primary text-primary-foreground text-lg font-bold px-3 py-1">
                            {formatPrice(price)}
                        </Badge>
                    </div>

                    {/* Views count */}
                    {_count?.views !== undefined && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white text-sm">
                            <Eye className="h-4 w-4" />
                            {_count.views}
                        </div>
                    )}
                </div>

                <CardContent className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    {!compact && description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {description}
                        </p>
                    )}

                    {(city || location) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{city || location}</span>
                        </div>
                    )}

                    {book && (
                        <div className="text-xs text-muted-foreground mb-2">
                            Based on: <span className="font-medium">{book.name}</span>
                        </div>
                    )}

                    {/* Time and offers */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(createdAt))}</span>
                        {_count?.offers !== undefined && _count.offers > 0 && (
                            <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {_count.offers} offer{_count.offers !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </CardContent>

                {showSeller && (
                    <CardFooter className="border-t p-4 pt-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={seller.avatar || seller.directAvatarUrl} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground">Seller</p>
                            </div>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </Link>
    )
}
