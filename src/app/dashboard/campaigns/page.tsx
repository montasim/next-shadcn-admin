'use client'

import { useEffect, useState, useCallback } from 'react'
import { getCampaigns } from './actions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton, DashboardSummarySkeleton } from '@/components/data-table/table-skeleton'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { columns } from './components/columns'
import CampaignsContextProvider, { CampaignsDialogType } from './context/campaigns-context'
import { Campaign } from './data/schema'
import { CampaignsMutateDrawer } from './components/campaigns-mutate-drawer'
import { CampaignDeleteDialog } from './components/campaign-delete-dialog'
import { CampaignStatsDialog } from './components/campaign-stats-dialog'
import { Mail, Send, Clock, CheckCircle2, AlertCircle, TrendingUp, Megaphone } from 'lucide-react'
import { IconPlus } from '@tabler/icons-react'

function CampaignsPageContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [currentRow, setCurrentRow] = useState<Campaign | null>(null)
  const [open, setOpen] = useState<CampaignsDialogType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch campaigns and update state
  const refreshCampaigns = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCampaigns()
      setCampaigns(data)
    } catch (error) {
      console.error('Error refreshing campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Calculate campaign statistics
  const campaignStats = {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === 'DRAFT').length,
    sent: campaigns.filter(c => c.status === 'SENT').length,
    scheduled: campaigns.filter(c => c.status === 'SCHEDULED').length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
    openRate: campaigns.length > 0
      ? Math.round(campaigns.reduce((sum, c) => sum + (c.sentCount > 0 ? (c.openedCount / c.sentCount) * 100 : 0), 0) / campaigns.length)
      : 0,
  }

  const summaryItems = [
    {
      title: 'Total Campaigns',
      value: campaignStats.total,
      description: 'All email campaigns',
      icon: Mail,
    },
    {
      title: 'Sent',
      value: campaignStats.sent,
      description: 'Successfully delivered',
      icon: Send,
    },
    {
      title: 'Scheduled',
      value: campaignStats.scheduled,
      description: 'Pending to send',
      icon: Clock,
    },
    {
      title: 'Draft',
      value: campaignStats.draft,
      description: 'In preparation',
      icon: AlertCircle,
    },
    {
      title: 'Total Emails',
      value: campaignStats.totalSent,
      description: 'Emails sent overall',
      icon: CheckCircle2,
    },
    {
      title: 'Avg Open Rate',
      value: `${campaignStats.openRate}%`,
      description: 'Average engagement',
      icon: TrendingUp,
    },
  ]

  useEffect(() => {
    refreshCampaigns()
  }, [])

  const handleDialogClose = () => {
    setOpen(null)
    // Small delay to clear the current row after dialog closes
    setTimeout(() => {
      setCurrentRow(null)
    }, 300)
  }

  return (
    <CampaignsContextProvider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        refreshCampaigns,
      }}
    >
      <DashboardPage
        icon={Megaphone}
        title="Campaigns"
        description="Manage email campaigns to engage with your audience"
        actions={
          <DashboardPageHeaderActions
            actions={[
              {
                label: 'New Campaign',
                icon: IconPlus,
                onClick: () => setOpen('create'),
              },
            ]}
          />
        }
      >
        <div className="space-y-4">
          {/* Campaign Summary */}
          {isLoading ? <DashboardSummarySkeleton count={6} /> : <DashboardSummary summaries={summaryItems} />}

          {/* Campaigns Table */}
          {isLoading ? (
            <TableSkeleton />
          ) : campaigns.length === 0 ? (
            <EmptyStateCard
              icon={Megaphone}
              title="No campaigns yet"
              description="Get started by creating your first email campaign to engage with your audience."
            />
          ) : (
            <DataTable data={campaigns} columns={columns} />
          )}
        </div>

      {/* Create Drawer */}
      <CampaignsMutateDrawer
        key="campaign-create"
        open={open === 'create'}
        onOpenChange={(val) => {
          if (val) {
            setOpen('create')
          } else {
            handleDialogClose()
          }
        }}
        onSuccess={refreshCampaigns}
      />

      {/* Edit Drawer */}
      {currentRow && (
        <CampaignsMutateDrawer
          key={`campaign-edit-${currentRow.id}`}
          open={open === 'edit'}
          onOpenChange={(val) => {
            if (val) {
              setOpen('edit')
            } else {
              handleDialogClose()
            }
          }}
          currentRow={currentRow}
          onSuccess={refreshCampaigns}
        />
      )}

      {/* Delete Dialog */}
      <CampaignDeleteDialog />

      {/* Stats Dialog */}
      <CampaignStatsDialog />
      </DashboardPage>
    </CampaignsContextProvider>
  )
}

export default function Page() {
  return <CampaignsPageContent />
}
