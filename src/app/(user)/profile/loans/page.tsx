/**
 * User Profile - Borrowed Books Page
 *
 * Allows users to view their currently borrowed books and return them
 */

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BorrowedBooksList } from '@/components/loans/borrowed-books-list'
import { BookOpen } from 'lucide-react'

export default async function ProfileLoansPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Borrowed Books</h1>
            <p className="text-muted-foreground">
              View and manage your borrowed books
            </p>
          </div>
        </div>
      </div>

      {/* Borrowed Books List */}
      <BorrowedBooksList userId={session.user.id} />
    </div>
  )
}
