# Breadcrumb System

A global breadcrumb management system for Next.js applications that automatically generates breadcrumbs based on the current route.

## Features

- 🗺️ **Automatic breadcrumb generation** based on URL structure
- 🎯 **Centralized route configuration** with names, icons, and paths
- 🔗 **Dynamic route support** (e.g., `/books/[id]`)
- 🎨 **Customizable icons** from Lucide React
- 📱 **Responsive design** with mobile-friendly display
- 🔄 **Parent-child relationships** for complex navigation hierarchies

## Installation

The breadcrumb system is already set up in this project. The components and configuration are located at:

- `src/lib/breadcrumb/routes.config.tsx` - Route definitions
- `src/components/breadcrumb/breadcrumb.tsx` - Breadcrumb components
- `src/hooks/use-breadcrumb.ts` - Custom hooks

## Usage

### 1. Automatic Integration

The breadcrumb is automatically integrated into the following layouts:

- Dashboard (`/dashboard/*`)
- Settings (`/settings/*`)
- User Library (`/library/*`)

### 2. Adding New Routes

To add a new route to the breadcrumb system, edit `src/lib/breadcrumb/routes.config.tsx`:

```tsx
import { YourIcon } from 'lucide-react'

export const breadcrumbRoutes: BreadcrumbRoute[] = [
  // ... existing routes

  {
    path: '/your-new-route',
    name: 'Your Route Name',
    icon: YourIcon,
    parent: '/', // Parent route path
  },

  // Dynamic route example
  {
    path: '/your-route/[id]',
    name: 'Dynamic Item',
    icon: YourIcon,
    parent: '/your-route',
  },
]
```

### 3. Route Properties

Each route in the configuration has the following properties:

```tsx
interface BreadcrumbRoute {
  path: string           // The route path (use [param] for dynamic routes)
  name: string           // Display name for the breadcrumb
  icon?: LucideIcon      // Icon component from lucide-react (optional)
  hidden?: boolean       // If true, route won't appear in breadcrumbs
  parent?: string        // Parent route path (optional, auto-detected if omitted)
}
```

### 4. Component Usage

#### Automatic Breadcrumb (Recommended)

The `<Breadcrumb />` component automatically detects the current route and displays the appropriate breadcrumb trail:

```tsx
import { Breadcrumb } from '@/components/breadcrumb'

export default function YourPage() {
  return (
    <div>
      <Breadcrumb />
      {/* Your page content */}
    </div>
  )
}
```

#### Manual Breadcrumb List

For custom control, use the `<BreadcrumbList />` component:

```tsx
import { BreadcrumbList } from '@/components/breadcrumb'
import { Home, Settings } from 'lucide-react'

export default function YourPage() {
  const items = [
    { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
    { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
    { label: 'Current Page' }, // No href = current page
  ]

  return <BreadcrumbList items={items} />
}
```

### 5. Hook Usage

#### `useBreadcrumb()`

Get the breadcrumb trail for the current pathname:

```tsx
import { useBreadcrumb } from '@/hooks/use-breadcrumb'

export default function YourComponent() {
  const { breadcrumbTrail, currentRoute, pathname } = useBreadcrumb()

  return (
    <div>
      {breadcrumbTrail.map((item) => (
        <span key={item.path}>
          {item.name} {item.isCurrent && '(current)'}
        </span>
      ))}
    </div>
  )
}
```

#### `useCurrentRoute()`

Get information about the current route:

```tsx
import { useCurrentRoute } from '@/hooks/use-breadcrumb'

export default function YourComponent() {
  const currentRoute = useCurrentRoute()

  if (!currentRoute) return null

  return (
    <div>
      <h1>{currentRoute.name}</h1>
      {currentRoute.icon && <currentRoute.icon />}
    </div>
  )
}
```

#### `useRouteMatch()`

Check if the current pathname matches a specific route:

```tsx
import { useRouteMatch } from '@/hooks/use-breadcrumb'

export default function YourComponent() {
  const isDashboard = useRouteMatch('/dashboard')

  return isDashboard ? <DashboardNav /> : <RegularNav />
}
```

## Examples

### Simple Route

```tsx
{
  path: '/books',
  name: 'Browse Books',
  icon: BookOpen,
  parent: '/',
}
```

**Result:** `Home > Browse Books`

### Dynamic Route

```tsx
{
  path: '/books/[id]',
  name: 'Book Details',
  icon: BookOpen,
  parent: '/books',
}
```

**Result:** `Home > Browse Books > Book Details #a1b2c3d4`

### Nested Route

```tsx
{
  path: '/library',
  name: 'My Library',
  icon: Library,
  parent: '/',
},
{
  path: '/library/bookshelves',
  name: 'My Bookshelves',
  icon: BookMarked,
  parent: '/library',
}
```

**Result:** `Home > My Library > My Bookshelves`

## Customization

### Hide Routes from Breadcrumbs

To prevent a route from appearing in breadcrumbs:

```tsx
{
  path: '/admin/secret',
  name: 'Secret Admin',
  hidden: true, // Won't appear in breadcrumbs
}
```

### Custom Separator

Change the breadcrumb separator:

```tsx
<Breadcrumb separator="/" />
```

### Disable Home Icon

```tsx
<Breadcrumb includeHome={false} />
```

### Custom Styling

The breadcrumb component accepts a `className` prop for custom styling:

```tsx
<Breadcrumb className="text-lg font-semibold" />
```

## Available Icons

All icons from `lucide-react` are available. Some commonly used icons:

- `Home` - Home page
- `BookOpen` - Books, reading
- `Users` - Users, authors
- `Settings` - Settings page
- `Library` - Library
- `Dashboard` - Dashboard
- `FolderTree` - Categories
- `FileText` - Documents, publications
- `Sparkles` - Premium, features
- `Brain` - Quiz, AI features
- `Bell` - Notifications
- `Palette` - Appearance, themes
- `Monitor` - Display settings
- `User` - User profile
- `CreditCard` - Account, billing
- `Inbox` - Requests
- `Upload` - Uploads
- `BookMarked` - Bookshelves
- `Trophy` - Leaderboard
- `MessageSquare` - Chat, messages
- `BarChart3` - Analytics, stats

## Tips

1. **Dynamic Routes:** Always define dynamic routes before static routes to ensure proper matching
2. **Parent Links:** Explicitly define `parent` for complex hierarchies, but the system can auto-dect simple parent-child relationships
3. **Icons:** Use icons consistently across the application for better UX
4. **Route Names:** Keep names short and descriptive (2-3 words max)
5. **Testing:** Always test breadcrumbs on nested and dynamic routes

## Troubleshooting

### Breadcrumbs not showing?

1. Check if the route is defined in `routes.config.tsx`
2. Verify the route path matches exactly (including leading slashes)
3. Check if `hidden: true` is set on the route

### Dynamic routes not working?

1. Ensure the dynamic segment is in brackets: `[id]`, `[slug]`, etc.
2. Verify the number of segments matches the actual URL
3. Check the parent route is properly defined

### Icons not displaying?

1. Ensure the icon is imported from `lucide-react`
2. Check the icon component is properly referenced (not a string)

## Future Enhancements

Potential improvements to consider:

- Localized route names (i18n)
- Custom breadcrumb item components
- Breadcrumb state persistence
- Animated breadcrumb transitions
- Accessibility improvements (ARIA labels)
- Schema.org structured data integration
