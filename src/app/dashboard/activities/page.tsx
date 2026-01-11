'use client'

import { useState, useEffect } from 'react'
import { HeaderContainer } from '@/components/ui/header-container'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton, DashboardSummarySkeleton, FilterSectionSkeleton } from '@/components/data-table/table-skeleton'
import { columns } from './components/columns'
import { Activity, activitiesListSchema } from './data/schema'
import { ActivityAction, ActivityResourceType } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Filter, X, Search, Download } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 50,
  })

  // Filter states
  const [search, setSearch] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all')
  const [selectedSuccess, setSelectedSuccess] = useState<string>('all')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [sortBy, setSortBy] = useState<'createdAt' | 'action' | 'resourceName'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })

      if (search) params.append('search', search)
      if (selectedAction !== 'all') params.append('action', selectedAction)
      if (selectedResourceType !== 'all') params.append('resourceType', selectedResourceType)
      if (selectedSuccess !== 'all') params.append('success', selectedSuccess)
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await fetch(`/api/admin/activities?${params}`)
      if (!response.ok) throw new Error('Failed to fetch activities')

      const result = await response.json()
      const validatedActivities = activitiesListSchema.parse(result.data.activities)
      setActivities(validatedActivities)
      setPagination({
        currentPage: result.data.currentPage,
        totalPages: result.data.pages,
        total: result.data.total,
        limit: pagination.limit,
      })
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [pagination.currentPage, sortBy, sortOrder])

  const handleApplyFilters = () => {
    setPagination({ ...pagination, currentPage: 1 })
    fetchActivities()
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedAction('all')
    setSelectedResourceType('all')
    setSelectedSuccess('all')
    setStartDate(undefined)
    setEndDate(undefined)
    setPagination({ ...pagination, currentPage: 1 })
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
      })

      if (search) params.append('search', search)
      if (selectedAction !== 'all') params.append('action', selectedAction)
      if (selectedResourceType !== 'all') params.append('resourceType', selectedResourceType)
      if (selectedSuccess !== 'all') params.append('success', selectedSuccess)
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      // Export all data with higher limit
      params.append('limit', '10000')

      const response = await fetch(`/api/admin/activities?${params}`)
      if (!response.ok) throw new Error('Failed to export activities')

      const result = await response.json()
      const csvContent = convertToCSV(result.data.activities)
      downloadCSV(csvContent, 'activities-export.csv')
    } catch (error) {
      console.error('Error exporting activities:', error)
    }
  }

  const convertToCSV = (data: Activity[]) => {
    const headers = ['Time', 'Action', 'User', 'User Role', 'Resource Type', 'Resource', 'Description', 'Status', 'IP Address', 'Endpoint']
    const rows = data.map(activity => [
      activity.createdAt,
      activity.action,
      activity.user?.email || 'System',
      activity.userRole || '-',
      activity.resourceType,
      activity.resourceName || '-',
      activity.description || '-',
      activity.success ? 'Success' : 'Failed',
      activity.ipAddress || '-',
      activity.endpoint || '-',
    ])
    return [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const activeFiltersCount =
    (search ? 1 : 0) +
    (selectedAction !== 'all' ? 1 : 0) +
    (selectedResourceType !== 'all' ? 1 : 0) +
    (selectedSuccess !== 'all' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0)

  return (
    <>
      <HeaderContainer>
        <div>
          <h1 className='text-xl font-bold'>Activity Logs</h1>
          <p className='text-sm text-muted-foreground'>
            Track all user and system activities across the platform
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {activeFiltersCount > 0 && (
            <Badge variant='secondary' className='gap-1'>
              <Filter className='h-3 w-3' />
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
            </Badge>
          )}
          <Button onClick={handleExport} variant='outline' size='sm'>
            <Download className='mr-2 h-4 w-4' />
            Export CSV
          </Button>
        </div>
      </HeaderContainer>

      <div className='bg-background h-screen overflow-y-auto no-scrollbar pb-4'>
        <div className='space-y-4'>
        {/* Stats */}
        {loading ? (
          <DashboardSummarySkeleton count={4} />
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='rounded-lg border bg-card p-4'>
              <div className='text-sm text-muted-foreground'>Total Activities</div>
              <div className='text-xl font-bold'>{pagination.total.toLocaleString()}</div>
            </div>
            <div className='rounded-lg border bg-card p-4'>
              <div className='text-sm text-muted-foreground'>Current Page</div>
              <div className='text-xl font-bold'>
                {pagination.currentPage} / {pagination.totalPages}
              </div>
            </div>
            <div className='rounded-lg border bg-card p-4'>
              <div className='text-sm text-muted-foreground'>Success Rate</div>
              <div className='text-xl font-bold'>
                {activities.length > 0
                  ? Math.round((activities.filter(a => a.success).length / activities.length) * 100)
                  : 0}%
              </div>
            </div>
            <div className='rounded-lg border bg-card p-4'>
              <div className='text-sm text-muted-foreground'>Filtered Results</div>
              <div className='text-xl font-bold'>{activities.length}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        {loading ? <FilterSectionSkeleton /> : (
        <div className='rounded-lg border bg-card p-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold flex items-center gap-2'>
              <Filter className='h-4 w-4' />
              Filters
            </h3>
            {activeFiltersCount > 0 && (
              <Button onClick={handleClearFilters} variant='ghost' size='sm'>
                <X className='mr-2 h-4 w-4' />
                Clear all
              </Button>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Search */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Search</label>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search activities...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-8'
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Action</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder='Select action' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Actions</SelectItem>
                  {Object.values(ActivityAction).map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resource Type Filter */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Resource Type</label>
              <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {Object.values(ActivityResourceType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Success Filter */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Status</label>
              <Select value={selectedSuccess} onValueChange={setSelectedSuccess}>
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='true'>Success</SelectItem>
                  <SelectItem value='false'>Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Sort By */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Sort By</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='createdAt'>Time</SelectItem>
                  <SelectItem value='action'>Action</SelectItem>
                  <SelectItem value='resourceName'>Resource</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Order</label>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='desc'>Descending</SelectItem>
                  <SelectItem value='asc'>Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='mt-4 flex justify-end'>
            <Button onClick={handleApplyFilters}>
              <Search className='mr-2 h-4 w-4' />
              Apply Filters
            </Button>
          </div>
        </div>
        )}

        {/* Table */}
        <div className='-mx-4 overflow-auto px-4 py-1'>
          {loading ? <TableSkeleton rowCount={pagination.limit} /> : (
            <DataTable
              data={activities as any}
              columns={columns}
            />
          )}
        </div>
        </div>
      </div>
    </>
  )
}
