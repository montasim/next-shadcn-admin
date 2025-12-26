'use client'

import React from 'react'
import { Mood } from '../data/schema'

export type MoodsDialogType = 'create' | 'edit' | 'delete'

interface MoodsContextType {
  open: MoodsDialogType | null
  setOpen: (str: MoodsDialogType | null) => void
  currentRow: Mood | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Mood | null>>
  refreshMoods?: () => Promise<void>
}

const MoodsContext = React.createContext<MoodsContextType | null>(null)

interface Props {
  children: React.ReactNode
  value: MoodsContextType
}

export default function MoodsContextProvider({ children, value }: Props) {
  return <MoodsContext.Provider value={value}>{children}</MoodsContext.Provider>
}

export const useMoodsContext = () => {
  const moodsContext = React.useContext(MoodsContext)

  if (!moodsContext) {
    throw new Error(
      'useMoodsContext has to be used within <MoodsContext.Provider>'
    )
  }

  return moodsContext
}
