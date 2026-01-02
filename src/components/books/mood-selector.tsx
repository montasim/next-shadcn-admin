'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SmilePlus } from 'lucide-react'

export interface Mood {
  id: string
  name: string
  emoji: string
  description: string
  categories: string[]
  color: string
}

interface MoodSelectorProps {
  onSelectMood: (mood: Mood) => void
  selectedMood?: Mood | null
}

export function MoodSelector({ onSelectMood, selectedMood }: MoodSelectorProps) {
  const [moods, setMoods] = useState<Mood[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredMood, setHoveredMood] = useState<string | null>(null)

  useEffect(() => {
    const fetchMoods = async () => {
      try {
        const response = await fetch('/api/public/moods')
        if (!response.ok) {
          throw new Error('Failed to fetch moods')
        }
        const result = await response.json()
        setMoods(result.data.moods || [])
      } catch (error) {
        console.error('Error fetching moods:', error)
        // Fallback to default moods if API fails
        setMoods([])
      } finally {
        setLoading(false)
      }
    }

    fetchMoods()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Title Skeleton */}
        <div className="text-center mb-6 space-y-2">
          <Skeleton className="h-7 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Mood Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-10 w-10 mx-auto rounded-full" />
                  <Skeleton className="h-5 w-24 mx-auto" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (moods.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <SmilePlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Moods Available</h3>
            <p className="text-muted-foreground mb-4">
              Sorry, we couldn&apos;t load any moods at the moment. Please check back later!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">How are you feeling today?</h3>
        <p className="text-muted-foreground">Select your mood and we&apos;ll suggest the perfect books for you</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {moods.map((mood) => (
          <Card
            key={mood.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
              selectedMood?.id === mood.id
                ? 'ring-2 ring-primary ring-offset-2 ' + mood.color
                : mood.color
            }`}
            onMouseEnter={() => setHoveredMood(mood.id)}
            onMouseLeave={() => setHoveredMood(null)}
            onClick={() => onSelectMood(mood)}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{mood.emoji}</div>
                <h4 className="font-semibold mb-1">{mood.name}</h4>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {mood.description}
                </p>
                {(hoveredMood === mood.id || selectedMood?.id === mood.id) && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {mood.categories.slice(0, 2).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                    {mood.categories.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{mood.categories.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMood && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectMood(null as any)}
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  )
}

export default MoodSelector
