import {
  IconBarrierBlock,
  IconBook,
  IconBrowserCheck,
  IconBug,
  IconChecklist,
  IconError404,
  IconHelp,
  IconLayoutDashboard,
  IconLock,
  IconLockAccess,
  IconMail,
  IconMessages,
  IconNotification,
  IconPackages,
  IconPalette,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconUsers,
  IconTag,
  IconBuildingStore,
  IconUser,
  IconBooks,
  IconBookmark,
  IconBuildingFactory,
  IconMoodSmile,
  IconList,
  IconShoppingCart,
  IconMessageCircle,
  IconTag as IconTagOffer,
  IconStar,
  IconHistory,
  IconTrophy,
} from '@tabler/icons-react'
import { AudioWaveform, BookOpen as BookOpenIcon, Brain, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '/avatars/default.svg',
  },
  teams: [
    {
      name: 'Book Heaven',
      logo: BookOpenIcon,
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
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Site Settings',
          url: '/dashboard/site-settings',
          icon: IconBuildingFactory,
        },
        {
          title: 'Users',
          url: '/dashboard/users',
          icon: IconUsers,
        },
        {
          title: 'Campaigns',
          url: '/dashboard/campaigns',
          icon: IconMail,
        },
        {
          title: 'Notices',
          url: '/dashboard/notices',
          icon: IconNotification,
        },
        {
          title: 'Activity Logs',
          url: '/dashboard/admin/activities',
          icon: IconHistory,
        },
        {
          title: 'Support Tickets',
          url: '/dashboard/admin/support-tickets',
          icon: IconMessages,
        },
      ],
    },
    {
      title: 'Library Management',
      items: [
        {
          title: 'Books',
          url: '/dashboard/books',
          icon: IconBook,
        },
        {
          title: 'Series',
          url: '/dashboard/series',
          icon: IconList,
        },
        {
          title: 'Authors',
          url: '/dashboard/authors',
          icon: IconUser,
        },
        {
          title: 'Publications',
          url: '/dashboard/publications',
          icon: IconBuildingStore,
        },
        {
          title: 'Categories',
          url: '/dashboard/categories',
          icon: IconTag,
        },
        {
          title: 'Moods',
          url: '/dashboard/moods',
          icon: IconMoodSmile,
        },
        {
          title: 'Book Requests',
          url: '/dashboard/book-requests',
          icon: IconBooks,
        },
      ],
    },
    {
      title: 'Marketplace',
      items: [
        {
          title: 'Browse Marketplace',
          url: '/marketplace',
          icon: IconShoppingCart,
        },
        {
          title: 'My Listings',
          url: '/marketplace/my-posts',
          icon: IconBook,
        },
        {
          title: 'Create Listing',
          url: '/marketplace/create',
          icon: IconTag,
        },
        {
          title: 'Messages',
          url: '/messages',
          icon: IconMessageCircle,
        },
        {
          title: 'Offers Sent',
          url: '/offers/sent',
          icon: IconTagOffer,
        },
        {
          title: 'Offers Received',
          url: '/offers/received',
          icon: IconTagOffer,
        },
      ],
    },
    {
      title: 'Admin Marketplace',
      items: [
        {
          title: 'Marketplace Overview',
          url: '/dashboard/marketplace',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Manage Listings',
          url: '/dashboard/marketplace/posts',
          icon: IconBook,
        },
        {
          title: 'Conversations',
          url: '/dashboard/marketplace/conversations',
          icon: IconMessages,
        },
        {
          title: 'Reviews',
          url: '/dashboard/marketplace/reviews',
          icon: IconStar,
        },
        {
          title: 'Analytics',
          url: '/dashboard/marketplace/analytics',
          icon: IconBrowserCheck,
        },
      ],
    },
    {
      title: 'Games',
      items: [
        {
          title: 'Quiz Game',
          url: '/quiz',
          icon: Brain,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Library',
          url: '/library',
          icon: IconBookmark,
        },
        {
          title: 'Activity',
          url: '/activity',
          icon: IconHistory,
        },
        {
          title: 'Achievements',
          url: '/achievements',
          icon: IconTrophy,
        },
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}
