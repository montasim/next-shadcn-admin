import {
  IconBuildingStore,
  IconTag,
} from '@tabler/icons-react'
import {
    AudioWaveform,
    BookOpen,
    Brain,
    GalleryVerticalEnd,
    LayoutDashboard,
    Activity,
    Layers,
    PenTool,
    ShoppingBag,
    HandCoins,
    TrendingUp,
    Construction,
    FileText,
    Megaphone,
    Bell,
    BarChart3,
    MessageSquare,
    Star,
    FileQuestion,
    Smile,
    Users,
    Trophy,
    Library,
    ShieldBan,
    HelpCircle,
    Mail,
    Clock,
    Settings,
    Wrench,
    Receipt,
    Palette,
    Monitor,
    Languages,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { ROUTES } from '@/lib/routes/client-routes'

export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '/avatars/default.svg',
  },
  teams: [
    {
      name: 'My Library',
      logo: BookOpen,
      plan: 'Digital Library',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    // ============================================================================
    // OVERVIEW
    // ============================================================================
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: ROUTES.dashboard.href,
          icon: LayoutDashboard,
        },
        {
          title: 'Activities',
          url: ROUTES.dashboardActivities.href,
          icon: Activity,
        },
      ],
    },

    // ============================================================================
    // LIBRARY MANAGEMENT
    // ============================================================================
    {
      title: 'Library Management',
      items: [
        {
          title: 'Books',
          url: ROUTES.dashboardBooks.href,
          icon: BookOpen,
        },
        {
          title: 'Series',
          url: ROUTES.dashboardSeries.href,
          icon: Layers,
        },
        {
          title: 'Authors',
          url: ROUTES.dashboardAuthors.href,
          icon: PenTool,
        },
        {
          title: 'Translators',
          url: ROUTES.dashboardTranslators.href,
          icon: Languages,
        },
        {
          title: 'Publications',
          url: ROUTES.dashboardPublications.href,
          icon: IconBuildingStore,
        },
        {
          title: 'Categories',
          url: ROUTES.dashboardCategories.href,
          icon: IconTag,
        },
      ],
    },
    {
      title: 'Library Operations',
      items: [
        {
          title: 'Book Requests',
          url: ROUTES.dashboardBookRequests.href,
          icon: FileQuestion,
        },
        {
          title: 'Loans',
          url: ROUTES.dashboardLoans.href,
          icon: HandCoins,
        },
        {
          title: 'Cost Analytics',
          url: ROUTES.dashboardBooksCostAnalytics.href,
          icon: TrendingUp,
        },
      ],
    },

    // ============================================================================
    // CONTENT MANAGEMENT
    // ============================================================================
    {
      title: 'Content Management',
      items: [
        {
          title: 'Site Settings',
          url: ROUTES.siteSettings.href,
          icon: Construction,
        },
        {
          title: 'Pricing Content',
          url: ROUTES.dashboardAdminContent.href,
          icon: FileText,
        },
        {
          title: 'Legal Content',
          url: ROUTES.dashboardLegal.href,
          icon: FileText,
        },
        {
          title: 'Notices',
          url: ROUTES.dashboardNotices.href,
          icon: Megaphone,
        },
        {
          title: 'Help Center FAQs',
          url: ROUTES.dashboardHelpCenterFaqs.href,
          icon: HelpCircle,
        },
      ],
    },

    // ============================================================================
    // USER MANAGEMENT
    // ============================================================================
    {
      title: 'User Management',
      items: [
        {
          title: 'Users',
          url: ROUTES.dashboardUsers.href,
          icon: Users,
        },
        {
          title: 'Campaigns',
          url: ROUTES.dashboardCampaigns.href,
          icon: Megaphone,
        },
        {
          title: 'Support Tickets',
          url: ROUTES.dashboardSupportTickets.href,
          icon: MessageSquare,
        },
        {
          title: 'Contact Submissions',
          url: ROUTES.dashboardAdminContactSubmissions.href,
          icon: Mail,
        },
      ],
    },

    // ============================================================================
    // MARKETPLACE
    // ============================================================================
    {
      title: 'Marketplace',
      items: [
        {
          title: 'Overview',
          url: ROUTES.dashboardMarketplace.href,
          icon: LayoutDashboard,
        },
        {
          title: 'My Posts',
          url: ROUTES.marketplacePosts.href,
          icon: ShoppingBag,
        },
        {
          title: 'Conversations',
          url: ROUTES.marketplaceConversations.href,
          icon: MessageSquare,
        },
        {
          title: 'Reviews',
          url: ROUTES.dashboardMarketplaceReviews.href,
          icon: Star,
        },
        {
          title: 'Analytics',
          url: ROUTES.marketplaceAnalytics.href,
          icon: BarChart3,
        },
      ],
    },

    // ============================================================================
    // PERSONAL
    // ============================================================================
    {
      title: 'Personal',
      items: [
        {
          title: 'My Library',
          url: ROUTES.libraryMyUploads.href,
          icon: Library,
        },
        {
          title: 'My Borrowed Books',
          url: ROUTES.profileLoans.href,
          icon: ShieldBan,
        },
        {
          title: 'Achievements',
          url: ROUTES.achievements.href,
          icon: Trophy,
        },
        {
          title: 'Moods',
          url: ROUTES.moods.href,
          icon: Smile,
        },
      ],
    },

    // ============================================================================
    // GAMES
    // ============================================================================
    {
      title: 'Games',
      items: [
        {
          title: 'Quiz',
          url: ROUTES.quiz.href,
          icon: Brain,
        },
      ],
    },

    // ============================================================================
    // SETTINGS
    // ============================================================================
    {
      title: 'Settings',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'General',
              url: ROUTES.settings.href,
              icon: Settings,
            },
            {
              title: 'Account',
              url: ROUTES.settingsAccount.href,
              icon: Wrench,
            },
            {
              title: 'Subscription',
              url: ROUTES.settingsSubscription.href,
              icon: Trophy,
            },
            {
              title: 'Billing',
              url: ROUTES.settingsBilling.href,
              icon: Receipt,
            },
            {
              title: 'Appearance',
              url: ROUTES.settingsAppearance.href,
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: ROUTES.settingsNotifications.href,
              icon: Bell,
            },
            {
              title: 'Display',
              url: ROUTES.settingsDisplay.href,
              icon: Monitor,
            },
          ],
        },
        {
          title: 'My Activity',
          url: ROUTES.dashboardActivity.href,
          icon: Clock,
        },
      ],
    },
  ],
}
