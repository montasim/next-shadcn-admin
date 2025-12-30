'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCampaignsContext } from '../context/campaigns-context'
import { Campaign } from '../data/schema'
import { getCampaignStats } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  MailCheck,
  MailOpen,
  MousePointerClick,
  UserX,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface CampaignStatsData {
  recipientCount: number
  sentCount: number
  deliveredCount: number
  failedCount: number
  openedCount: number
  clickedCount: number
  unsubscribeCount: number
  openRate: number
  clickRate: number
  unsubscribeRate: number
}

export function CampaignStatsDialog() {
  const { open, setOpen, currentRow } = useCampaignsContext()
  const [stats, setStats] = useState<CampaignStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const campaign = currentRow as Campaign | null

  useEffect(() => {
    const fetchStats = async () => {
      if (!campaign || open !== 'stats') return

      setIsLoading(true)
      try {
        const data = await getCampaignStats(campaign.id)
        setStats(data as CampaignStatsData)
      } catch (error) {
        console.error('Error fetching campaign stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [campaign, open])

  if (!campaign) return null

  return (
    <Dialog open={open === 'stats'} onOpenChange={() => setOpen(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Campaign Statistics</DialogTitle>
          <DialogDescription>
            Performance metrics for <strong>"{campaign.name}"</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recipientCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.sentCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                    <MailCheck className="h-4 w-4" />
                    Delivered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.deliveredCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.failedCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Engagement Metrics</h3>

              {/* Open Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MailOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Open Rate</span>
                  </div>
                  <span className="text-sm font-medium">
                    {stats.openedCount} opens ({stats.openRate.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={stats.openRate} className="h-2" />
              </div>

              {/* Click Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Click Rate</span>
                  </div>
                  <span className="text-sm font-medium">
                    {stats.clickedCount} clicks ({stats.clickRate.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={stats.clickRate} className="h-2" />
              </div>

              {/* Unsubscribe Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Unsubscribe Rate</span>
                  </div>
                  <span className="text-sm font-medium">
                    {stats.unsubscribeCount} unsubscribes ({stats.unsubscribeRate.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={stats.unsubscribeRate} className="h-2" />
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">Campaign Status</span>
              <Badge>{campaign.status}</Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No statistics available yet. Send the campaign to see metrics.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
