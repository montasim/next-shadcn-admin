'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Series } from '../data/schema'
import useDialogState from '@/hooks/use-dialog-state'

export type SeriesDialogType = 'create' | 'edit' | 'delete' | null

interface SeriesContextValue {
  open: SeriesDialogType
  setOpen: (value: SeriesDialogType) => void
  currentRow: Series | null
  setCurrentRow: (row: Series | null) => void
  refreshSeries: () => Promise<void>
}

const SeriesContext = createContext<SeriesContextValue | undefined>(undefined)

interface SeriesProviderProps {
  children: ReactNode
  value: SeriesContextValue
}

export function SeriesProvider({ children, value }: SeriesProviderProps) {
  return <SeriesContext.Provider value={value}>{children}</SeriesContext.Provider>
}

export function useSeriesContext() {
  const context = useContext(SeriesContext)
  if (context === undefined) {
    throw new Error('useSeriesContext must be used within a SeriesProvider')
  }
  return context
}
