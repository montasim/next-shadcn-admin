'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, Save, GripVertical, Search, Filter, ArrowUpDown, ChevronDown, ChevronRight, HelpCircle, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { DashboardSummarySkeleton } from '@/components/data-table/table-skeleton'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
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
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyStateCard } from '@/components/ui/empty-state-card'

interface FAQ {
  id?: string
  question: string
  answer: string
  category: string
  isActive: boolean
  order: number
}

const FAQ_CATEGORIES = {
  pricing: 'Pricing & Plans',
  account: 'Account & Settings',
  reading: 'Reading & Library',
  technical: 'Technical Support',
  general: 'General',
} as const

function HelpCenterFAQsPageWrapper() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get('category') || 'all'

  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCategory, setFilteredCategory] = useState(categoryFilter)
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set())

  // Dialog state
  const [seedDialogOpen, setSeedDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null)

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/faq?includeInactive=true')
      const result = await response.json()
      if (result.success) {
        setFaqs(result.data)
      } else {
        toast.error('Failed to fetch FAQs')
      }
    } catch (error) {
      toast.error('Failed to fetch FAQs')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedFAQs = async () => {
    try {
      const response = await fetch('/api/admin/faq/seed', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        toast.success('FAQs seeded successfully')
        fetchFAQs()
      } else {
        toast.error(result.message || 'Failed to seed FAQs')
      }
    } catch (error) {
      toast.error('Failed to seed FAQs')
    } finally {
      setSeedDialogOpen(false)
    }
  }

  const addFAQ = () => {
    const newFAQ: FAQ = {
      question: '',
      answer: '',
      category: 'general',
      isActive: true,
      order: faqs.length,
    }
    setFaqs([...faqs, newFAQ])
  }

  const removeFAQ = (index: number) => {
    setFaqToDelete(index)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (faqToDelete === null) return

    const newFaqs = faqs.filter((_, i) => i !== faqToDelete)
    newFaqs.forEach((faq, i) => (faq.order = i))
    setFaqs(newFaqs)
    setDeleteDialogOpen(false)
    setFaqToDelete(null)
    toast.success('FAQ removed')
  }

  const updateFAQ = (index: number, updates: Partial<FAQ>) => {
    const newFaqs = [...faqs]
    newFaqs[index] = { ...newFaqs[index], ...updates }
    setFaqs(newFaqs)
  }

  const moveFAQ = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= faqs.length) return

    const newFaqs = [...faqs]
    ;[newFaqs[index], newFaqs[newIndex]] = [newFaqs[newIndex], newFaqs[index]]
    newFaqs.forEach((faq, i) => (faq.order = i))
    setFaqs(newFaqs)
  }

  const handleSaveFAQs = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqs),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('FAQs saved successfully')
        fetchFAQs()
      } else {
        toast.error(result.message || 'Failed to save FAQs')
      }
    } catch (error) {
      toast.error('Failed to save FAQs')
    } finally {
      setSaving(false)
    }
  }

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filteredCategory === 'all' || faq.category === filteredCategory
    return matchesSearch && matchesCategory
  })

  // Group FAQs by category
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = []
    acc[faq.category].push(faq)
    return acc
  }, {} as Record<string, FAQ[]>)

  const activeCount = faqs.filter(f => f.isActive).length
  const inactiveCount = faqs.length - activeCount

  const toggleFAQExpand = (index: number) => {
    setExpandedFaqs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <DashboardPage
      icon={HelpCircle}
      title="Help Center FAQs"
      description="Manage help center frequently asked questions"
      actions={
        <DashboardPageHeaderActions
          actions={[
            {
              label: 'Seed Initial Data',
              icon: Sprout,
              onClick: () => setSeedDialogOpen(true),
              variant: 'outline',
            },
            {
              label: 'Add FAQ',
              icon: Plus,
              onClick: addFAQ,
              variant: 'outline',
            },
            {
              label: 'Save All',
              icon: Save,
              onClick: handleSaveFAQs,
              disabled: saving,
              loading: saving,
            },
          ]}
        />
      }
    >
      {/* Stats Cards */}
      <DashboardSummary
        summaries={[
          {
            title: 'Total FAQs',
            value: faqs.length.toString(),
            description: `${activeCount} active, ${inactiveCount} inactive`,
          },
          {
            title: 'Active',
            value: activeCount.toString(),
            description: `${faqs.length > 0 ? ((activeCount / faqs.length) * 100).toFixed(0) : 0}% of total`,
          },
          {
            title: 'Inactive',
            value: inactiveCount.toString(),
            description: `${faqs.length > 0 ? ((inactiveCount / faqs.length) * 100).toFixed(0) : 0}% of total`,
          },
        ]}
      />

      {/* Filters */}
      <CollapsibleSection title="Filters" icon={Filter}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={filteredCategory} onValueChange={setFilteredCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleSection>

      {/* FAQ List */}
      {loading ? (
        <>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="mb-4">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </>
      ) : filteredFaqs.length === 0 ? (
        <EmptyStateCard
          icon={HelpCircle}
          title="No FAQs found"
          description={searchQuery || filteredCategory !== 'all'
            ? 'Try adjusting your search or filter to find what you\'re looking for.'
            : 'Get started by adding FAQs or seeding initial data.'}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {FAQ_CATEGORIES[category as keyof typeof FAQ_CATEGORIES] || category}
                  </CardTitle>
                  <Badge variant="outline">{categoryFaqs.length} FAQs</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryFaqs.map((faq, index) => {
                  const globalIndex = faqs.findIndex(f => f.id === faq.id || (f.question === faq.question && f.answer === faq.answer))
                  const isExpanded = expandedFaqs.has(globalIndex)
                  return (
                    <div key={faq.id || index} className="border rounded-lg overflow-hidden">
                      {/* Collapsed Header - Always Visible */}
                      <div
                        className="p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleFAQExpand(globalIndex)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-move flex-shrink-0" onClick={(e) => e.stopPropagation()} />
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {faq.question || <span className="text-muted-foreground italic">No question</span>}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {FAQ_CATEGORIES[faq.category as keyof typeof FAQ_CATEGORIES] || faq.category}
                                </Badge>
                                <Badge variant={faq.isActive ? 'default' : 'secondary'} className="text-xs">
                                  {faq.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveFAQ(globalIndex, 'up')}
                              disabled={globalIndex === 0}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFAQ(globalIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content - Visible when expanded */}
                      {isExpanded && (
                        <div className="p-4 space-y-4 border-t">
                          <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                  value={faq.category}
                                  onValueChange={(value) => updateFAQ(globalIndex, { category: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-end space-x-2">
                                <Switch
                                  checked={faq.isActive}
                                  onCheckedChange={(checked) => updateFAQ(globalIndex, { isActive: checked })}
                                />
                                <Label className="mb-2">Active</Label>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Question</Label>
                              <Input
                                value={faq.question}
                                onChange={(e) => updateFAQ(globalIndex, { question: e.target.value })}
                                placeholder="Enter question..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Answer</Label>
                              <Textarea
                                value={faq.answer}
                                onChange={(e) => updateFAQ(globalIndex, { answer: e.target.value })}
                                placeholder="Enter answer..."
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Seed Confirmation Dialog */}
      <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed FAQ Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will seed initial FAQ data for the help center. This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeedFAQs}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </DashboardPage>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function HelpCenterFAQsPage() {
  return (
    <Suspense fallback={
      <DashboardPage
        icon={HelpCircle}
        title="Help Center FAQs"
        description="Manage frequently asked questions for the help center"
      >
        <div className="space-y-4">
          {/* Stats Cards Skeleton */}
          <DashboardSummarySkeleton count={3} />

          {/* Filters Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-16" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-48" />
              </div>
            </CardContent>
          </Card>

          {/* FAQ List Skeleton */}
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="mb-4">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardPage>
    }>
      <HelpCenterFAQsPageWrapper />
    </Suspense>
  )
}
