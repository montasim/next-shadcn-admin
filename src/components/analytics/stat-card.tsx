import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon | ((props: { className?: string }) => ReactNode)
  description?: string
  className?: string
  /** Optional additional content to render below the description (e.g., progress bars, charts) */
  additionalContent?: ReactNode
}

export function StatCard({ title, value, icon: Icon, description, className, additionalContent }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {additionalContent && (
          <div className="mt-2">{additionalContent}</div>
        )}
      </CardContent>
    </Card>
  )
}
