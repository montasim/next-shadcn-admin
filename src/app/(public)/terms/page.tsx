import { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LegalContentType } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Terms of Service - Book Heaven',
  description: 'Terms of Service and conditions for using Book Heaven platform',
}

export default async function TermsPage() {
  let legalContent = null

  try {
    legalContent = await prisma.legalContent.findUnique({
      where: { type: LegalContentType.TERMS_OF_SERVICE },
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
    console.error('Error fetching terms content:', error)
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto p-4 py-8 md:py-12">
        <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Terms of Service
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
            Please read these terms carefully before using our platform. By accessing or using Book Heaven, you agree to be bound by these terms.
          </p>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="pt-6">
            {legalContent?.content ? (
              <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-base prose-p:leading-relaxed prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-strong:text-foreground prose-code:text-sm prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-pre:bg-background prose-li:marker:text-muted-foreground">
                <MDXViewer content={legalContent.content} />
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Content Not Available</h3>
                <p className="text-muted-foreground mb-1">
                  Terms of Service content is not available at this time.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check back later or contact support for more information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        {legalContent?.content && (
          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-medium">Important:</span> By continuing to use Book Heaven, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with these terms, please discontinue use of our platform.
            </p>
          </div>
        )}
        </div>
        </main>
    </div>
  )
}
