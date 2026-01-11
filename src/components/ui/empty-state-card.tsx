import { cn } from '@/lib/utils'
import { FileX, type LucideIcon } from 'lucide-react'

interface EmptyStateCardProps {
  title?: string
  description?: string
  icon?: LucideIcon
  className?: string
}

export function EmptyStateCard({
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  icon: Icon = FileX,
  className,
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center',
        className
      )}
    >
      <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
        <Icon className='h-6 w-6 text-muted-foreground' />
      </div>
      <h3 className='mt-4 text-lg font-semibold'>{title}</h3>
      <p className='mt-2 text-sm text-muted-foreground max-w-sm'>{description}</p>
    </div>
  )
}
