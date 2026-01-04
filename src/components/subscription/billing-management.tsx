'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, FileText, Download } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentMethod {
  last4: string
  brand: string
  expMonth: number
  expYear: number
}

interface Invoice {
  id: string
  amountPaid: number
  currency: string
  status: string
  created: number
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
}

interface BillingData {
  customerId: string | null
  defaultPaymentMethod: PaymentMethod | null
  invoices: Invoice[]
}

export function BillingManagement() {
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBilling()
  }, [])

  const fetchBilling = async () => {
    try {
      const response = await fetch('/api/stripe/billing')
      const data = await response.json()
      setBilling(data)
    } catch (error) {
      console.error('Error fetching billing data:', error)
      toast.error('Failed to load billing information')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Payment Method Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice History Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  {i > 1 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-28" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!billing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>Payment methods and invoice history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No billing information available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Your default payment method on file</CardDescription>
        </CardHeader>
        <CardContent>
          {billing.defaultPaymentMethod ? (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium capitalize">{billing.defaultPaymentMethod.brand}</p>
                <p className="text-sm text-muted-foreground">
                  •••• •••• •••• {billing.defaultPaymentMethod.last4}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires {billing.defaultPaymentMethod.expMonth}/{billing.defaultPaymentMethod.expYear}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payment method on file.</p>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {billing.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="space-y-4">
              {billing.invoices.map((invoice, index) => (
                <div key={invoice.id}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {new Date(invoice.created * 1000).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {invoice.currency.toUpperCase()} ${(invoice.amountPaid / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {invoice.hostedInvoiceUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                      )}
                      {invoice.invoicePdf && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
