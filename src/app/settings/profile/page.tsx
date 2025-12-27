import ContentSection from '../components/content-section'
import ProfileForm from './profile-form'

export const dynamic = 'force-dynamic'

export default function SettingsProfile() {
  return (
    <ContentSection
      title='Profile'
      desc='Update your profile information.'
    >
      <ProfileForm />
    </ContentSection>
  )
}
