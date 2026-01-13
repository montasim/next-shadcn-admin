# CollapsibleSection Component

A reusable component for mobile-responsive collapsible sections with automatic expand/collapse behavior on mobile devices.

## Features

- ✅ Collapses by default on mobile (< 768px)
- ✅ Always expanded on desktop (≥ 768px)
- ✅ Smooth transition animations
- ✅ Toggle button visible only on mobile
- ✅ Supports header actions (buttons, badges, etc.)
- ✅ Built-in mobile detection with resize listener
- ✅ Loading state support

## Usage

### Basic Usage

```tsx
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Filter } from 'lucide-react'

function MyPage() {
  return (
    <CollapsibleSection title="Filters" icon={Filter}>
      <div className="flex items-center gap-4">
        {/* Your filter content here */}
      </div>
    </CollapsibleSection>
  )
}
```

### With Header Actions

```tsx
<CollapsibleSection
  title="Filters"
  icon={Filter}
  headerActions={
    <>
      <Button variant="ghost" size="sm" onClick={handleClear}>
        Clear all
      </Button>
    </>
  }
>
  {/* Content */}
</CollapsibleSection>
```

### With Loading State

```tsx
import { FilterSectionSkeleton } from '@/components/data-table/table-skeleton'

<CollapsibleSection
  title="Filters"
  icon={Filter}
  loading={isLoading}
  loadingSkeleton={<FilterSectionSkeleton />}
>
  {/* Content */}
</CollapsibleSection>
```

### Default Expanded

```tsx
<CollapsibleSection
  title="Filters"
  icon={Filter}
  defaultExpanded={true}
>
  {/* Content */}
</CollapsibleSection>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | *required* | Section title |
| `icon` | `LucideIcon` | - | Icon to display in the header |
| `children` | `ReactNode` | *required* | Section content |
| `className` | `string` | - | Additional container classes |
| `loading` | `boolean` | `false` | Shows loadingSkeleton when true |
| `loadingSkeleton` | `ReactNode` | - | Custom loading skeleton |
| `headerActions` | `ReactNode` | - | Additional header actions |
| `defaultExpanded` | `boolean` | `false` | Initial expanded state |

## Migration from Manual Implementation

### Before (Manual):

```tsx
const [isMobile, setIsMobile] = useState(false)
const [filtersExpanded, setFiltersExpanded] = useState(false)

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768)
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
  return () => window.removeEventListener('resize', checkMobile)
}, [])

return (
  <div className='rounded-lg border bg-card'>
    <div className='flex items-center justify-between p-4'>
      <h3 className="font-semibold flex items-center gap-2">
        <Filter className='h-4 w-4' />
        Filters
      </h3>
      <Button onClick={() => setFiltersExpanded(!filtersExpanded)} className="md:hidden">
        {filtersExpanded ? <ChevronUp /> : <ChevronDown />}
      </Button>
    </div>
    <div className={cn(!isMobile || filtersExpanded ? 'block' : 'hidden')}>
      {/* Content */}
    </div>
  </div>
)
```

### After (With CollapsibleSection):

```tsx
<CollapsibleSection title="Filters" icon={Filter}>
  {/* Content */}
</CollapsibleSection>
```

## Examples in the Codebase

- `/dashboard/book-requests/page.tsx` - Simple filter section
- Can be added to other pages like activities, loans, etc.

## Responsive Behavior

- **Mobile (< 768px)**: Collapsed by default, shows chevron toggle button
- **Desktop (≥ 768px)**: Always expanded, no toggle button visible
- Automatically handles window resize
