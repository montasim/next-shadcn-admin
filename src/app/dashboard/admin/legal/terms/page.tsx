import { HeaderContainer } from '@/components/ui/header-container'
import { LegalContentEditor } from '@/components/legal/legal-content-editor'
import { LegalContentType } from '@prisma/client'

export default function AdminTermsPage() {
  return (
    <HeaderContainer>
      <LegalContentEditor
        type={LegalContentType.TERMS_OF_SERVICE}
        title="Terms of Service"
        description="Manage the Terms of Service content. Changes will be visible to all users immediately after saving."
        placeholderTitle="Terms of Service"
        placeholderContent={`# Terms of Service

## 1. Introduction
Welcome to our platform. By using our service, you agree to these terms.

## 2. User Responsibilities
- You must be at least 13 years old to use this platform
- You are responsible for maintaining the security of your account
- You must notify us immediately of any unauthorized use

## 3. Content Guidelines
- Users may not upload illegal or inappropriate content
- Respect copyright and intellectual property rights
- Be respectful to other users

## 4. Service Availability
- We strive for 99.9% uptime
- Scheduled maintenance will be announced in advance
- We reserve the right to suspend service for violations

## 5. Privacy
Your use of our service is also governed by our Privacy Policy.

## 6. Changes to Terms
We reserve the right to modify these terms at any time.

## 7. Contact
For questions, please contact our support team.`}
      />
    </HeaderContainer>
  )
}
