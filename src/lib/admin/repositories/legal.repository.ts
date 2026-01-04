import { prisma } from '@/lib/prisma'
import { LegalContent, LegalContentType } from '@prisma/client'

/**
 * Get all legal content
 */
export async function getAllLegalContent(): Promise<LegalContent[]> {
  return await prisma.legalContent.findMany({
    orderBy: { type: 'asc' },
    include: {
      lastUpdatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Get legal content by type
 */
export async function getLegalContentByType(type: LegalContentType): Promise<LegalContent | null> {
  return await prisma.legalContent.findUnique({
    where: { type },
    include: {
      lastUpdatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Get public legal content (no user info)
 */
export async function getPublicLegalContent(type: LegalContentType): Promise<{ title: string; content: string; effectiveDate: Date } | null> {
  const content = await prisma.legalContent.findUnique({
    where: { type },
    select: {
      title: true,
      content: true,
      effectiveDate: true,
    },
  })
  return content
}

/**
 * Create or update legal content
 */
export async function upsertLegalContent(
  type: LegalContentType,
  title: string,
  content: string,
  userId: string
): Promise<LegalContent> {
  return await prisma.legalContent.upsert({
    where: { type },
    create: {
      type,
      title,
      content,
      lastUpdatedById: userId,
    },
    update: {
      title,
      content,
      lastUpdatedById: userId,
    },
  })
}

/**
 * Delete legal content
 */
export async function deleteLegalContent(type: LegalContentType): Promise<void> {
  await prisma.legalContent.delete({
    where: { type },
  })
}

/**
 * Seed a single legal content type
 */
export async function seedLegalContentByType(type: LegalContentType, userId: string): Promise<LegalContent> {
  const contentMap = {
    PRIVACY_POLICY: {
      title: 'Privacy Policy',
      content: `# Privacy Policy

Last Updated: ${new Date().toLocaleDateString()}

## 1. Information We Collect

We collect information you provide directly to us, including:
- Account information (name, email, password)
- Profile information
- Usage data
- Preferences

## 2. How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Process transactions
- Send you technical notices and support messages
- Communicate about products, services, and events

## 3. Information Sharing

We do not sell your personal information. We may share your information only as described in this policy.

## 4. Data Security

We implement appropriate technical and organizational measures to protect your personal information.

## 5. Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Request deletion of your personal information
- Opt-out of marketing communications

## 6. Contact Us

If you have questions about this policy, please contact us.`,
    },
    TERMS_OF_SERVICE: {
      title: 'Terms of Service',
      content: `# Terms of Service

Last Updated: ${new Date().toLocaleDateString()}

## 1. Acceptance of Terms

By accessing and using this service, you accept and agree to be bound by these terms.

## 2. User Accounts

You are responsible for:
- Maintaining the confidentiality of your account
- All activities that occur under your account
- Restricting access to your account

## 3. Subscription Plans

We offer various subscription plans with different features and pricing. You agree to pay all charges incurred under your account.

## 4. Content and Intellectual Property

All content on this platform is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without permission.

## 5. User Conduct

You agree not to:
- Use the service for any illegal purpose
- Violate any laws in your jurisdiction
- Infringe on the rights of others

## 6. Termination

We reserve the right to terminate or suspend access to our service immediately.

## 7. Limitation of Liability

Our liability is limited to the maximum extent permitted by law.

## 8. Changes to Terms

We reserve the right to modify these terms at any time.`,
    },
    ABOUT: {
      title: 'About Us',
      content: `# About Our Platform

Welcome to our digital library platform!

## Our Mission

We're dedicated to providing access to knowledge and fostering a community of readers, learners, and book lovers.

## What We Offer

- **Extensive Library**: Access to thousands of digital books across various genres
- **Reading Tools**: Features designed to enhance your reading experience
- **Community**: Connect with fellow readers and share your love for books
- **Personalized Recommendations**: Discover your next favorite read

## Our Story

Founded with a passion for reading, we've built a platform that brings the joy of reading to everyone, anywhere, anytime.

## Contact Us

Have questions or feedback? We'd love to hear from you.`,
    },
    DISCLAIMER: {
      title: 'Disclaimer',
      content: `# Disclaimer

The information provided on this platform is for general informational purposes only.

## Accuracy of Information

While we strive to keep information accurate and up-to-date, we make no representations about the completeness or accuracy of any information.

## Professional Advice

The content on this platform does not constitute professional advice. You should not rely solely on the information provided.

## Availability

We do not guarantee that the platform will be available at all times or that the service will be uninterrupted.

## Changes

We reserve the right to modify, suspend, or discontinue any aspect of the platform at any time.`,
    },
    COOKIE_POLICY: {
      title: 'Cookie Policy',
      content: `# Cookie Policy

Last Updated: ${new Date().toLocaleDateString()}

## What Are Cookies

Cookies are small text files that are placed on your device when you visit our platform.

## How We Use Cookies

We use cookies to:
- Remember your preferences
- Understand how you use our platform
- Improve our services
- Provide personalized content

## Types of Cookies We Use

1. **Essential Cookies**: Required for the platform to function
2. **Analytics Cookies**: Help us understand user behavior
3. **Preference Cookies**: Remember your settings
4. **Marketing Cookies**: Track campaigns

## Your Choices

You can:
- Accept all cookies
- Reject non-essential cookies
- Manage cookie settings through your browser

## Third-Party Cookies

We may allow trusted third parties to place cookies on your device for analytics and marketing purposes.

## Updates

We may update this policy from time to time. Please check back regularly.`,
    },
  }

  const content = contentMap[type]
  if (!content) {
    throw new Error(`Unknown legal content type: ${type}`)
  }

  return await prisma.legalContent.upsert({
    where: { type },
    create: {
      type,
      title: content.title,
      content: content.content,
      lastUpdatedById: userId,
    },
    update: {
      title: content.title,
      content: content.content,
      lastUpdatedById: userId,
    },
  })
}

/**
 * Seed initial legal content
 */
export async function seedLegalContent(userId: string): Promise<LegalContent[]> {
  const initialContent = [
    {
      type: LegalContentType.PRIVACY_POLICY,
      title: 'Privacy Policy',
      content: `# Privacy Policy

Last Updated: ${new Date().toLocaleDateString()}

## 1. Information We Collect

We collect information you provide directly to us, including:
- Account information (name, email, password)
- Profile information
- Usage data
- Preferences

## 2. How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Process transactions
- Send you technical notices and support messages
- Communicate about products, services, and events

## 3. Information Sharing

We do not sell your personal information. We may share your information only as described in this policy.

## 4. Data Security

We implement appropriate technical and organizational measures to protect your personal information.

## 5. Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Request deletion of your personal information
- Opt-out of marketing communications

## 6. Contact Us

If you have questions about this policy, please contact us.`,
    },
    {
      type: LegalContentType.TERMS_OF_SERVICE,
      title: 'Terms of Service',
      content: `# Terms of Service

Last Updated: ${new Date().toLocaleDateString()}

## 1. Acceptance of Terms

By accessing and using this service, you accept and agree to be bound by these terms.

## 2. User Accounts

You are responsible for:
- Maintaining the confidentiality of your account
- All activities that occur under your account
- Restricting access to your account

## 3. Subscription Plans

We offer various subscription plans with different features and pricing. You agree to pay all charges incurred under your account.

## 4. Content and Intellectual Property

All content on this platform is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without permission.

## 5. User Conduct

You agree not to:
- Use the service for any illegal purpose
- Violate any laws in your jurisdiction
- Infringe on the rights of others

## 6. Termination

We reserve the right to terminate or suspend access to our service immediately.

## 7. Limitation of Liability

Our liability is limited to the maximum extent permitted by law.

## 8. Changes to Terms

We reserve the right to modify these terms at any time.`,
    },
    {
      type: LegalContentType.ABOUT,
      title: 'About Us',
      content: `# About Our Platform

Welcome to our digital library platform!

## Our Mission

We're dedicated to providing access to knowledge and fostering a community of readers, learners, and book lovers.

## What We Offer

- **Extensive Library**: Access to thousands of digital books across various genres
- **Reading Tools**: Features designed to enhance your reading experience
- **Community**: Connect with fellow readers and share your love for books
- **Personalized Recommendations**: Discover your next favorite read

## Our Story

Founded with a passion for reading, we've built a platform that brings the joy of reading to everyone, anywhere, anytime.

## Contact Us

Have questions or feedback? We'd love to hear from you.`,
    },
    {
      type: LegalContentType.DISCLAIMER,
      title: 'Disclaimer',
      content: `# Disclaimer

The information provided on this platform is for general informational purposes only.

## Accuracy of Information

While we strive to keep information accurate and up-to-date, we make no representations about the completeness or accuracy of any information.

## Professional Advice

The content on this platform does not constitute professional advice. You should not rely solely on the information provided.

## Availability

We do not guarantee that the platform will be available at all times or that the service will be uninterrupted.

## Changes

We reserve the right to modify, suspend, or discontinue any aspect of the platform at any time.`,
    },
  ]

  const results: LegalContent[] = []

  for (const content of initialContent) {
    const result = await prisma.legalContent.upsert({
      where: { type: content.type as LegalContentType },
      create: {
        ...content,
        lastUpdatedById: userId,
      },
      update: {
        title: content.title,
        content: content.content,
        lastUpdatedById: userId,
      },
    })
    results.push(result)
  }

  return results
}
