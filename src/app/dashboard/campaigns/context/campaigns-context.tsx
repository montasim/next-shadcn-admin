'use client'

import React from 'react'
import { Campaign } from '../data/schema'

export type CampaignsDialogType = 'create' | 'edit' | 'delete' | 'send' | 'schedule' | 'stats'

interface CampaignsContextType {
  open: CampaignsDialogType | null
  setOpen: (str: CampaignsDialogType | null) => void
  currentRow: Campaign | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Campaign | null>>
  refreshCampaigns?: () => Promise<void>
}

const CampaignsContext = React.createContext<CampaignsContextType | null>(null)

interface Props {
  children: React.ReactNode
  value: CampaignsContextType
}

export default function CampaignsContextProvider({ children, value }: Props) {
  return <CampaignsContext.Provider value={value}>{children}</CampaignsContext.Provider>
}

export const useCampaignsContext = () => {
  const campaignsContext = React.useContext(CampaignsContext)

  if (!campaignsContext) {
    throw new Error(
      'useCampaignsContext has to be used within <CampaignsContext.Provider>'
    )
  }

  return campaignsContext
}
