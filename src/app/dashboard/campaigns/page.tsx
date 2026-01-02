'use client'

import { useEffect, useState, useCallback } from 'react'
import { getCampaigns } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { CampaignsHeader } from './components/campaigns-header'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton, DashboardSummarySkeleton } from '@/components/data-table/table-skeleton'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { columns } from './components/columns'
import CampaignsContextProvider, { CampaignsDialogType } from './context/campaigns-context'
import { Campaign } from './data/schema'
import { CampaignsMutateDrawer } from './components/campaigns-mutate-drawer'
import { CampaignDeleteDialog } from './components/campaign-delete-dialog'
import { CampaignStatsDialog } from './components/campaign-stats-dialog'
import { Mail, Send, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'

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
      <HeaderContainer>
        <CampaignsHeader campaignCount={campaigns.length} />
      </HeaderContainer>

      <div className="space-y-4 mt-4">
        {/* Campaign Summary */}
        {isLoading ? <DashboardSummarySkeleton count={6} /> : <DashboardSummary summaries={summaryItems} />}

        {/* Campaigns Table */}
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
          {isLoading ? <TableSkeleton /> : <DataTable data={campaigns} columns={columns} />}
        </div>
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
    </CampaignsContextProvider>
  )
}

export default function Page() {
  return <div className='p-4'>
      <CampaignsPageContent />
  </div>
}
