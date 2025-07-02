# Supabase Authentication Setup for Ganger Actions

## Overview

The authentication error "Unsupported provider: provider is not enabled" occurs because Google OAuth needs to be enabled in the Supabase dashboard. This guide explains how to set up authentication properly.

## Current Configuration

### Google OAuth Credentials (from legacy system)
- **Client ID**: `745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Domain**: `gangerdermatology.com`

### Authentication Approach

We're using **NextAuth.js** instead of Supabase Auth because:
1. It matches the legacy PHP implementation more closely
2. Provides better control over the authentication flow
3. Allows domain restriction to @gangerdermatology.com
4. Works seamlessly with Google Workspace

## Setup Instructions

### 1. Supabase Dashboard Configuration

Since we're using NextAuth instead of Supabase Auth, you don't need to enable Google OAuth in Supabase. However, ensure:

1. **Row Level Security (RLS)** is enabled on all tables
2. **Service Role Key** is properly configured in environment variables
3. **Database connection** is working

### 2. Environment Variables

Ensure these are set in your `.env.local` file and Vercel:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# NextAuth
NEXTAUTH_URL=https://ganger-actions.vercel.app  # Or your deployment URL
NEXTAUTH_SECRET=your-generated-secret-here  # Generate with: openssl rand -base64 32

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `apigatewayproject-451519`
3. Navigate to **APIs & Services > Credentials**
4. Find the OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3011/api/auth/callback/google` (for local dev)
   - `https://ganger-actions.vercel.app/api/auth/callback/google` (for production)
   - `https://staff.gangerdermatology.com/ganger-actions/api/auth/callback/google` (if proxied)

### 4. NextAuth Configuration

The authentication is configured in `/apps/ganger-actions/src/pages/api/auth/[...nextauth].ts`:

- Uses Google Provider
- Restricts to @gangerdermatology.com domain
- Syncs user data with Supabase database
- Handles session management

### 5. Authentication Flow

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. Google validates @gangerdermatology.com email
4. Callback to NextAuth
5. User data synced to Supabase
6. Session created
7. User redirected to dashboard

## Testing Authentication

### Local Development
```bash
cd apps/ganger-actions
npm run dev
# Visit http://localhost:3011/auth/signin
```

### Production
1. Deploy to Vercel
2. Set all environment variables in Vercel dashboard
3. Test sign-in flow

## Troubleshooting

### "Provider not enabled" error
- This means you're trying to use Supabase Auth instead of NextAuth
- Check that API routes are using NextAuth configuration
- Ensure `/api/auth/[...nextauth].ts` exists

### "Access Denied" error
- User email doesn't end with @gangerdermatology.com
- Check Google OAuth configuration

### "Configuration" error
- Missing environment variables
- Check NEXTAUTH_SECRET is set
- Verify Google Client ID/Secret

## Security Notes

1. **Never commit** the `.env.local` file
2. **Domain restriction** is enforced in NextAuth callbacks
3. **Session lifetime** is 24 hours (matching legacy system)
4. **Shared account** (office@gangerdermatology.com) should be blocked if needed

## Next Steps

After authentication is working:
1. Test form submissions with authenticated users
2. Verify tickets are created in Supabase
3. Implement ticket viewing/management pages
4. Add role-based access control if needed