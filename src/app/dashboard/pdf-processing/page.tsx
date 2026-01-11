'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    FileText,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    Loader2,
    Trash2,
    BookOpen,
    Eye,
    ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface PdfProcessingJob {
    id: string
    bookId: string
    book: {
        id: string
        name: string
        type: string
        image: string | null
        directImageUrl: string | null
    } | null
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
    retryCount: number
    maxRetries: number
    lastAttemptAt: string | null
    nextAttemptAt: string | null
    completedAt: string | null
    failedAt: string | null
    errorMessage: string | null
    downloadStatus: string
    extractionStatus: string
    summaryStatus: string
    questionsStatus: string
    embeddingStatus: string
    pdfUrl: string
    bookName: string
    authorNames: string[]
    pagesExtracted: number | null
    wordsExtracted: number | null
    summaryLength: number | null
    questionsGenerated: number | null
    embeddingsCreated: number | null
    processingTime: number | null
    createdAt: string
    updatedAt: string
}

interface PdfProcessingJobsResponse {
    success: boolean
    message?: string
    data: {
        jobs: PdfProcessingJob[]
        pagination: {
            currentPage: number
            totalPages: number
            total: number
            limit: number
            hasNextPage: boolean
            hasPreviousPage: boolean
        }
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PdfProcessingPage() {
    const { user } = useAuth()
    const [jobs, setJobs] = useState<PdfProcessingJob[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [retryingJobId, setRetryingJobId] = useState<string | null>(null)

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchJobs = async () => {
            if (!isAdmin) return

            setIsLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams()
                params.set('page', currentPage.toString())
                params.set('limit', '20')
                params.set('status', statusFilter)

                const response = await fetch(`/api/admin/pdf-processing?${params.toString()}`)
                const result: PdfProcessingJobsResponse = await response.json()

                if (result.success) {
                    setJobs(result.data.jobs)
                    setTotalPages(result.data.pagination.totalPages)
                    setTotalItems(result.data.pagination.total)
                } else {
                    setError(result.message || 'Failed to fetch jobs')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch jobs')
            } finally {
                setIsLoading(false)
            }
        }

        fetchJobs()
    }, [isAdmin, currentPage, statusFilter])

    const handleRetry = async (jobId: string) => {
        if (!confirm('Are you sure you want to retry this PDF processing job?')) return

        setRetryingJobId(jobId)

        try {
            const response = await fetch('/api/admin/pdf-processing/retry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jobId }),
            })

            if (response.ok) {
                // Refresh the jobs list
                const params = new URLSearchParams()
                params.set('page', currentPage.toString())
                params.set('limit', '20')
                params.set('status', statusFilter)

                const result: PdfProcessingJobsResponse = await (await fetch(`/api/admin/pdf-processing?${params.toString()}`)).json()
                if (result.success) {
                    setJobs(result.data.jobs)
                    setTotalPages(result.data.pagination.totalPages)
                    setTotalItems(result.data.pagination.total)
                }
            } else {
                const error = await response.json()
                alert(`Failed to retry job: ${error.message}`)
            }
        } catch (err) {
            console.error('Failed to retry job:', err)
            alert('Failed to retry job')
        } finally {
            setRetryingJobId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
            case 'PROCESSING':
                return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>
            case 'COMPLETED':
                return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
            case 'FAILED':
                return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>
            case 'RETRYING':
                return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Retrying</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getStepStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="outline" className="text-xs">Pending</Badge>
            case 'IN_PROGRESS':
                return <Badge variant="secondary" className="text-xs">In Progress</Badge>
            case 'COMPLETED':
                return <Badge variant="default" className="bg-green-600 text-xs">Done</Badge>
            case 'FAILED':
                return <Badge variant="destructive" className="text-xs">Failed</Badge>
            case 'SKIPPED':
                return <Badge variant="outline" className="text-xs text-muted-foreground">Skipped</Badge>
            default:
                return <Badge variant="outline" className="text-xs">{status}</Badge>
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">Admin access required</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">PDF Processing Jobs</h1>
                    <p className="text-muted-foreground">
                        Monitor and retry PDF processing jobs
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="status" className="text-sm font-medium">Status:</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Jobs</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                    <SelectItem value="RETRYING">Retrying</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1" />

                        <div className="text-sm text-muted-foreground">
                            {totalItems} job{totalItems !== 1 ? 's' : ''}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Loading */}
            {isLoading && (
                <div className="border rounded-lg divide-y">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div key={index} className="p-4">
                            <div className="flex items-start gap-4">
                                <Skeleton className="h-12 w-12 rounded" />
                                <div className="flex-1 min-w-0 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton key={i} className="h-4 w-20" />
                                        ))}
                                    </div>
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="p-4 text-destructive">
                        {error}
                    </CardContent>
                </Card>
            )}

            {/* Jobs List */}
            {!isLoading && (
                <>
                    <div className="border rounded-lg divide-y">
                        {jobs.map((job) => (
                            <div key={job.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-4">
                                    {/* Book Image */}
                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                        {job.book?.directImageUrl ? (
                                            <img
                                                src={job.book.directImageUrl}
                                                alt={job.book.name}
                                                className="h-12 w-12 rounded object-cover"
                                            />
                                        ) : (
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold">{job.book?.name || job.bookName || 'Unknown Book'}</span>
                                                    {getStatusBadge(job.status)}
                                                    {job.book && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {job.book.type}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Step Status */}
                                                <div className="flex items-center gap-3 text-xs mb-2">
                                                    <span>Download: {getStepStatusBadge(job.downloadStatus)}</span>
                                                    <span>Extract: {getStepStatusBadge(job.extractionStatus)}</span>
                                                    <span>Summary: {getStepStatusBadge(job.summaryStatus)}</span>
                                                    <span>Questions: {getStepStatusBadge(job.questionsStatus)}</span>
                                                    <span>Embeddings: {getStepStatusBadge(job.embeddingStatus)}</span>
                                                </div>

                                                {/* Error Message */}
                                                {job.errorMessage && (
                                                    <div className="text-sm mb-2 p-3 bg-destructive/10 rounded-lg">
                                                        <p className="text-destructive text-sm">{job.errorMessage}</p>
                                                    </div>
                                                )}

                                                {/* Stats */}
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>Retry {job.retryCount}/{job.maxRetries}</span>
                                                    <span>•</span>
                                                    <span>{formatDistanceToNow(new Date(job.createdAt))}</span>
                                                    {job.processingTime && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{Math.round(job.processingTime / 1000)}s</span>
                                                        </>
                                                    )}
                                                    {job.wordsExtracted && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{job.wordsExtracted.toLocaleString()} words</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                {job.book && (
                                                    <Link href={`/dashboard/books/edit/${job.book.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {(job.status === 'FAILED' || job.status === 'COMPLETED') && job.retryCount < job.maxRetries && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRetry(job.id)}
                                                        disabled={retryingJobId === job.id}
                                                    >
                                                        {retryingJobId === job.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="text-sm">
                                Page {currentPage} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
