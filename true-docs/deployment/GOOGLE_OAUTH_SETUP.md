# Google OAuth Setup Documentation

## Overview

This document contains the complete Google OAuth configuration for the Ganger Platform, including credentials, console access, and setup instructions.

## Google Cloud Project Details

- **Project Name**: apigatewayproject-451519
- **Google Cloud Console**: https://console.cloud.google.com/auth/overview?project=apigatewayproject-451519
- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent?project=apigatewayproject-451519

## OAuth Client Configuration

### Current OAuth Client (Updated January 8, 2025)
- **Client Name**: staff.gangerdermatology.com
- **Client ID**: `310418971046-skkrjvju66fid4r75lfdile2i8o8nrsd.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Type**: Web application

### Authorized Redirect URIs
- `https://staff.gangerdermatology.com/auth/callback` (Production)
- `http://localhost:3001/auth/callback` (Local Development)

### Authorized JavaScript Origins
- `https://staff.gangerdermatology.com`
- `http://localhost:3001`

## OAuth Consent Screen Configuration

### Authorized Domains
- google.com (Required by Google)
- gangerdermatology.com (Primary domain)
- pfqtzmxxxhhsxmlddrta.supabase.co (Supabase project)
- unified-api-gateway-3ylrfuzq.uc.gateway.dev (Legacy API)
- hr-automation-portal-310418971046.us-central1.run.app (HR system)

### App Information
- **App Name**: Ganger Platform
- **User Support Email**: anand@gangerdermatology.com
- **Developer Contact**: anand@gangerdermatology.com

### Compliance Links
- **Privacy Policy**: https://docs.google.com/document/d/1wiwKAktuxeCXg0dmrF6wolIvmikWQQC6TekewxVYW7o/edit?usp=sharing
- **Terms of Service**: https://docs.google.com/document/d/1XM_pEX6Y2QWc48IbmKv8gbUig5ifvtMgXbPS9EYCnn0/edit?usp=sharing

## Google Workspace Configuration

### Domain Settings
- **Primary Domain**: gangerdermatology.com
- **Organizational Unit**: /Google Cloud Identity
- **Target Group**: gci-users@gangerdermatology.com
- **Admin Account**: anand@gangerdermatology.com

### Access Control
- Only users with @gangerdermatology.com email addresses can authenticate
- Users must be members of the gci-users group
- External users are blocked at the OAuth level

## Environment Variables

Add these to your `.env` file and Vercel environment variables:

```bash
# Google OAuth (Updated January 8, 2025)
GOOGLE_CLIENT_ID=310418971046-skkrjvju66fid4r75lfdile2i8o8nrsd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google Workspace
GOOGLE_DOMAIN=gangerdermatology.com
GOOGLE_IMPERSONATE_EMAIL=anand@gangerdermatology.com
GOOGLE_TARGET_GROUP=gci-users@gangerdermatology.com
GOOGLE_TARGET_OU="/Google Cloud Identity"
```

## Vercel Configuration

Each app in the monorepo needs these environment variables:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all Google OAuth variables for production, preview, and development
3. Redeploy the application

## Troubleshooting

### Common Issues

1. **"The OAuth client was not found"**
   - Ensure GOOGLE_CLIENT_ID is correctly set in Vercel
   - Check that the OAuth client is enabled in Google Cloud Console

2. **"Redirect URI mismatch"**
   - Verify the callback URL matches exactly (including trailing slashes)
   - Add both http://localhost variants for local development

3. **"User not authorized"**
   - Check user has @gangerdermatology.com email
   - Verify user is in gci-users group
   - Ensure OAuth consent screen is properly configured

### Testing OAuth

1. **Local Development**:
   ```bash
   npm run dev:staff
   # Visit http://localhost:3001
   ```

2. **Production**:
   - Visit https://staff.gangerdermatology.com
   - Click "Sign in with Google"
   - Should redirect to Google OAuth
   - After approval, returns to /auth/callback

## Security Notes

- OAuth credentials are encrypted in Vercel
- Never commit credentials to Git (except in .env files per internal policy)
- Session tokens expire after 24 hours
- All authentication is handled through Supabase Auth

## Related Documentation

- [Supabase Auth Setup](./SUPABASE_AUTH_SETUP.md)
- [Environment Variables Guide](../../CLAUDE.md#environment-configuration)
- [Authentication Architecture](../../CLAUDE.md#authentication-architecture)

---

*Last Updated: January 8, 2025*
*OAuth Client Created: January 8, 2025*