import {
  BookOpen,
  Bookmark,
  Brain,
  Settings,
  LayoutDashboard,
  Library,
  User,
  MessageSquare,
  ShoppingBag,
  Plus,
  PenTool,
  Bell,
  Palette,
  Monitor,
  CreditCard,
  FolderTree,
  Home,
  ShieldCheck,
  Globe,
  BarChart3,
  RefreshCw,
  Inbox,
  Upload,
  BookMarked,
  FileText,
  Hash,
  List,
  Trophy,
  Target,
  Crown,
  HelpCircle,
  Info,
  Mail,
  FileCheck,
  Lock,
  Users,
  LogIn,
  UserPlus,
  TrendingUp,
  Sparkles,
  Megaphone,
  ChevronRight,
  Link2,
  Ticket,
} from 'lucide-react'

export interface AppRoute {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * Global app routes configuration
 * Define all routes here with their labels, paths, and icons
 * Use the route name to reference it in components
 */
export const ROUTES = {
  // Public Routes
  home: {
    label: 'Home',
    href: '/',
    icon: Home,
  },

  // Books & Library
  books: {
    label: 'Books',
    href: '/books',
    icon: BookOpen,
  },
  library: {
    label: 'Library',
    href: '/library',
    icon: Library,
  },

  // Quiz
  quiz: {
    label: 'Quiz',
    href: '/quiz',
    icon: Brain,
  },

  // Premium
  premium: {
    label: 'Premium',
    href: '/premium',
    icon: Crown,
  },

  // Dashboard
  dashboard: {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },

  // Settings
  settings: {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },

  // User Settings Sub-routes
  settingsAccount: {
    label: 'Account',
    href: '/dashboard/settings/account',
    icon: User,
  },
  settingsAppearance: {
    label: 'Appearance',
    href: '/dashboard/settings/appearance',
    icon: Palette,
  },
  settingsBilling: {
    label: 'Billing',
    href: '/dashboard/settings/billing',
    icon: CreditCard,
  },
  settingsNotifications: {
    label: 'Notifications',
    href: '/dashboard/settings/notifications',
    icon: Bell,
  },
  settingsSubscription: {
    label: 'Subscription',
    href: '/dashboard/settings/subscription',
    icon: Crown,
  },
  settingsDisplay: {
    label: 'Display',
    href: '/dashboard/settings/display',
    icon: Monitor,
  },

  // Marketplace
  marketplace: {
    label: 'Marketplace',
    href: '/marketplace',
    icon: ShoppingBag,
  },

  // Messages
  messages: {
    label: 'Messages',
    href: '/dashboard/marketplace/messages',
    icon: MessageSquare,
  },

  // Library Sub-routes
  libraryMyRequests: {
    label: 'My Requests',
    href: '/library/my-requests',
    icon: Inbox,
  },

  // Activity
  dashboardActivity: {
    label: 'Activity',
    href: '/dashboard/activity',
    icon: BarChart3,
  },

  // Support Routes
  helpCenter: {
    label: 'Help Center',
    href: '/help-center',
    icon: HelpCircle,
  },
  about: {
    label: 'About Us',
    href: '/about',
    icon: Info,
  },
  contact: {
    label: 'Contact',
    href: '/contact',
    icon: Mail,
  },

  // Legal Routes
  terms: {
    label: 'Terms of Service',
    href: '/terms',
    icon: FileCheck,
  },
  privacy: {
    label: 'Privacy Policy',
    href: '/privacy',
    icon: Lock,
  },

  // Categories
  categories: {
    label: 'Categories',
    href: '/categories',
    icon: FolderTree,
  },

  // Authors
  authors: {
    label: 'Authors',
    href: '/authors',
    icon: Users,
  },

  // Translators
  translators: {
    label: 'Translators',
    href: '/translators',
    icon: Users,
  },

  // Series
  series: {
    label: 'Series',
    href: '/series',
    icon: Hash,
  },

  // Publications
  publications: {
    label: 'Publications',
    href: '/publications',
    icon: Globe,
  },

  // Physical Library
  physicalLibrary: {
    label: 'Physical Library',
    href: '/physical-library',
    icon: Library,
  },

  // Quiz & Leaderboard
  quizLeaderboard: {
    label: 'Leaderboard',
    href: '/quiz/leaderboard',
    icon: Trophy,
  },

  // Notices
  notices: {
    label: 'Notices',
    href: '/notices',
    icon: Megaphone,
  },

  // Auth Routes
  signIn: {
    label: 'Sign In',
    href: '/auth/sign-in',
    icon: LogIn,
  },
  signUp: {
    label: 'Sign Up',
    href: '/auth/sign-up',
    icon: UserPlus,
  },
  login: {
    label: 'Login',
    href: '/login',
    icon: LogIn,
  },
  signUpSimple: {
    label: 'Sign Up',
    href: '/sign-up',
    icon: UserPlus,
  },
  otp: {
    label: 'OTP',
    href: '/otp',
    icon: Lock,
  },
  forgotPassword: {
    label: 'Forgot Password',
    href: '/forgot-password',
    icon: HelpCircle,
  },

  // Marketplace Routes
  marketplacePosts: {
    label: 'My Posts',
    href: '/dashboard/marketplace/posts',
    icon: ShoppingBag,
  },
  marketplaceConversations: {
    label: 'Conversations',
    href: '/dashboard/marketplace/conversations',
    icon: MessageSquare,
  },
  marketplaceAnalytics: {
    label: 'Analytics',
    href: '/dashboard/marketplace/analytics',
    icon: BarChart3,
  },

  // Messages Route
  messagesSimple: {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
  },

  // Offers
  offersSent: {
    label: 'My Offers',
    href: '/offers/sent',
    icon: TrendingUp,
  },
  offersReceived: {
    label: 'Received Offers',
    href: '/offers/received',
    icon: Inbox,
  },

  // Site Settings
  siteSettings: {
    label: 'Site Settings',
    href: '/dashboard/site-settings',
    icon: Settings,
  },

  // Moods
  moods: {
    label: 'Moods',
    href: '/dashboard/moods',
    icon: Sparkles,
  },
  seedMoods: {
    label: 'Seed Moods',
    href: '/dashboard/seed-moods',
    icon: RefreshCw,
  },

  // Subscription
  signup: {
    label: 'Sign Up',
    href: '/signup',
    icon: UserPlus,
  },
  pricing: {
    label: 'Pricing',
    href: '/pricing',
    icon: Crown,
  },

  // Dashboard Routes
  dashboardUsers: {
    label: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  dashboardCampaigns: {
    label: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Mail,
  },
  dashboardNotices: {
    label: 'Notices',
    href: '/dashboard/notices',
    icon: Bell,
  },
  dashboardActivities: {
    label: 'Activity Logs',
    href: '/dashboard/activities',
    icon: BarChart3,
  },
  dashboardSupportTickets: {
    label: 'Support Tickets',
    href: '/dashboard/support-tickets',
    icon: MessageSquare,
  },
  dashboardHelpCenterFaqs: {
    label: 'Help Center FAQs',
    href: '/dashboard/help-center/faqs',
    icon: HelpCircle,
  },
  dashboardAdminContactSubmissions: {
    label: 'Contact Submissions',
    href: '/dashboard/admin/contact-submissions',
    icon: Mail,
  },
  dashboardLegal: {
    label: 'Legal Content',
    href: '/dashboard/legal',
    icon: FileText,
  },
  dashboardAdminContent: {
    label: 'Pricing Page Content',
    href: '/dashboard/admin/content',
    icon: Sparkles,
  },

  // Library Management
  dashboardBooks: {
    label: 'Books',
    href: '/dashboard/books',
    icon: BookOpen,
  },
  dashboardSeries: {
    label: 'Series',
    href: '/dashboard/series',
    icon: List,
  },
  dashboardAuthors: {
    label: 'Authors',
    href: '/dashboard/authors',
    icon: User,
  },
  dashboardTranslators: {
    label: 'Translators',
    href: '/dashboard/translators',
    icon: User,
  },
  dashboardPublications: {
    label: 'Publications',
    href: '/dashboard/publications',
    icon: Globe,
  },
  dashboardCategories: {
    label: 'Categories',
    href: '/dashboard/categories',
    icon: Hash,
  },
  dashboardBookRequests: {
    label: 'Book Requests',
    href: '/dashboard/book-requests',
    icon: BookMarked,
  },
  dashboardLoans: {
    label: 'Loans',
    href: '/dashboard/loans',
    icon: ShieldCheck,
  },
  dashboardBooksCostAnalytics: {
    label: 'Cost Analytics',
    href: '/dashboard/books/cost-analytics',
    icon: CreditCard,
  },

  // Marketplace
  marketplaceMyPosts: {
    label: 'My Listings',
    href: '/marketplace/my-posts',
    icon: ShoppingBag,
  },
  dashboardMarketplace: {
    label: 'Marketplace Overview',
    href: '/dashboard/marketplace',
    icon: LayoutDashboard,
  },
  dashboardMarketplaceReviews: {
    label: 'Reviews',
    href: '/dashboard/marketplace/reviews',
    icon: Trophy,
  },

  // Other Routes
  profileLoans: {
    label: 'My Borrowed Books',
    href: '/profile/loans',
    icon: ShieldCheck,
  },
  achievements: {
    label: 'Achievements',
    href: '/achievements',
    icon: Trophy,
  },
  libraryMyUploads: {
    label: 'My Library',
    href: '/library?tab=my-uploads',
    icon: Bookmark,
  },
} as const

export type RouteKey = keyof typeof ROUTES

/**
 * Helper to get route by key
 */
export function getRoute(key: RouteKey): AppRoute {
  return ROUTES[key]
}

/**
 * Helper to get multiple routes by keys
 */
export function getRoutes(keys: RouteKey[]): AppRoute[] {
  return keys.map(key => ROUTES[key])
}
