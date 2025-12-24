'use client'

import { createContext, useContext, Dispatch, SetStateAction } from 'react'

export type LibraryDialogType = 'edit' | 'delete' | null

interface LibraryContextProps {
  open: LibraryDialogType
  setOpen: Dispatch<SetStateAction<LibraryDialogType>>
  currentRow: any | null
  setCurrentRow: Dispatch<SetStateAction<any | null>>
  refreshBooks: () => void
}

export const LibraryContext = createContext<LibraryContextProps | undefined>(undefined)

export function useLibraryContext() {
  const context = useContext(LibraryContext)
  if (!context) {
    throw new Error('useLibraryContext must be used within a LibraryContextProvider')
  }
  return context
}

export default LibraryContext.Provider
