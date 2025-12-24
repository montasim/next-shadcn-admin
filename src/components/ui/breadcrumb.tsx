import * as React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentProps<'nav'> & { separator?: React.ReactNode }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = 'Breadcrumb'

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentProps<'ol'>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = 'BreadcrumbList'

const BreadcrumbItem = React.forwardRef<
  HTMLElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('inline-flex items-center gap-1.5', className)}
    {...props}
  />
))
BreadcrumbItem.displayName = 'BreadcrumbItem'

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<'a'> & {
    icon?: React.ReactNode
  }
>(({ className, icon, children, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1.5 transition-colors hover:text-foreground',
      className
    )}
    {...props}
  >
    {icon && <span className="inline-flex">{icon}</span>}
    {children}
  </a>
))
BreadcrumbLink.displayName = 'BreadcrumbLink'

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<'span'> & { icon?: React.ReactNode }
>(({ className, icon, children, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn('inline-flex items-center gap-1.5 font-normal text-foreground', className)}
    {...props}
  >
    {icon && <span className="inline-flex">{icon}</span>}
    {children}
  </span>
))
BreadcrumbPage.displayName = 'BreadcrumbPage'

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<'li'>) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:size-3.5 [&>svg]:shrink-0', className)}
    {...props}
  >
    {children ?? <ChevronRight className="h-4 w-4" />}
  </li>
)
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <span className="flex gap-1">
      <span className="h-1 w-1 rounded-full bg-foreground/50" />
      <span className="h-1 w-1 rounded-full bg-foreground/50" />
      <span className="h-1 w-1 rounded-full bg-foreground/50" />
    </span>
  </span>
)
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis'

export interface BreadcrumbItemType {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface NavigationBreadcrumbProps {
  items: BreadcrumbItemType[]
  className?: string
}

export function NavigationBreadcrumb({ items, className }: NavigationBreadcrumbProps) {
  const shouldHideLabel = (index: number) => {
    // Hide label for first 2 items if there are more than 2 items total
    return items.length > 2 && index < 2
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink href={item.href} icon={item.icon}>
                  {shouldHideLabel(index) ? '' : item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage icon={item.icon}>
                  {shouldHideLabel(index) ? '' : item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
