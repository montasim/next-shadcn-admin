# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:password@localhost:5432/admin_auth"

# Email Service (Resend)
# Get your API key from: https://resend.com/api-keys
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"

# Email From Address (optional, defaults to onboarding@resend.dev)
FROM_EMAIL="noreply@yourdomain.com"

# Session Configuration
# Generate a cryptographically secure secret (minimum 32 characters)
# You can generate one using: openssl rand -base64 32
SESSION_SECRET="your-cryptographically-secure-secret-min-32-chars-here"

# Application Base URL
# Used for email links and redirects
BASE_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

## Quick Start

### 1. Install Dependencies (Already Done)
```bash
npm install @prisma/client prisma bcrypt resend @types/bcrypt --legacy-peer-deps
```

### 2. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
- Install PostgreSQL on your machine
- Create a database: 
  ```sql
  CREATE DATABASE admin_auth;
  ```
- Update `DATABASE_URL` in `.env` with your credentials

#### Option B: Docker PostgreSQL
```bash
docker run --name postgres-admin \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=admin_auth \
  -p 5432:5432 \
  -d postgres:15
```

#### Option C: Cloud PostgreSQL (Recommended for Production)
- Use services like Neon, Supabase, Railway, or AWS RDS
- Copy the connection string to `DATABASE_URL`

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Database Migration
```bash
npx prisma migrate dev --name init_admin_auth
```

### 5. (Optional) View Database with Prisma Studio
```bash
npx prisma studio
```

### 6. Get Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up or login
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to `RESEND_API_KEY` in `.env`
6. (Optional) Add and verify your domain for production emails

### 7. Generate Session Secret

#### Using OpenSSL:
```bash
openssl rand -base64 32
```

#### Using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the generated secret to `SESSION_SECRET` in `.env`

### 8. Start Development Server
```bash
npm run dev
```

## Testing the Authentication System

### Test Registration Flow

1. **Send OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

2. **Check your email for the 7-digit OTP, then verify:**
```bash
curl -X POST http://localhost:3000/api/auth/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"1234567"}'
```

3. **Create account:**
```bash
curl -X POST http://localhost:3000/api/auth/register/create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test Admin","password":"SecurePass123!"}'
```

### Test Login Flow

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

### Test Password Reset Flow

1. **Send reset OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/password-reset/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

2. **Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/password-reset/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"1234567"}'
```

3. **Confirm new password:**
```bash
curl -X POST http://localhost:3000/api/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"NewSecurePass456!"}'
```

## Cleanup Jobs

### Manual Cleanup
```bash
curl -X POST http://localhost:3000/api/auth/cleanup
```

### Automated Cleanup (Recommended for Production)

Add to your crontab:
```
0 * * * * curl -X POST http://localhost:3000/api/auth/cleanup
```

Or use a service like:
- Vercel Cron Jobs
- AWS EventBridge
- GitHub Actions (scheduled workflows)

## Security Checklist

- [ ] DATABASE_URL is secure and not exposed
- [ ] RESEND_API_KEY is valid and not exposed
- [ ] SESSION_SECRET is cryptographically secure (32+ characters)
- [ ] PostgreSQL is running and accessible
- [ ] Resend account is set up with verified domain (for production)
- [ ] .env file is added to .gitignore
- [ ] HTTPS is enabled in production (NODE_ENV=production)
- [ ] Rate limiting is tested and working
- [ ] Cleanup jobs are scheduled for production

## Troubleshooting

### "PrismaClient not found"
Run: `npx prisma generate`

### "Can't reach database server"
- Check if PostgreSQL is running
- Verify DATABASE_URL is correct
- Check firewall/network settings

### "Email sending failed"
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for errors
- Ensure you're not hitting rate limits

### "Session not persisting"
- Check if cookies are enabled in browser
- Verify SESSION_SECRET is set
- Check if HTTPS is required (production)

## Next Steps

Once everything is working:

1. Update existing UI components to call the new API endpoints
2. Add proper error handling in the frontend
3. Implement loading states during API calls
4. Add toast notifications for user feedback
5. Set up proper production environment variables
6. Configure CORS if needed for different domains
7. Set up monitoring and logging
8. Add comprehensive tests
