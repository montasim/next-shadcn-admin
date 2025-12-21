'use client'

import { useMemo, useState } from 'react'
import * as React from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Badge } from './badge'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface MultiSelectProps {
  options: {
    label: string
    value: string
  }[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  emptyText?: string
  className?: string
  maxVisible?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  emptyText = 'No options found.',
  className,
  maxVisible = 3,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedLabels = useMemo(() => {
    return selected
      .map(value => options.find(option => option.value === value)?.label)
      .filter(Boolean)
  }, [selected, options])

  const handleUnselect = (value: string) => {
    onChange(selected.filter(item => item !== value))
  }

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      handleUnselect(value)
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-full justify-between text-left font-normal min-h-[42px]',
            !selected.length && 'text-muted-foreground',
            className
          )}
        >
          <div className='flex flex-wrap gap-1 overflow-hidden'>
            {selected.length > 0 ? (
              <>
                {selectedLabels.slice(0, maxVisible).map((label, index) => (
                  <Badge
                    key={selected[index]}
                    variant='secondary'
                    className='mr-1 mb-1'
                  >
                    {label}
                    <button
                      className='ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUnselect(selected[index])
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={() => handleUnselect(selected[index])}
                    >
                      <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
                    </button>
                  </Badge>
                ))}
                {selectedLabels.length > maxVisible && (
                  <Badge variant='secondary' className='mr-1 mb-1'>
                    +{selectedLabels.length - maxVisible} more
                  </Badge>
                )}
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <div className='flex items-center'>
            <Check className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search options...' />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                className='flex cursor-pointer items-center gap-2'
              >
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selected.includes(option.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )}
                >
                  <Check className='h-4 w-4' />
                </div>
                <span>{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}