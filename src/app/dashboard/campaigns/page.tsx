'use client'

import { useEffect, useState } from 'react'
import { getCampaigns } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { CampaignsHeader } from './components/campaigns-header'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import CampaignsContextProvider, { CampaignsDialogType } from './context/campaigns-context'
import { Campaign } from './data/schema'
import { CampaignsMutateDrawer } from './components/campaigns-mutate-drawer'
import { CampaignDeleteDialog } from './components/campaign-delete-dialog'
import { CampaignStatsDialog } from './components/campaign-stats-dialog'

function CampaignsPageContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [currentRow, setCurrentRow] = useState<Campaign | null>(null)
  const [open, setOpen] = useState<CampaignsDialogType | null>(null)

  const refreshCampaigns = async () => {
    try {
      const data = await getCampaigns()
      setCampaigns(data)
    } catch (error) {
      console.error('Error refreshing campaigns:', error)
    }
  }

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

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
        <DataTable data={campaigns} columns={columns} />
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
  return <CampaignsPageContent />
}
