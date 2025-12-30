'use client'

import { useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ResetIcon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { cn } from '@/lib/utils'

interface BookshelfFilterToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  visibility: string[]
  onVisibilityChange: (value: string[]) => void
  progressStatus: string[]
  onProgressStatusChange: (value: string[]) => void
  bookCount: string[]
  onBookCountChange: (value: string[]) => void
  onReset: () => void
  bookshelfCount: number
}

const visibilityOptions = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
]

const progressStatusOptions = [
  { label: "Not Started", value: "not-started" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
]

const bookCountOptions = [
  { label: "Empty", value: "empty" },
  { label: "1-5 books", value: "small" },
  { label: "6-10 books", value: "medium" },
  { label: "10+ books", value: "large" },
]

interface FacetedFilterProps {
  title: string
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (value: string[]) => void
}

function FacetedFilter({ title, options, selected, onChange }: FacetedFilterProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const handleSelect = useCallback((value: string) => {
    const newSelected = new Set(selectedSet)
    if (newSelected.has(value)) {
      newSelected.delete(value)
    } else {
      newSelected.add(value)
    }
    onChange(Array.from(newSelected))
  }, [selectedSet, onChange])

  const handleClear = useCallback(() => {
    onChange([])
  }, [onChange])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 border-dashed'>
          <PlusCircledIcon className='mr-2 h-4 w-4' />
          {title}
          {selected?.length > 0 && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge
                variant='secondary'
                className='rounded-sm px-1 font-normal lg:hidden'
              >
                {selected.length}
              </Badge>
              <div className='hidden space-x-1 lg:flex'>
                {selected.length > 2 ? (
                  <Badge
                    variant='secondary'
                    className='rounded-sm px-1 font-normal'
                  >
                    {selected.length} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedSet.has(option.value))
                    .map((option) => (
                      <Badge
                        variant='secondary'
                        key={option.value}
                        className='rounded-sm px-1 font-normal'
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <Command>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className='justify-center text-center'
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function BookshelfFilterToolbar({
  searchValue,
  onSearchChange,
  visibility,
  onVisibilityChange,
  progressStatus,
  onProgressStatusChange,
  bookCount,
  onBookCountChange,
  onReset,
  bookshelfCount,
}: BookshelfFilterToolbarProps) {
  const activeFilters = useMemo(() => [
    visibility.length > 0,
    progressStatus.length > 0,
    bookCount.length > 0,
  ].filter(Boolean).length, [visibility.length, progressStatus.length, bookCount.length])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <Input
          placeholder="Search bookshelves..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full sm:w-[200px] md:w-[250px]"
        />

        {/* Visibility Filter */}
        <FacetedFilter
          title="Visibility"
          options={visibilityOptions}
          selected={visibility}
          onChange={onVisibilityChange}
        />

        {/* Progress Status Filter */}
        <FacetedFilter
          title="Progress"
          options={progressStatusOptions}
          selected={progressStatus}
          onChange={onProgressStatusChange}
        />

        {/* Book Count Filter */}
        <FacetedFilter
          title="Book Count"
          options={bookCountOptions}
          selected={bookCount}
          onChange={onBookCountChange}
        />

        {/* Reset Button */}
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={onReset}
          >
            <ResetIcon className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Bookshelf Count Badge */}
      <div className="text-sm text-muted-foreground sm:hidden">
        {bookshelfCount} {bookshelfCount === 1 ? 'bookshelf' : 'bookshelves'}
      </div>
    </div>
  )
}
