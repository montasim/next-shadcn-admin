'use client'

import { SellPostCard, type SellPostCardProps } from './sell-post-card'

// ============================================================================
// TYPES
// ============================================================================

export interface SellPostGridProps {
    posts: SellPostCardProps[]
    showSeller?: boolean
    compact?: boolean
    className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SellPostGrid({
    posts,
    showSeller = true,
    compact = false,
    className = '',
}: SellPostGridProps) {
    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-1">No listings found</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    There are no sell posts matching your criteria. Try adjusting your filters.
                </p>
            </div>
        )
    }

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 ${className}`}>
            {posts.map((post) => (
                <SellPostCard
                    key={post.id}
                    {...post}
                    showSeller={showSeller}
                    compact={compact}
                />
            ))}
        </div>
    )
}
