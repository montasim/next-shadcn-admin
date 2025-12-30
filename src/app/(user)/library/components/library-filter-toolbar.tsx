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
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { cn } from '@/lib/utils'

interface LibraryFilterToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  readingStatus: string[]
  onReadingStatusChange: (value: string[]) => void
  authors: string[]
  selectedAuthors: string[]
  onAuthorsChange: (value: string[]) => void
  onReset: () => void
  bookCount: number
}

const readingStatusOptions = [
  { label: "Not Started", value: "not-started" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
]

interface FacetedFilterProps {
  title: string
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (value: string[]) => void
  showSearch?: boolean
}

function FacetedFilter({ title, options, selected, onChange, showSearch }: FacetedFilterProps) {
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
          {showSearch && <CommandInput placeholder={title} />}
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

export function LibraryFilterToolbar({
  searchValue,
  onSearchChange,
  readingStatus,
  onReadingStatusChange,
  authors,
  selectedAuthors,
  onAuthorsChange,
  onReset,
  bookCount,
}: LibraryFilterToolbarProps) {
  const activeFilters = useMemo(() => [
    readingStatus.length > 0,
    selectedAuthors.length > 0,
  ].filter(Boolean).length, [readingStatus.length, selectedAuthors.length])

  const authorOptions = useMemo(() =>
    authors.map(a => ({ label: a, value: a })),
    [authors]
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <Input
          placeholder="Search books..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full sm:w-[200px] md:w-[250px]"
        />

        {/* Reading Status Filter */}
        <FacetedFilter
          title="Status"
          options={readingStatusOptions}
          selected={readingStatus}
          onChange={onReadingStatusChange}
        />

        {/* Authors Filter */}
        {authors.length > 0 && (
          <FacetedFilter
            title="Authors"
            options={authorOptions}
            selected={selectedAuthors}
            onChange={onAuthorsChange}
            showSearch
          />
        )}

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

      {/* Book Count Badge */}
      <div className="text-sm text-muted-foreground sm:hidden">
        {bookCount} {bookCount === 1 ? 'book' : 'books'}
      </div>
    </div>
  )
}
