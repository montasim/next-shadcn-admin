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
} from '@tabler/icons-react'
import { AudioWaveform, Brain, Command, GalleryVerticalEnd } from 'lucide-react'
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
      logo: Command,
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
          title: 'Tasks',
          url: '/dashboard/tasks',
          icon: IconChecklist,
        },
        {
          title: 'Apps',
          url: '/dashboard/apps',
          icon: IconPackages,
        },
        {
          title: 'Chats',
          url: '/dashboard/chats',
          badge: '3',
          icon: IconMessages,
        },
        {
          title: 'Users',
          url: '/dashboard/users',
          icon: IconUsers,
        },
        {
          title: 'Notices',
          url: '/dashboard/notices',
          icon: IconNotification,
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
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: IconLockAccess,
          items: [
            {
              title: 'Sign In',
              url: '/auth/sign-in',
            },
            {
              title: 'Sign In (2 Col)',
              url: '/auth/sign-in-2',
            },
            {
              title: 'Sign Up',
              url: '/sign-up',
            },
            {
              title: 'Forgot Password',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Errors',
          icon: IconBug,
          items: [
            {
              title: 'Unauthorized',
              url: '/401',
              icon: IconLock,
            },
            {
              title: 'Forbidden',
              url: '/403',
              icon: IconUserOff,
            },
            {
              title: 'Not Found',
              url: '/404',
              icon: IconError404,
            },
            {
              title: 'Internal Server Error',
              url: '/500',
              icon: IconServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/503',
              icon: IconBarrierBlock,
            },
          ],
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
          title: 'Continue Reading',
          url: '/library',
          icon: IconBookmark,
        },
        {
          title: 'My Requests',
          url: '/library/my-requests',
          icon: IconBooks,
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
