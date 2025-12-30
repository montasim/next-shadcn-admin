'use client'

import { Button } from '@/components/ui/button'
import { useCampaignsContext } from '../context/campaigns-context'
import { IconPlus } from '@tabler/icons-react'

export function CampaignsHeader({ campaignCount }: { campaignCount: number }) {
  const { setOpen } = useCampaignsContext()

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          {campaignCount} {campaignCount === 1 ? 'campaign' : 'campaigns'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => setOpen('create')}>
          <IconPlus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>
    </div>
  )
}
