'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ActivityAction, ActivityResourceType } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, Filter, Clock, CheckCircle, XCircle, BookOpen, MessageSquare, ShoppingCart, User, Settings, TrendingUp, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { DashboardSummarySkeleton } from '@/components/dashboard/dashboard-summary-skeleton'
import {
  ActivityPageSkeleton,
  ActivityPageHeaderSkeleton,
  ActivityFilterCardSkeleton,
  ActivityTimelineGroupSkeleton
} from '@/components/activity/activity-skeleton'
import { useAuth } from '@/context/auth-context'
import {HeaderContainer} from "@/components/ui/header-container";

type UserActivity = {
  id: string
  action: ActivityAction
  resourceType: ActivityResourceType
  resourceId: string | null
  resourceName: string | null
  description: string | null
  success: boolean
  createdAt: string
  metadata: any
  endpoint?: string | null
}

export default function UserActivityPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all')

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedAction !== 'all') params.append('action', selectedAction)
      if (selectedResourceType !== 'all') params.append('resourceType', selectedResourceType)

      const response = await fetch(`/api/user/activities?${params}`)
      if (!response.ok) throw new Error('Failed to fetch activities')

      const result = await response.json()
      setActivities(result.data.activities || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [selectedAction, selectedResourceType])

  const getActionIcon = (action: ActivityAction) => {
    if (action === ActivityAction.BOOK_CREATED || action === ActivityAction.BOOK_UPDATED) return <BookOpen className='h-4 w-4' />
    if (action === ActivityAction.MESSAGE_SENT) return <MessageSquare className='h-4 w-4' />
    if (action === ActivityAction.SELL_POST_CREATED || action === ActivityAction.OFFER_CREATED) return <ShoppingCart className='h-4 w-4' />
    if (action === ActivityAction.PROFILE_UPDATED) return <User className='h-4 w-4' />
    if (action === ActivityAction.QUIZ_ATTEMPTED) return <TrendingUp className='h-4 w-4' />
    if (action === ActivityAction.READING_PROGRESS_UPDATED) return <Clock className='h-4 w-4' />
    return <Calendar className='h-4 w-4' />
  }

  const getActionBadgeColor = (action: ActivityAction): string => {
    const createActions = ['BOOK_CREATED', 'AUTHOR_CREATED', 'CATEGORY_CREATED', 'PUBLICATION_CREATED', 'SERIES_CREATED', 'SELL_POST_CREATED', 'OFFER_CREATED', 'MESSAGE_SENT', 'NOTICE_CREATED', 'BOOKSHELF_CREATED', 'REVIEW_POSTED', 'QUIZ_ATTEMPTED']
    const updateActions = ['BOOK_UPDATED', 'AUTHOR_UPDATED', 'CATEGORY_UPDATED', 'PUBLICATION_UPDATED', 'SERIES_UPDATED', 'SELL_POST_UPDATED', 'NOTICE_UPDATED', 'PROFILE_UPDATED', 'READING_PROGRESS_UPDATED']
    const deleteActions = ['BOOK_DELETED', 'AUTHOR_DELETED', 'CATEGORY_DELETED', 'PUBLICATION_DELETED', 'SERIES_DELETED', 'SELL_POST_DELETED']
    const authActions = ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGED', 'ROLE_CHANGED']
    const successActions = ['OFFER_ACCEPTED']
    const failActions = ['OFFER_REJECTED']

    if (createActions.includes(action)) return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
    if (updateActions.includes(action)) return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
    if (deleteActions.includes(action)) return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
    if (authActions.includes(action)) return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
    if (successActions.includes(action)) return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
    if (failActions.includes(action)) return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'

    return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
  }

  const formatActionName = (action: ActivityAction): string => {
    return action.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const formatResourceType = (resourceType: ActivityResourceType): string => {
    return resourceType.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const groupActivitiesByDate = (activities: UserActivity[]) => {
    const groups: Record<string, UserActivity[]> = {}

    activities.forEach(activity => {
      const date = new Date(activity.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let dateKey: string
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday'
      } else {
        dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      }

      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(activity)
    })

    return groups
  }

  const groupedActivities = groupActivitiesByDate(activities)

  const stats = {
    total: activities.length,
    success: activities.filter(a => a.success).length,
    failed: activities.filter(a => !a.success).length,
    thisWeek: activities.filter(a => {
      const date = new Date(a.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return date > weekAgo
    }).length,
  }

  // Calculate success rate percentage
  const successRate = activities.length > 0
    ? Math.round((stats.success / activities.length) * 100)
    : 0

  return (
    <div className='flex flex-col h-full'>
        <HeaderContainer>
            {loading ? (
              <ActivityPageHeaderSkeleton />
            ) : (
              <div>
                  <h1 className='text-2xl font-bold'>Your Activity Timeline</h1>
                  <p className='text-sm text-muted-foreground'>
                      Track your recent activities on the platform
                  </p>
              </div>
            )}
        </HeaderContainer>

      <ScrollArea className='faded-bottom -mx-4 flex-1 scroll-smooth px-4 md:pb-16 h-full'>
        <div className='space-y-6'>
            {/* Stats Cards */}
            {loading ? (
              <DashboardSummarySkeleton count={4} />
            ) : (
              <DashboardSummary
                summaries={[
                  {
                    title: 'Total Activities',
                    value: stats.total.toString(),
                    description: 'All your activities',
                    icon: ({ className }: { className?: string }) => (
                      <Activity className={className} />
                    ),
                  },
                  {
                    title: 'Successful',
                    value: stats.success.toString(),
                    description: `${successRate}% success rate`,
                    icon: ({ className }: { className?: string }) => (
                      <CheckCircle className={className} />
                    ),
                  },
                  {
                    title: 'Failed',
                    value: stats.failed.toString(),
                    description: 'Activities that failed',
                    icon: ({ className }: { className?: string }) => (
                      <XCircle className={className} />
                    ),
                  },
                  {
                    title: 'This Week',
                    value: stats.thisWeek.toString(),
                    description: 'Activities in last 7 days',
                    icon: ({ className }: { className?: string }) => (
                      <TrendingUp className={className} />
                    ),
                  },
                ]}
              />
            )}

        {/* Filters */}
        {loading ? (
          <ActivityFilterCardSkeleton />
        ) : (
          <Card className='p-4'>
            <div className='flex items-center gap-2 mb-4'>
              <Filter className='h-4 w-4 text-muted-foreground' />
              <h3 className='font-semibold'>Filter Activities</h3>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Action Type</label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder='All actions' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Actions</SelectItem>
                    {Object.values(ActivityAction).map((action) => (
                      <SelectItem key={action} value={action}>
                        {formatActionName(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Resource Type</label>
                <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder='All types' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Resource Types</SelectItem>
                    {Object.values(ActivityResourceType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatResourceType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Timeline */}
        {loading ? (
          <>
            <ActivityTimelineGroupSkeleton count={3} />
            <ActivityTimelineGroupSkeleton count={2} />
          </>
        ) : activities.length === 0 ? (
          <Card className='p-12 text-center'>
            <div className='flex flex-col items-center gap-4'>
              <div className='p-4 rounded-full bg-muted'>
                <Calendar className='h-8 w-8 text-muted-foreground' />
              </div>
              <div>
                <h3 className='text-lg font-semibold'>No activities found</h3>
                <p className='text-sm text-muted-foreground'>
                  Your activity timeline will show here once you start using the platform.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className='space-y-6'>
            {Object.entries(groupedActivities).map(([dateLabel, dayActivities]) => (
              <div key={dateLabel}>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='text-lg font-semibold'>{dateLabel}</div>
                  <div className='flex-1 h-px bg-border' />
                </div>

                <div className='space-y-3'>
                  {dayActivities.map((activity) => (
                    <Card key={activity.id} className='p-4 hover:bg-accent/50 transition-colors'>
                      <div className='flex items-start gap-4'>
                        {/* Icon */}
                        <div className={cn(
                          'p-2 rounded-lg',
                          activity.success ? 'bg-green-500/10' : 'bg-red-500/10'
                        )}>
                          <div className={cn(
                            activity.success ? 'text-green-500' : 'text-red-500'
                          )}>
                            {getActionIcon(activity.action)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-4 mb-2'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                <Badge className={cn('font-normal', getActionBadgeColor(activity.action))}>
                                  {formatActionName(activity.action)}
                                </Badge>
                                {activity.resourceName && (
                                  <span className='text-sm font-medium'>
                                    on &quot;{activity.resourceName}&quot;
                                  </span>
                                )}
                              </div>
                              {activity.description && (
                                <p className='text-sm text-muted-foreground'>
                                  {activity.description}
                                </p>
                              )}
                            </div>

                            {/* Status and Time */}
                            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                              <span className='flex items-center gap-1'>
                                {activity.success ? (
                                  <CheckCircle className='h-3 w-3 text-green-500' />
                                ) : (
                                  <XCircle className='h-3 w-3 text-red-500' />
                                )}
                                {activity.success ? 'Success' : 'Failed'}
                              </span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>

                          {/* Resource Type Badge */}
                          <div className='flex items-center gap-2'>
                            <Badge variant='outline' className='text-xs'>
                              {formatResourceType(activity.resourceType)}
                            </Badge>
                            {isAdmin && activity.endpoint && (
                              <span className='text-xs text-muted-foreground font-mono'>
                                {activity.endpoint}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </ScrollArea>
    </div>
  )
}
