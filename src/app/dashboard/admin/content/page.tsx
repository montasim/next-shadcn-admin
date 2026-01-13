'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Crown, HelpCircle, Plus, Trash2, Save, Pencil, GripVertical, AlertTriangle, ChevronDown, ChevronUp, FileText, ChevronDown as ExpandIcon, ChevronUp as CollapseIcon, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { Skeleton } from '@/components/ui/skeleton'
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
import { ROUTES } from '@/lib/routes/client-routes'
import { cn } from '@/lib/utils'

// Pricing Types
interface PricingFeature {
  text: string
  included: boolean
  order: number
}

interface PricingTier {
  id: string
  plan: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  popular: boolean
  stripeMonthlyPriceId: string | null
  stripeYearlyPriceId: string | null
  isActive: boolean
  order: number
  features: PricingFeature[]
}

// FAQ Types
interface FAQ {
  id?: string
  question: string
  answer: string
  category: string
  isActive: boolean
  order: number
}

function AdminContentPageWrapper() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'pricing'
  // Pricing State
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [pricingLoading, setPricingLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editedTiers, setEditedTiers] = useState<PricingTier[]>([])

  // FAQ State
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [faqLoading, setFaqLoading] = useState(true)

  // Dialog State
  const [pricingSeedDialogOpen, setPricingSeedDialogOpen] = useState(false)
  const [faqSeedDialogOpen, setFaqSeedDialogOpen] = useState(false)

  // Expand/Collapse State
  const [expandedPricingCards, setExpandedPricingCards] = useState<Set<string>>(new Set())
  const [expandedFaqCards, setExpandedFaqCards] = useState<Set<number>>(new Set())

  const togglePricingCard = (plan: string) => {
    setExpandedPricingCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(plan)) {
        newSet.delete(plan)
      } else {
        newSet.add(plan)
      }
      return newSet
    })
  }

  const togglePricingAll = () => {
    if (expandedPricingCards.size === editedTiers.length) {
      setExpandedPricingCards(new Set())
    } else {
      setExpandedPricingCards(new Set(editedTiers.map(t => t.plan)))
    }
  }

  const toggleFaqCard = (index: number) => {
    setExpandedFaqCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const toggleFaqAll = () => {
    if (expandedFaqCards.size === faqs.length) {
      setExpandedFaqCards(new Set())
    } else {
      setExpandedFaqCards(new Set(Array.from({ length: faqs.length }, (_, i) => i)))
    }
  }

  useEffect(() => {
    fetchPricingTiers()
    fetchFAQs()
  }, [])

  // Pricing Functions
  const fetchPricingTiers = async () => {
    setPricingLoading(true)
    try {
      const response = await fetch('/api/admin/pricing?includeInactive=true')
      const result = await response.json()
      if (result.success) {
        setTiers(result.data)
        setEditedTiers(JSON.parse(JSON.stringify(result.data)))
      }
    } catch (error) {
      toast.error('Failed to fetch pricing tiers')
    } finally {
      setPricingLoading(false)
    }
  }

  const handleSavePricing = async (plan: string) => {
    setSaving(true)
    try {
      const tier = editedTiers.find((t) => t.plan === plan)
      if (!tier) return

      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tier),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Pricing tier saved successfully')
        setEditingPlan(null)
        fetchPricingTiers()
      } else {
        toast.error(result.message || 'Failed to save pricing tier')
      }
    } catch (error) {
      toast.error('Failed to save pricing tier')
    } finally {
      setSaving(false)
    }
  }

  const handleSeedPricing = async () => {
    try {
      const response = await fetch('/api/admin/pricing/seed', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        toast.success('Pricing tiers seeded successfully')
        fetchPricingTiers()
      } else {
        toast.error(result.message || 'Failed to seed pricing tiers')
      }
    } catch (error) {
      toast.error('Failed to seed pricing tiers')
    } finally {
      setPricingSeedDialogOpen(false)
    }
  }

  const updateTier = (plan: string, updates: Partial<PricingTier>) => {
    setEditedTiers((prev) =>
      prev.map((tier) => (tier.plan === plan ? { ...tier, ...updates } : tier))
    )
  }

  const updateFeature = (plan: string, featureIndex: number, updates: Partial<PricingFeature>) => {
    setEditedTiers((prev) =>
      prev.map((tier) => {
        if (tier.plan === plan) {
          const newFeatures = [...tier.features]
          newFeatures[featureIndex] = { ...newFeatures[featureIndex], ...updates }
          return { ...tier, features: newFeatures }
        }
        return tier
      })
    )
  }

  const addFeature = (plan: string) => {
    setEditedTiers((prev) =>
      prev.map((tier) => {
        if (tier.plan === plan) {
          const newFeature: PricingFeature = {
            text: '',
            included: true,
            order: tier.features.length,
          }
          return { ...tier, features: [...tier.features, newFeature] }
        }
        return tier
      })
    )
  }

  const removeFeature = (plan: string, featureIndex: number) => {
    setEditedTiers((prev) =>
      prev.map((tier) => {
        if (tier.plan === plan) {
          const newFeatures = tier.features.filter((_, i) => i !== featureIndex)
          return { ...tier, features: newFeatures }
        }
        return tier
      })
    )
  }

  // FAQ Functions
  const fetchFAQs = async () => {
    setFaqLoading(true)
    try {
      const response = await fetch('/api/admin/faq?includeInactive=true')
      const result = await response.json()
      if (result.success) {
        setFaqs(result.data)
      }
    } catch (error) {
      toast.error('Failed to fetch FAQs')
    } finally {
      setFaqLoading(false)
    }
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
      setFaqSeedDialogOpen(false)
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
    const newFaqs = faqs.filter((_, i) => i !== index)
    newFaqs.forEach((faq, i) => (faq.order = i))
    setFaqs(newFaqs)
  }

  const updateFAQ = (index: number, updates: Partial<FAQ>) => {
    const newFaqs = [...faqs]
    newFaqs[index] = { ...newFaqs[index], ...updates }
    setFaqs(newFaqs)
  }

  const moveFAQ = (index: number, direction: 'up' | 'down') => {
    const newFaqs = [...faqs]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newFaqs.length) return

    ;[newFaqs[index], newFaqs[newIndex]] = [newFaqs[newIndex], newFaqs[index]]
    newFaqs.forEach((faq, i) => (faq.order = i))
    setFaqs(newFaqs)
  }

  return (
    <DashboardPage
      icon={FileText}
      title="Pricing Page Content"
      description="Manage pricing tiers, features, and FAQ content"
      actions={
        activeTab === 'pricing' ? (
          <DashboardPageHeaderActions
            actions={[
              {
                label: expandedPricingCards.size === editedTiers.length ? 'Collapse All' : 'Expand All',
                icon: expandedPricingCards.size === editedTiers.length ? CollapseIcon : ExpandIcon,
                onClick: togglePricingAll,
                variant: 'outline',
              },
              {
                label: 'Seed Pricing',
                icon: Sprout,
                onClick: () => setPricingSeedDialogOpen(true),
                variant: 'outline',
              },
            ]}
          />
        ) : activeTab === 'faq' ? (
          <DashboardPageHeaderActions
            actions={[
              {
                label: expandedFaqCards.size === faqs.length ? 'Collapse All' : 'Expand All',
                icon: expandedFaqCards.size === faqs.length ? CollapseIcon : ExpandIcon,
                onClick: toggleFaqAll,
                variant: 'outline',
              },
              {
                label: 'Seed FAQ',
                onClick: () => setFaqSeedDialogOpen(true),
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
        ) : null
      }
    >
      <Tabs value={activeTab} className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <TabsList>
          <Link href={`${ROUTES.dashboardAdminContent.href}?tab=pricing`}>
            <TabsTrigger value="pricing">Pricing Tiers</TabsTrigger>
          </Link>
          <Link href={`${ROUTES.dashboardAdminContent.href}?tab=faq`}>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </Link>
        </TabsList>
      </div>

        {/* Pricing Tiers Tab */}
        <TabsContent value="pricing" className="space-y-4">

          {pricingLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...Array(8)].map((_, j) => (
                        <div key={j} className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <div className="space-y-2">
                        {[...Array(3)].map((_, k) => (
                          <div key={k} className="flex items-center gap-2">
                            <Skeleton className="h-6 w-12" />
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-20" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : editedTiers.length === 0 ? (
            <EmptyStateCard
              icon={FileText}
              title="No pricing tiers found"
              description="There are no pricing tiers in the system yet. Click 'Seed Pricing' to add initial data."
            />
          ) : (
            editedTiers.map((tier) => (
              <Card key={tier.plan}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => togglePricingCard(tier.plan)}
                      >
                        {expandedPricingCards.has(tier.plan) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <div>
                        <CardTitle>{tier.name}</CardTitle>
                        <CardDescription>{tier.plan}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingPlan === tier.plan ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSavePricing(tier.plan)}
                            disabled={saving}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPlan(null)
                              setEditedTiers(JSON.parse(JSON.stringify(tiers)))
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPlan(tier.plan)
                            if (!expandedPricingCards.has(tier.plan)) {
                              setExpandedPricingCards(prev => new Set([...prev, tier.plan]))
                            }
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {expandedPricingCards.has(tier.plan) && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={tier.name}
                        onChange={(e) => updateTier(tier.plan, { name: e.target.value })}
                        disabled={editingPlan !== tier.plan}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={tier.description}
                        onChange={(e) => updateTier(tier.plan, { description: e.target.value })}
                        disabled={editingPlan !== tier.plan}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Price (cents)</Label>
                      <Input
                        type="number"
                        value={tier.monthlyPrice}
                        onChange={(e) => updateTier(tier.plan, { monthlyPrice: parseInt(e.target.value) || 0 })}
                        disabled={editingPlan !== tier.plan}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Yearly Price (cents)</Label>
                      <Input
                        type="number"
                        value={tier.yearlyPrice}
                        onChange={(e) => updateTier(tier.plan, { yearlyPrice: parseInt(e.target.value) || 0 })}
                        disabled={editingPlan !== tier.plan}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stripe Monthly Price ID</Label>
                      <Input
                        value={tier.stripeMonthlyPriceId || ''}
                        onChange={(e) => updateTier(tier.plan, { stripeMonthlyPriceId: e.target.value })}
                        disabled={editingPlan !== tier.plan}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stripe Yearly Price ID</Label>
                      <Input
                        value={tier.stripeYearlyPriceId || ''}
                        onChange={(e) => updateTier(tier.plan, { stripeYearlyPriceId: e.target.value })}
                        disabled={editingPlan !== tier.plan}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Order</Label>
                      <Input
                        type="number"
                        value={tier.order}
                        onChange={(e) => updateTier(tier.plan, { order: parseInt(e.target.value) || 0 })}
                        disabled={editingPlan !== tier.plan}
                      />
                    </div>
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={tier.popular}
                          onCheckedChange={(checked) => updateTier(tier.plan, { popular: checked })}
                          disabled={editingPlan !== tier.plan}
                        />
                        <Label>Popular</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={tier.isActive}
                          onCheckedChange={(checked) => updateTier(tier.plan, { isActive: checked })}
                          disabled={editingPlan !== tier.plan}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Features</Label>
                      {editingPlan === tier.plan && (
                        <Button size="sm" variant="outline" onClick={() => addFeature(tier.plan)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Feature
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Switch
                            checked={feature.included}
                            onCheckedChange={(checked) => updateFeature(tier.plan, index, { included: checked })}
                            disabled={editingPlan !== tier.plan}
                          />
                          <Input
                            value={feature.text}
                            onChange={(e) => updateFeature(tier.plan, index, { text: e.target.value })}
                            disabled={editingPlan !== tier.plan}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={feature.order}
                            onChange={(e) => updateFeature(tier.plan, index, { order: parseInt(e.target.value) || 0 })}
                            disabled={editingPlan !== tier.plan}
                            className="w-20"
                          />
                          {editingPlan === tier.plan && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFeature(tier.plan, index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          {faqLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-10 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : faqs.length === 0 ? (
            <EmptyStateCard
              icon={FileText}
              title="No FAQs found"
              description="There are no FAQs in the system yet. Click 'Seed FAQ' to add initial data or 'Add FAQ' to create one manually."
            />
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={faq.id || index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleFaqCard(index)}
                        >
                          {expandedFaqCards.has(index) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                        <CardDescription>#{index + 1}</CardDescription>
                        <span className="text-sm font-medium">{faq.question || 'Untitled FAQ'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveFAQ(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveFAQ(index, 'down')}
                          disabled={index === faqs.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFAQ(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {expandedFaqCards.has(index) && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={faq.category}
                        onChange={(e) => updateFAQ(index, { category: e.target.value })}
                        placeholder="e.g., pricing, account, reading, technical"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) => updateFAQ(index, { question: e.target.value })}
                        placeholder="Enter question..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Answer</Label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => updateFAQ(index, { answer: e.target.value })}
                        placeholder="Enter answer..."
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={faq.isActive}
                          onCheckedChange={(checked) => updateFAQ(index, { isActive: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Order</Label>
                        <Input
                          type="number"
                          value={faq.order}
                          onChange={(e) => updateFAQ(index, { order: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pricing Seed Confirmation Dialog */}
      <AlertDialog open={pricingSeedDialogOpen} onOpenChange={setPricingSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed Pricing Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will seed initial pricing tier data. This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeedPricing}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* FAQ Seed Confirmation Dialog */}
      <AlertDialog open={faqSeedDialogOpen} onOpenChange={setFaqSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed FAQ Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will seed initial FAQ data. This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeedFAQs}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </DashboardPage>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function AdminContentPage() {
  return (
    <Suspense fallback={
      <DashboardPage
        icon={FileText}
        title="Pricing Page Content"
        description="Manage pricing tiers, features, and FAQ content for the pricing page"
      >
        <Skeleton className="h-64 w-full" />
      </DashboardPage>
    }>
      <AdminContentPageWrapper />
    </Suspense>
  )
}
