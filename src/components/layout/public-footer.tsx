'use client'

import Link from 'next/link'
import { BookOpen, Github, Twitter, Heart, Facebook, Instagram, Linkedin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ROUTES } from '@/lib/routes/client-routes'

interface SocialLinks {
  twitter?: string
  github?: string
  facebook?: string
  instagram?: string
  linkedin?: string
}

export function PublicFooter() {
  const currentYear = new Date().getFullYear()
  const [siteName, setSiteName] = useState('Book Heaven')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})

  useEffect(() => {
    // Fetch site settings from public API
    fetch('/api/public/site/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.data.siteName) setSiteName(data.data.siteName)
          if (data.data.socialTwitter || data.data.socialGithub || data.data.socialFacebook || data.data.socialInstagram || data.data.socialLinkedIn) {
            setSocialLinks({
              twitter: data.data.socialTwitter,
              github: data.data.socialGithub,
              facebook: data.data.socialFacebook,
              instagram: data.data.socialInstagram,
              linkedin: data.data.socialLinkedIn,
            })
          }
        }
      })
      .catch(console.error)
  }, [])

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 pb-32 md:pb-12 [padding-bottom:calc(6rem+env(safe-area-inset-bottom))] md:[padding-bottom:3rem]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">{siteName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover, read, and share amazing books with our comprehensive book management platform.
            </p>
            <div className="flex items-center space-x-4">
              {socialLinks.github && (
                <Link
                  href={socialLinks.github}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-5 w-5" />
                </Link>
              )}
              {socialLinks.twitter && (
                <Link
                  href={socialLinks.twitter}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
              )}
              {socialLinks.facebook && (
                <Link
                  href={socialLinks.facebook}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
              )}
              {socialLinks.instagram && (
                <Link
                  href={socialLinks.instagram}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
              )}
              {socialLinks.linkedin && (
                <Link
                  href={socialLinks.linkedin}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link href={ROUTES.books.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Browse Books
                </Link>
              </li>
              <li>
                <Link href={ROUTES.categories.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href={ROUTES.marketplace.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href={ROUTES.quiz.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
                <Link href={ROUTES.helpCenter.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href={ROUTES.about.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={ROUTES.contact.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
                <Link href={ROUTES.terms.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href={ROUTES.privacy.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {siteName}. All rights reserved.
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
