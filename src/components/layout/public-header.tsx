'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { UserTopbar } from './user-topbar'

interface PublicHeaderProps {
  className?: string
}

export function PublicHeader({ className }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className={cn(
      'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50',
      className
    )}>
      <div className="container mx-auto">
        <UserTopbar
          showMobileMenu={true}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={toggleMobileMenu}
        />

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t px-2 py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-2 px-2">
                <Link href="/books" className="text-sm font-medium hover:text-primary">
                  Browse Books
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-auto p-0 text-sm font-medium hover:text-primary justify-start">
                      Categories
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/books?category=science-fiction" className="w-full cursor-pointer">
                        <div>
                          <div className="font-medium">Science Fiction</div>
                          <p className="text-xs text-muted-foreground">Futuristic worlds and technology</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/books?category=romance" className="w-full cursor-pointer">
                        <div>
                          <div className="font-medium">Romance</div>
                          <p className="text-xs text-muted-foreground">Love stories and relationships</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/books?category=mystery" className="w-full cursor-pointer">
                        <div>
                          <div className="font-medium">Mystery</div>
                          <p className="text-xs text-muted-foreground">Thrilling mysteries and detective stories</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/books?category=biography" className="w-full cursor-pointer">
                        <div>
                          <div className="font-medium">Biography</div>
                          <p className="text-xs text-muted-foreground">Real life stories and memoirs</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/books" className="w-full cursor-pointer font-medium">
                        View All Categories
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link href="/about" className="text-sm font-medium hover:text-primary">
                  About
                </Link>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}