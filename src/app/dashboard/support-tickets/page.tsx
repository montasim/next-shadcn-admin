'use client'

import { useState, useEffect } from 'react'
import { HeaderContainer } from '@/components/ui/header-container'
import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { DashboardSummarySkeleton, FilterSectionSkeleton, TicketListSkeleton } from '@/components/data-table/table-skeleton'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SupportTicket, TicketPriority, TicketStatus } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Send, Clock, AlertCircle, CheckCircle2, User, LifeBuoy, Filter } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TicketWithRelations extends SupportTicket {
  user: {
    id: string
    name: string
    email: string
    firstName?: string | null
    lastName?: string | null
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  } | null
  responses: {
    id: string
    message: string
    isFromAdmin: boolean
    createdAt: string
    sender: {
      name: string
      email: string
    }
  }[]
  _count: {
    responses: number
  }
}

interface TicketStats {
  total: number
  open: number
  inProgress: number
  waitingForUser: number
  resolved: number
  closed: number
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: 'bg-gray-500/10 text-gray-500',
  MEDIUM: 'bg-blue-500/10 text-blue-500',
  HIGH: 'bg-orange-500/10 text-orange-500',
  URGENT: 'bg-red-500/10 text-red-500',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_USER: 'Waiting for User',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-500/10 text-blue-500',
  IN_PROGRESS: 'bg-yellow-500/10 text-yellow-600',
  WAITING_FOR_USER: 'bg-purple-500/10 text-purple-500',
  RESOLVED: 'bg-green-500/10 text-green-500',
  CLOSED: 'bg-gray-500/10 text-gray-500',
}

const TICKET_CATEGORIES = {
  technical: 'Technical Issue',
  billing: 'Billing & Payment',
  feature: 'Feature Request',
  bug: 'Bug Report',
  other: 'Other',
} as const

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null)
  const [newResponse, setNewResponse] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Fetch tickets
  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)

      const response = await fetch(`/api/admin/support-tickets?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')

      const result = await response.json()
      setTickets(result.data.tickets || [])
      setStats(result.data.stats)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch support tickets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [selectedStatus])

  // Update ticket status
  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Ticket status updated',
        })
        fetchTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, ...result.data.ticket })
        }
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ticket',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Assign ticket to self
  const handleAssignToMe = async () => {
    if (!selectedTicket) return
    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/admin/support-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Ticket assigned to you',
        })
        fetchTickets()
        setSelectedTicket({ ...selectedTicket, ...result.data.ticket })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign ticket',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Submit response
  const handleSubmitResponse = async () => {
    if (!selectedTicket || !newResponse.trim()) return

    setSubmittingResponse(true)
    try {
      const response = await fetch(`/api/admin/support-tickets/${selectedTicket.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newResponse }),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Response sent successfully',
        })
        setNewResponse('')
        fetchTickets()
        // Refresh selected ticket
        const ticketResponse = await fetch(`/api/admin/support-tickets/${selectedTicket.id}`)
        if (ticketResponse.ok) {
          const ticketResult = await ticketResponse.json()
          setSelectedTicket(ticketResult.data.ticket)
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send response',
        variant: 'destructive',
      })
    } finally {
      setSubmittingResponse(false)
    }
  }

  return (
    <>
      <HeaderContainer>
        <div>
          <h1 className='text-xl font-bold flex items-center gap-2'>
            <LifeBuoy className='h-6 w-6' />
            Support Tickets
          </h1>
          <p className='text-sm text-muted-foreground'>
            Manage and respond to user support requests
          </p>
        </div>
      </HeaderContainer>

      <div className='flex gap-4'>
        {/* Tickets List */}
        <div className='flex-1 space-y-4'>
          {/* Stats Summary */}
          {loading ? (
            <DashboardSummarySkeleton count={5} />
          ) : stats && (
            <DashboardSummary
              summaries={[
                {
                  title: 'Total Tickets',
                  value: stats.total,
                  description: 'All support tickets',
                  icon: MessageSquare,
                },
                {
                  title: 'Open',
                  value: stats.open,
                  description: 'Needs attention',
                  icon: AlertCircle,
                },
                {
                  title: 'In Progress',
                  value: stats.inProgress,
                  description: 'Being handled',
                  icon: Clock,
                },
                {
                  title: 'Waiting',
                  value: stats.waitingForUser,
                  description: 'Awaiting user response',
                  icon: Send,
                },
                {
                  title: 'Resolved',
                  value: stats.resolved,
                  description: 'Successfully resolved',
                  icon: CheckCircle2,
                },
              ]}
            />
          )}

          {/* Filters */}
          {loading ? <FilterSectionSkeleton /> : (
            <CollapsibleSection title="Filters" icon={Filter}>
              <div className='flex items-center gap-4'>
                <div className='flex-1'>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className='w-full md:w-48'>
                      <SelectValue placeholder='Filter by status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Statuses</SelectItem>
                      <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                      <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={TicketStatus.WAITING_FOR_USER}>Waiting for User</SelectItem>
                      <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                      <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Tickets List */}
          {loading ? (
            <TicketListSkeleton />
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className='pt-6 text-center'>
                <MessageSquare className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-semibold mb-2'>No Tickets Found</h3>
                <p className='text-sm text-muted-foreground'>
                  No support tickets match the current filter.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-2'>
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className='pt-4'>
                    <div className='flex items-start gap-3'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1 flex-wrap'>
                          <h4 className='font-medium truncate'>{ticket.subject}</h4>
                          <Badge className={PRIORITY_COLORS[ticket.priority]}>
                            {PRIORITY_LABELS[ticket.priority]}
                          </Badge>
                          <Badge className={STATUS_COLORS[ticket.status]}>
                            {STATUS_LABELS[ticket.status]}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {ticket.description}
                        </p>
                        <div className='flex items-center gap-3 mt-2 text-xs text-muted-foreground'>
                          <span>{ticket.user?.name || ticket.user?.email || 'Unknown User'}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <MessageSquare className='h-3 w-3' />
                            {ticket._count.responses}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Detail Panel */}
        {selectedTicket && (
          <div className='w-96 border-l'>
            <div className='flex flex-col h-full sticky top-0'>
              <Card className='flex-1 flex flex-col'>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <CardTitle className='text-lg'>{selectedTicket.subject}</CardTitle>
                    <Badge className={PRIORITY_COLORS[selectedTicket.priority]}>
                      {PRIORITY_LABELS[selectedTicket.priority]}
                    </Badge>
                  </div>
                  <CardDescription>
                    {TICKET_CATEGORIES[selectedTicket.category as keyof typeof TICKET_CATEGORIES] || selectedTicket.category}
                  </CardDescription>
                </CardHeader>

                <CardContent className='flex-1 flex flex-col overflow-hidden'>
                  {/* User Info */}
                  <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4'>
                    <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                      <User className='h-5 w-5 text-primary' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-sm truncate'>
                        {selectedTicket.user?.firstName && selectedTicket.user?.lastName
                          ? `${selectedTicket.user.firstName} ${selectedTicket.user.lastName}`
                          : selectedTicket.user?.name || 'Unknown User'}
                      </div>
                      <div className='text-xs text-muted-foreground truncate'>
                        {selectedTicket.user?.email || 'No email'}
                      </div>
                    </div>
                  </div>

                  {/* Status Controls */}
                  <div className='flex items-center gap-2 mb-4'>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value as TicketStatus)}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className='flex-1'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                        <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TicketStatus.WAITING_FOR_USER}>Waiting for User</SelectItem>
                        <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                        <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Messages */}
                  <ScrollArea className='flex-1 mb-4'>
                    <div className='space-y-3 pr-4'>
                      {/* Initial message */}
                      <div className='flex gap-3'>
                        <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0'>
                          <User className='h-4 w-4 text-muted-foreground' />
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <span className='font-medium text-sm'>{selectedTicket.user?.name || 'Unknown User'}</span>
                            <span className='text-xs text-muted-foreground'>
                              {formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className='text-sm bg-muted p-3 rounded-lg'>
                            {selectedTicket.description}
                          </p>
                        </div>
                      </div>

                      {/* Responses */}
                      {selectedTicket.responses.map((response) => (
                        <div
                          key={response.id}
                          className={`flex gap-3 ${response.isFromAdmin ? 'justify-end' : ''}`}
                        >
                          {response.isFromAdmin ? (
                            <>
                              <div className='flex-1 text-right'>
                                <div className='flex items-center gap-2 mb-1 justify-end'>
                                  <span className='text-xs text-muted-foreground'>
                                    {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                                  </span>
                                  <span className='font-medium text-sm'>You</span>
                                </div>
                                <p className='text-sm bg-primary text-primary-foreground p-3 rounded-lg inline-block text-left max-w-full'>
                                  {response.message}
                                </p>
                              </div>
                              <div className='h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0'>
                                <CheckCircle2 className='h-4 w-4 text-primary-foreground' />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0'>
                                <User className='h-4 w-4 text-muted-foreground' />
                              </div>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-1'>
                                  <span className='font-medium text-sm'>{response.sender.name}</span>
                                  <span className='text-xs text-muted-foreground'>
                                    {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className='text-sm bg-muted p-3 rounded-lg'>
                                  {response.message}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Response Input */}
                  {selectedTicket.status !== TicketStatus.CLOSED && (
                    <div className='space-y-2'>
                      <Textarea
                        placeholder='Type your response...'
                        rows={3}
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmitResponse()
                          }
                        }}
                      />
                      <div className='flex gap-2'>
                        <Button
                          onClick={handleSubmitResponse}
                          disabled={submittingResponse || !newResponse.trim()}
                          className='flex-1'
                        >
                          {submittingResponse ? (
                            <>
                              <Clock className='h-4 w-4 mr-2 animate-spin' />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className='h-4 w-4 mr-2' />
                              Send
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Resolution note */}
                  {selectedTicket.resolution && (
                    <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                      <div className='flex items-center gap-2 text-sm font-medium text-green-800 mb-1'>
                        <CheckCircle2 className='h-4 w-4' />
                        Resolution
                      </div>
                      <p className='text-sm text-green-700'>{selectedTicket.resolution}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
