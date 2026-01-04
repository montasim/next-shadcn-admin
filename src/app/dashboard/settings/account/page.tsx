import ContentSection from '../components/content-section'
import AccountForm from './account-form'

export const dynamic = 'force-dynamic'

export default function SettingsAccount() {
  return (
    <ContentSection
      title='Account'
      desc='Update your account settings. Set your preferred language and timezone.'
    >
      <AccountForm />
    </ContentSection>
  )
}
