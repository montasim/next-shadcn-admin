'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SupportTicket, TicketPriority, TicketStatus } from '@prisma/client'
import { LifeBuoy, Search, Plus, ChevronDown, ChevronRight, MessageSquare, Send, CheckCircle2, XCircle, Clock, AlertCircle, User } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { FAQTabSkeleton, TicketsTabSkeleton } from '@/components/help-center/help-center-skeleton'
import { ROUTES } from '@/lib/routes/client-routes'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
  views: number
  helpfulCount: number
  notHelpfulCount: number
}

interface UserTicket extends SupportTicket {
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
}

const FAQ_CATEGORIES = {
  pricing: 'Pricing & Plans',
  account: 'Account & Settings',
  reading: 'Reading & Library',
  technical: 'Technical Support',
  general: 'General',
} as const

const TICKET_CATEGORIES = {
  technical: 'Technical Issue',
  billing: 'Billing & Payment',
  feature: 'Feature Request',
  bug: 'Bug Report',
  other: 'Other',
} as const

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_USER: 'Waiting for You',
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

function HelpCenterPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'faq'

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loadingFaqs, setLoadingFaqs] = useState(true)

  // Tickets state
  const [tickets, setTickets] = useState<UserTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'technical' as keyof typeof TICKET_CATEGORIES,
    priority: 'MEDIUM' as TicketPriority,
  })
  const [submittingTicket, setSubmittingTicket] = useState(false)

  // Fetch FAQs
  useEffect(() => {
    async function fetchFaqs() {
      setLoadingFaqs(true)
      try {
        const response = await fetch('/api/public/faqs')
        if (response.ok) {
          const result = await response.json()
          setFaqs(result.data.faqs || [])
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error)
      } finally {
        setLoadingFaqs(false)
      }
    }
    fetchFaqs()
  }, [])

  // Fetch user tickets
  useEffect(() => {
    if (!user) return
    async function fetchTickets() {
      setLoadingTickets(true)
      try {
        const response = await fetch('/api/user/support-tickets')
        if (response.ok) {
          const result = await response.json()
          setTickets(result.data.tickets || [])
        }
      } catch (error) {
        console.error('Error fetching tickets:', error)
      } finally {
        setLoadingTickets(false)
      }
    }
    fetchTickets()
  }, [user])

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group FAQs by category
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = []
    acc[faq.category].push(faq)
    return acc
  }, {} as Record<string, FAQ[]>)

  // Handle FAQ feedback
  const handleFaqFeedback = async (faqId: string, helpful: boolean) => {
    try {
      const response = await fetch(`/api/public/faqs/${faqId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      })
      if (response.ok) {
        setFaqs(prev => prev.map(faq =>
          faq.id === faqId
            ? {
                ...faq,
                helpfulCount: helpful ? faq.helpfulCount + 1 : faq.helpfulCount,
                notHelpfulCount: helpful ? faq.notHelpfulCount : faq.notHelpfulCount + 1,
              }
            : faq
        ))
        toast({
          title: 'Thank you!',
          description: helpful ? 'Glad this was helpful!' : 'We\'ll work on improving this answer.',
        })
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  // Submit new ticket
  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    setSubmittingTicket(true)
    try {
      const response = await fetch('/api/user/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Ticket Created',
          description: 'Your support ticket has been submitted. We\'ll get back to you soon.',
        })
        setNewTicket({ subject: '', description: '', category: 'technical', priority: 'MEDIUM' })
        router.push(`${ROUTES.helpCenter.href}?tab=tickets`)
        // Refresh tickets
        const ticketsResponse = await fetch('/api/user/support-tickets')
        if (ticketsResponse.ok) {
          const ticketsResult = await ticketsResponse.json()
          setTickets(ticketsResult.data.tickets || [])
        }
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to create ticket.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create ticket. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingTicket(false)
    }
  }

  // Render sign-in required card for protected tabs
  const renderSignInRequired = () => (
    <Card>
      <CardContent className='py-12 text-center'>
        <LifeBuoy className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
        <h3 className='text-lg font-semibold mb-2'>Sign In Required</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Please sign in to access this feature.
        </p>
        <Button asChild>
          <a href={ROUTES.signIn.href}>Sign In</a>
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className='min-h-screen'>
      <main className='container mx-auto p-4 py-8 md:py-12'>
        {/* Header */}
        <div className='mb-8 space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10'>
                <LifeBuoy className='h-6 w-6 text-primary' />
              </div>
              <div>
                <h1 className='text-xl font-bold tracking-tight sm:text-3xl'>Help Center</h1>
                <p className='text-sm text-muted-foreground mt-1'>
                  {user ? 'Find answers or get support from our team' : 'Browse our FAQs or sign in to get personalized support'}
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} className="space-y-4" onValueChange={(value) => router.push(`${ROUTES.helpCenter.href}?tab=${value}`)}>
            {/* Tabs List with Filter Toolbar - Side by Side */}
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <TabsList>
            <Link href={`${ROUTES.helpCenter.href}?tab=faq`}>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </Link>
            {user && (
              <Link href={`${ROUTES.helpCenter.href}?tab=tickets`}>
                <TabsTrigger value="tickets">
                  My Tickets
                  {tickets.some(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_FOR_USER') && (
                    <Badge variant='destructive' className='ml-2 h-5 px-1.5 text-xs'>
                      {tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_FOR_USER').length}
                    </Badge>
                  )}
                </TabsTrigger>
              </Link>
            )}
            {!user && (
              <Link href={`${ROUTES.helpCenter.href}?tab=tickets`}>
                <TabsTrigger value="tickets">My Tickets</TabsTrigger>
              </Link>
            )}
          </TabsList>

          {/* Right side: Create Ticket button and Filter Toolbar */}
          <div className="flex items-center gap-2">
            {user && activeTab !== 'new' && (
              <Button onClick={() => router.push(`${ROUTES.helpCenter.href}?tab=new`)}>

                <Plus className='h-4 w-4 mr-2' />
                Create Ticket
              </Button>
            )}
            {activeTab === 'faq' && (
              <div className="flex items-center gap-2">
                <Input
                    placeholder='Search FAQs...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-9'
                />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className='w-40'>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
                </div>
              )}
            </div>
          </div>

        <ScrollArea className='flex-1 pb-4'>
          <div className='space-y-4'>
            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className='space-y-4'>
                {loadingFaqs ? (
                  <FAQTabSkeleton cardCount={3} />
                ) : filteredFaqs.length === 0 ? (
                  <Card>
                    <CardContent className='pt-6'>
                      <div className='py-16 text-center'>
                        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
                          <Search className='h-8 w-8 text-muted-foreground' />
                        </div>
                        <h3 className='text-lg font-semibold mb-2'>No FAQs Found</h3>
                        <p className='text-sm text-muted-foreground'>
                          Try adjusting your search or filter to find what you&lsquo;re looking for.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className='text-lg'>{FAQ_CATEGORIES[category as keyof typeof FAQ_CATEGORIES] || category}</CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-2'>
                        {categoryFaqs.map((faq) => (
                          <div key={faq.id} className='border rounded-lg overflow-hidden'>
                            <button
                              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                              className='w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors'
                            >
                              <span className='font-medium flex-1 pr-4'>{faq.question}</span>
                              {expandedFaq === faq.id ? (
                                <ChevronDown className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                              ) : (
                                <ChevronRight className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                              )}
                            </button>
                            {expandedFaq === faq.id && (
                              <div className='p-4 pt-0 border-t'>
                                <p className='text-muted-foreground mb-4'>{faq.answer}</p>
                                <div className='flex items-center gap-4 text-sm'>
                                  <span className='text-muted-foreground'>Was this helpful?</span>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleFaqFeedback(faq.id, true)}
                                    className='h-7'
                                  >
                                    <CheckCircle2 className='h-4 w-4 mr-1' />
                                    Yes ({faq.helpfulCount})
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleFaqFeedback(faq.id, false)}
                                    className='h-7'
                                  >
                                    <XCircle className='h-4 w-4 mr-1' />
                                    No ({faq.notHelpfulCount})
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* My Tickets Tab */}
            {activeTab === 'tickets' && (
              <div className='space-y-4'>
                {!user ? (
                  renderSignInRequired()
                ) : loadingTickets ? (
                  <TicketsTabSkeleton itemCount={3} />
                ) : tickets.length === 0 ? (
                  <Card>
                    <CardContent className='pt-6'>
                      <div className='py-16 text-center'>
                        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
                          <MessageSquare className='h-8 w-8 text-muted-foreground' />
                        </div>
                        <h3 className='text-lg font-semibold mb-2'>No Support Tickets</h3>
                        <p className='text-sm text-muted-foreground mb-4'>
                          You haven&lsquo;t created any support tickets yet.
                        </p>
                        <Button onClick={() => router.push(`${ROUTES.helpCenter.href}?tab=new`)}>
                          <Plus className='h-4 w-4 mr-2' />
                          Create Your First Ticket
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  tickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardHeader>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <CardTitle className='text-lg'>{ticket.subject}</CardTitle>
                            <CardDescription className='mt-1'>
                              {ticket.description}
                            </CardDescription>
                          </div>
                          <Badge className={STATUS_COLORS[ticket.status]}>
                            {STATUS_LABELS[ticket.status]}
                          </Badge>
                        </div>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <Badge variant='outline'>{TICKET_CATEGORIES[ticket.category as keyof typeof TICKET_CATEGORIES]}</Badge>
                          <span>•</span>
                          <span>{PRIORITY_LABELS[ticket.priority]} Priority</span>
                          <span>•</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardHeader>
                      {ticket.responses.length > 0 && (
                        <CardContent>
                          <div className='space-y-3'>
                            {ticket.responses.map((response) => (
                              <div
                                key={response.id}
                                className={`flex gap-3 ${response.isFromAdmin ? 'bg-muted/50 p-3 rounded-lg' : ''}`}
                              >
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  response.isFromAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                }`}>
                                  {response.isFromAdmin ? (
                                    <AlertCircle className='h-4 w-4' />
                                  ) : (
                                    <User className='h-4 w-4' />
                                  )}
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className='flex items-center gap-2'>
                                    <span className='font-medium text-sm'>
                                      {response.isFromAdmin ? 'Support Team' : 'You'}
                                    </span>
                                    <span className='text-xs text-muted-foreground'>
                                      {new Date(response.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className='text-sm mt-1'>{response.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* New Ticket Tab */}
            {activeTab === 'new' && (
              !user ? (
                renderSignInRequired()
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Create Support Ticket</CardTitle>
                    <CardDescription>
                      Fill out the form below and our support team will get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Category</label>
                      <Select
                        value={newTicket.category}
                        onValueChange={(value) => setNewTicket({ ...newTicket, category: value as keyof typeof TICKET_CATEGORIES })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TICKET_CATEGORIES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Priority</label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as TicketPriority })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TicketPriority.LOW}>{PRIORITY_LABELS[TicketPriority.LOW]}</SelectItem>
                          <SelectItem value={TicketPriority.MEDIUM}>{PRIORITY_LABELS[TicketPriority.MEDIUM]}</SelectItem>
                          <SelectItem value={TicketPriority.HIGH}>{PRIORITY_LABELS[TicketPriority.HIGH]}</SelectItem>
                          <SelectItem value={TicketPriority.URGENT}>{PRIORITY_LABELS[TicketPriority.URGENT]}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Subject *</label>
                      <Input
                        placeholder='Brief description of your issue'
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      />
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Description *</label>
                      <Textarea
                        placeholder='Please provide as much detail as possible about your issue...'
                        rows={6}
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      />
                    </div>

                    <Button onClick={handleSubmitTicket} disabled={submittingTicket} className='w-full'>
                      {submittingTicket ? (
                        <>
                          <Clock className='h-4 w-4 mr-2 animate-spin' />
                          Submitting...
                        </>
                      ) : (
                        <>
                        <Send className='h-4 w-4 mr-2' />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              )
            )}
          </div>
        </ScrollArea>
      </Tabs>
      </main>
    </div>
  )
}

// Wrapper component with Suspense boundary for useSearchParams
function HelpCenterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <HelpCenterPageContent />
    </Suspense>
  )
}

export default HelpCenterPage
