'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { Notice } from '../data/schema'

export type NoticesDialogType = 'create' | 'edit' | 'delete'

interface NoticesContextValue {
  open: NoticesDialogType | null
  setOpen: (dialog: NoticesDialogType | null) => void
  currentRow: Notice | null
  setCurrentRow: (row: Notice | null) => void
  refreshNotices: () => void
}

const NoticesContext = createContext<NoticesContextValue | undefined>(undefined)

export function NoticesContextProvider({
  children,
  value,
}: {
  children: ReactNode
  value: NoticesContextValue
}) {
  return <NoticesContext.Provider value={value}>{children}</NoticesContext.Provider>
}

export function useNoticesContext() {
  const context = useContext(NoticesContext)
  if (!context) {
    throw new Error('useNoticesContext must be used within NoticesContextProvider')
  }
  return context
}
