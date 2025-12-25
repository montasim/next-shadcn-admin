// Server-only configuration
const serverConfig = {
  // Database
  databaseUrl: process.env.DATABASE_URL,

  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  get isDevelopment() {
    return this.nodeEnv !== 'production'
  },
  get isProduction() {
    return this.nodeEnv === 'production'
  },

  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.FROM_EMAIL,

  // AI
  zhipuAiApiKey: process.env.ZHIPU_AI_API_KEY, // z.ai api key
  zhipuAiModel: process.env.ZHIPU_AI_MODEL || 'glm-4.7',

  // Image Compression (Tinify)
  tinifyApiKey: process.env.TINIFY_API_KEY,

  // PDF Compression (aPDF.io)
  apdfApiKey: process.env.APDF_API_KEY,

  // URLs
  baseUrl: process.env.BASE_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,

  // Google Drive
  google: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },

  // Quiz API (Open Trivia Database)
  quiz: {
    apiBaseUrl: process.env.QUIZ_API_BASE_URL || 'https://opentdb.com',
    timeout: parseInt(process.env.QUIZ_API_TIMEOUT || '10000', 10), // 10 seconds
    maxRetries: parseInt(process.env.QUIZ_API_MAX_RETRIES || '3', 10),
  },
} as const

// Public configuration (can be used in client components)
export const publicConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
} as const

// Full server config
export const config = serverConfig

// Type exports
export type Config = typeof serverConfig
