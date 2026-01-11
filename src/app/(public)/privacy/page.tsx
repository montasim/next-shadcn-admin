import { Metadata } from 'next'
import { Shield } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LegalContentType } from '@prisma/client'
import { getSiteName } from '@/lib/utils/site-settings'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName()
  return {
    title: `Privacy Policy - ${siteName}`,
    description: `Privacy Policy and how ${siteName} handles your data`,
  }
}

export default async function PrivacyPage() {
  const siteName = await getSiteName()
  let legalContent = null

  try {
    legalContent = await prisma.legalContent.findUnique({
      where: { type: LegalContentType.PRIVACY_POLICY },
      include: {
        lastUpdatedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching privacy content:', error)
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto p-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                Privacy Policy
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {legalContent?.effectiveDate && (
                  <Badge variant="outline" className="text-xs">
                    Effective: {new Date(legalContent.effectiveDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Badge>
                )}
                {legalContent?.updatedAt && (
                  <span className="text-xs text-muted-foreground">
                    Last updated: {new Date(legalContent.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-muted-foreground">
            Your privacy is important to us. This policy explains how we collect, use, disclose, and safeguard your information when you use {siteName}.
          </p>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="pt-6">
            {legalContent?.content ? (
              <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-md prose-p:text-base prose-p:leading-relaxed prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-strong:text-foreground prose-code:text-sm prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-pre:bg-background prose-li:marker:text-muted-foreground">
                <MDXViewer content={legalContent.content} />
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Content Not Available</h3>
                <p className="text-muted-foreground mb-1">
                  Privacy Policy content is not available at this time.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check back later or contact support for more information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Section */}
        {legalContent?.content && (
          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-medium">Questions about your privacy?</span> If you have any questions or concerns about this Privacy Policy or our data practices, please contact our support team. We will respond to your inquiries within 30 days.
            </p>
          </div>
        )}
        </main>
    </div>
  )
}
