'use client'

import Link from 'next/link'
import { BookOpen, Github, Twitter, Heart } from 'lucide-react'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Book Heaven</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover, read, and share amazing books with our comprehensive book management platform.
            </p>
            <div className="flex items-center space-x-4">
              <Link
                href="https://github.com"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/books" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Browse Books
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Quiz
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help-center" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Book Heaven. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> for book lovers
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
