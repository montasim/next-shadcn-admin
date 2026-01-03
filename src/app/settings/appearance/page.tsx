import ContentSection from '../components/content-section'
import AppearanceForm from './appearance-form'

export const dynamic = 'force-dynamic'

export default function SettingsAppearance() {
  return (
    <ContentSection
      title='Appearance'
      desc='Customize the appearance of the app. Automatically switch between day
          and night themes.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
