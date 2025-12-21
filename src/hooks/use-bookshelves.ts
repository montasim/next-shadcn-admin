import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface Bookshelf {
  id: string
  name: string
  description?: string
  isPublic: boolean
  userId: string
  createdAt: string
  updatedAt: string
  books: BookshelfItem[]
  _count?: {
    books: number
  }
}

interface BookshelfItem {
  id: string
  bookshelfId: string
  bookId: string
  addedAt: string
  book: {
    id: string
    name: string
    image?: string
    authors: Array<{ id: string; name: string }>
    type: string
  }
}

interface CreateBookshelfData {
  name: string
  description?: string
  isPublic?: boolean
}

interface UpdateBookshelfData {
  name?: string
  description?: string
  isPublic?: boolean
}

// API functions
const fetchBookshelves = async (): Promise<Bookshelf[]> => {
  const response = await fetch('/api/user/bookshelves')
  if (!response.ok) throw new Error('Failed to fetch bookshelves')
  return response.json()
}

const fetchBookshelf = async (id: string): Promise<Bookshelf> => {
  const response = await fetch(`/api/user/bookshelves/${id}`)
  if (!response.ok) throw new Error('Failed to fetch bookshelf')
  return response.json()
}

const createBookshelf = async (data: CreateBookshelfData): Promise<Bookshelf> => {
  const response = await fetch('/api/user/bookshelves', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create bookshelf')
  return response.json()
}

const updateBookshelf = async (id: string, data: UpdateBookshelfData): Promise<Bookshelf> => {
  const response = await fetch(`/api/user/bookshelves/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update bookshelf')
  return response.json()
}

const deleteBookshelf = async (id: string): Promise<void> => {
  const response = await fetch(`/api/user/bookshelves/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete bookshelf')
}

const addBookToShelf = async (bookshelfId: string, bookId: string): Promise<void> => {
  const response = await fetch(`/api/user/bookshelves/${bookshelfId}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId }),
  })
  if (!response.ok) throw new Error('Failed to add book to shelf')
}

const removeBookFromShelf = async (bookshelfId: string, bookId: string): Promise<void> => {
  const response = await fetch(`/api/user/bookshelves/${bookshelfId}/books/${bookId}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to remove book from shelf')
}

// Hooks
export function useBookshelves() {
  return useQuery({
    queryKey: ['bookshelves'],
    queryFn: fetchBookshelves,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useBookshelf(id: string) {
  return useQuery({
    queryKey: ['bookshelf', id],
    queryFn: () => fetchBookshelf(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  })
}

export function useCreateBookshelf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBookshelf,
    onSuccess: (data) => {
      queryClient.setQueryData(['bookshelves'], (old: Bookshelf[] = []) => [...old, data])
      queryClient.invalidateQueries({ queryKey: ['bookshelves'] })
    },
  })
}

export function useUpdateBookshelf(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateBookshelfData) => updateBookshelf(id, data),
    onSuccess: (updatedBookshelf) => {
      queryClient.setQueryData(['bookshelf', id], updatedBookshelf)
      queryClient.setQueryData(['bookshelves'], (old: Bookshelf[] = []) =>
        old.map(shelf => shelf.id === id ? updatedBookshelf : shelf)
      )
    },
  })
}

export function useDeleteBookshelf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBookshelf,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['bookshelves'], (old: Bookshelf[] = []) =>
        old.filter(shelf => shelf.id !== deletedId)
      )
      queryClient.invalidateQueries({ queryKey: ['bookshelves'] })
    },
  })
}

export function useAddBookToShelf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookshelfId, bookId }: { bookshelfId: string; bookId: string }) =>
      addBookToShelf(bookshelfId, bookId),
    onSuccess: (_, { bookshelfId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookshelf', bookshelfId] })
      queryClient.invalidateQueries({ queryKey: ['bookshelves'] })
    },
  })
}

export function useRemoveBookFromShelf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookshelfId, bookId }: { bookshelfId: string; bookId: string }) =>
      removeBookFromShelf(bookshelfId, bookId),
    onSuccess: (_, { bookshelfId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookshelf', bookshelfId] })
      queryClient.invalidateQueries({ queryKey: ['bookshelves'] })
    },
  })
}