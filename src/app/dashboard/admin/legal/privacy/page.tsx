import { HeaderContainer } from '@/components/ui/header-container'
import { LegalContentEditor } from '@/components/legal/legal-content-editor'
import { LegalContentType } from '@prisma/client'

export default function AdminPrivacyPage() {
  return (
    <HeaderContainer>
      <LegalContentEditor
        type={LegalContentType.PRIVACY_POLICY}
        title="Privacy Policy"
        description="Manage the Privacy Policy content. Changes will be visible to all users immediately after saving."
        placeholderTitle="Privacy Policy"
        placeholderContent={`# Privacy Policy

## 1. Information We Collect
- Account information (name, email, profile details)
- Usage data (books read, quizzes taken, achievements)
- Device information (IP address, browser type)
- Cookies and similar technologies

## 2. How We Use Your Information
- Provide and improve our services
- Personalize your experience
- Send important notifications
- Analyze usage patterns
- Prevent fraud and abuse

## 3. Data Sharing
We do not sell your personal information. We may share data:
- With service providers who assist our operations
- As required by law
- To protect our rights and property

## 4. Data Security
We implement industry-standard security measures:
- Encryption in transit and at rest
- Regular security audits
- Access controls and authentication

## 5. Your Rights
You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your account
- Opt-out of marketing communications
- Export your data

## 6. Cookies
We use cookies for:
- Authentication
- Preferences
- Analytics
- You can manage cookies in your browser settings

## 7. Children's Privacy
Our service is not intended for children under 13. We do not knowingly collect data from children.

## 8. International Users
Your data may be transferred to and processed in countries other than your own.

## 9. Changes to Privacy Policy
We will notify users of significant changes via email or platform notice.

## 10. Contact
For privacy inquiries, contact our privacy team.`}
      />
    </HeaderContainer>
  )
}
