'use client'

import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconSend, IconCalendar, IconTrash, IconChartBar, IconEdit } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCampaignsContext } from '../context/campaigns-context'
import { campaignSchema } from '../data/schema'
import { sendCampaign } from '../actions'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const campaign = campaignSchema.parse(row.original)
  const { setOpen, setCurrentRow } = useCampaignsContext()
  const router = useRouter()

  const canEdit = campaign.status === 'DRAFT' || campaign.status === 'FAILED'
  const canDelete = campaign.status === 'DRAFT' || campaign.status === 'FAILED' || campaign.status === 'CANCELLED'
  const canSend = campaign.status === 'DRAFT' || campaign.status === 'FAILED'
  const canSchedule = campaign.status === 'DRAFT' || campaign.status === 'FAILED'

  const handleSend = async () => {
    try {
      const result = await sendCampaign(campaign.id)
      toast({
        title: 'Campaign sent successfully',
        description: `Sent to ${result.totalRecipients} recipients (${result.sentCount} delivered, ${result.failedCount} failed)`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send campaign',
        variant: 'destructive',
      })
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        {canEdit && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(campaign)
              setOpen('edit')
            }}
          >
            Edit
            <DropdownMenuShortcut>
              <IconEdit size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {canSend && (
          <DropdownMenuItem onClick={handleSend}>
            Send Now
            <DropdownMenuShortcut>
              <IconSend size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {canSchedule && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(campaign)
              setOpen('schedule')
            }}
          >
            Schedule
            <DropdownMenuShortcut>
              <IconCalendar size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(campaign)
            setOpen('stats')
          }}
        >
          View Stats
          <DropdownMenuShortcut>
            <IconChartBar size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(campaign)
                setOpen('delete')
              }}
            >
              Delete
              <DropdownMenuShortcut>
                <IconTrash size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
