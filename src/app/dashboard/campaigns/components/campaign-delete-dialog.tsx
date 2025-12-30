'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCampaignsContext } from '../context/campaigns-context'
import { Campaign } from '../data/schema'
import { deleteCampaign } from '../actions'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function CampaignDeleteDialog() {
  const { open, setOpen, currentRow, setCurrentRow, refreshCampaigns } = useCampaignsContext()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const campaign = currentRow as Campaign | null

  const handleDelete = async () => {
    if (!campaign) return

    setIsDeleting(true)
    try {
      await deleteCampaign(campaign.id)
      toast({
        title: 'Campaign deleted',
        description: `"${campaign.name}" has been deleted successfully`,
      })
      refreshCampaigns?.()
      router.refresh()
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete campaign',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open === 'delete'} onOpenChange={() => setOpen('delete')}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete the campaign <strong>"{campaign?.name}"</strong>. <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
