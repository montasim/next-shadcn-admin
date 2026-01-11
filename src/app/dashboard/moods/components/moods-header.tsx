'use client'

import { Plus, RefreshCw, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMoodsContext } from '../context/moods-context'

interface MoodsHeaderProps {
  onSeedMoods?: () => void
}

export function MoodsHeader({ onSeedMoods }: MoodsHeaderProps) {
  const { setOpen, refreshMoods } = useMoodsContext()

  const handleAddMood = () => {
    setOpen('create')
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-bold tracking-tight">Mood List</h2>
        <p className="text-muted-foreground">
          Manage moods and their category mappings for book recommendations
        </p>
      </div>
      <div className="flex gap-2">
        <Button className="space-x-1" onClick={handleAddMood}>
          <span>Add Mood</span> <Plus size={18} />
        </Button>
        <Button className="space-x-1" onClick={refreshMoods} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        {onSeedMoods && (
          <Button className="space-x-1" onClick={onSeedMoods} variant="outline">
            <Sprout className="h-4 w-4 mr-2" />
            Seed Moods
          </Button>
        )}
      </div>
    </>
  )
}
