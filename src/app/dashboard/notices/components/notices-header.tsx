'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNoticesContext } from '../context/notices-context'

export function NoticesHeader() {
  const { setOpen, refreshNotices } = useNoticesContext()

  const handleAddNotice = () => {
    setOpen('create')
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-bold tracking-tight">Notices</h2>
        <p className="text-muted-foreground">
          Manage announcements and notices displayed to users
        </p>
      </div>
      <div className="flex gap-2">
        <Button className="space-x-1" onClick={handleAddNotice}>
          <span>Add Notice</span> <Plus size={18} />
        </Button>
        <Button className="space-x-1" onClick={refreshNotices} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </>
  )
}
