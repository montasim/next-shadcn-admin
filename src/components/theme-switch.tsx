'use client'

import { useEffect, useState } from 'react'
import { IconCheck, IconMoon, IconSun } from '@tabler/icons-react'
import { cn } from '../lib/utils'
import { useTheme } from 'next-themes'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so we can safely set mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  /* Update theme-color meta tag
   * when theme is updated */
  useEffect(() => {
    if (!mounted) return
    const themeColor = theme === 'dark' ? '#020817' : '#fff'
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
  }, [theme, mounted])

  // Prevent hydration mismatch by not rendering theme-dependent UI until mounted
  if (!mounted) {
    return (
      <Button variant='ghost' size='icon' className='h-9 w-9'>
        <span className='sr-only'>Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-9 w-9'>
          <IconSun className='size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <IconMoon className='absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light{' '}
          <IconCheck
            size={14}
            className={cn('ml-auto', theme !== 'light' && 'hidden')}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
          <IconCheck
            size={14}
            className={cn('ml-auto', theme !== 'dark' && 'hidden')}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
          <IconCheck
            size={14}
            className={cn('ml-auto', theme !== 'system' && 'hidden')}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
