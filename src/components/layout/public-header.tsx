'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BookOpen, Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/books/search-bar'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PublicHeaderProps {
  className?: string
}

export function PublicHeader({ className }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className={cn(
      'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50',
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">Your Book Library</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/books" className="text-sm font-medium hover:text-primary transition-colors">
              Browse Books
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 text-sm font-medium hover:text-primary">
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

            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-6">
            <SearchBar placeholder="Search books, authors, or categories..." />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            <ThemeSwitch />

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/auth/sign-in">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Search */}
              <div className="px-2">
                <SearchBar placeholder="Search books..." />
              </div>

              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-2 px-2">
                <Link href="/books" className="text-sm font-medium hover:text-primary">
                  Browse Books
                </Link>
                <Link href="/books?category=science-fiction" className="text-sm font-medium hover:text-primary">
                  Science Fiction
                </Link>
                <Link href="/books?category=romance" className="text-sm font-medium hover:text-primary">
                  Romance
                </Link>
                <Link href="/books?category=mystery" className="text-sm font-medium hover:text-primary">
                  Mystery
                </Link>
                <Link href="/books?category=biography" className="text-sm font-medium hover:text-primary">
                  Biography
                </Link>
                <Link href="/about" className="text-sm font-medium hover:text-primary">
                  About
                </Link>
              </nav>

              {/* Mobile Auth Buttons */}
              <div className="flex flex-col space-y-2 px-2 pt-2 border-t">
                <Link href="/auth/sign-in">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}