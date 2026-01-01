import { HeaderContainer } from '@/components/ui/header-container'
import { LegalContentEditor } from '@/components/legal/legal-content-editor'
import { LegalContentType } from '@prisma/client'

export default function AdminAboutPage() {
  return (
    <HeaderContainer>
      <LegalContentEditor
        type={LegalContentType.ABOUT}
        title="About Us"
        description="Manage the About Us page content. Changes will be visible to all users immediately after saving."
        placeholderTitle="About Book Heaven"
        placeholderContent={`# About Book Heaven

## Our Story

Book Heaven was founded with a simple mission: to make reading accessible, enjoyable, and engaging for everyone. We believe that books have the power to transform lives, spark imagination, and connect people across the globe.

## What We Do

We provide a comprehensive digital library platform where users can:
- **Discover** thousands of books across multiple genres
- **Read** in their preferred format - hard copy, e-book, or audio
- **Engage** with a community of fellow book lovers
- **Track** their reading journey and achievements
- **Share** reviews and recommendations

## Our Mission

To create the world's most reader-friendly platform that celebrates the love of reading and fosters a global community of book enthusiasts.

## Our Values

- **Passion for Reading**: We love books and believe in their power to change lives
- **Community First**: We build features that bring readers together
- **Accessibility**: Reading should be accessible to everyone, everywhere
- **Innovation**: We continuously improve our platform with new features
- **Privacy**: We respect and protect our users' data

## Our Team

We're a diverse team of book lovers, tech enthusiasts, and community builders working together to create the best possible reading experience.

## Contact Us

Have questions, suggestions, or just want to say hello? We'd love to hear from you!

- Email: support@bookheaven.com
- Follow us on social media`}

      />
    </HeaderContainer>
  )
}
