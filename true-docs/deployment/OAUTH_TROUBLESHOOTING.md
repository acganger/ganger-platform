# OAuth Authentication Troubleshooting Guide

## Common Authentication Issues and Solutions

### 1. "The OAuth client was not found" Error
- **Cause**: Google OAuth client ID mismatch
- **Solution**: Verify GOOGLE_CLIENT_ID in Vercel matches the OAuth client in Google Cloud Console
- **Current Client ID**: `310418971046-skkrjvju66fid4r75lfdile2i8o8nrsd.apps.googleusercontent.com`

### 2. "Redirect URI mismatch" Error
- **Cause**: Callback URL not properly configured
- **Solution**: Ensure these URLs are in your OAuth client's authorized redirect URIs:
  - `https://staff.gangerdermatology.com/auth/callback`
  - `http://localhost:3001/auth/callback`

### 3. Authentication Fails Silently
- **Cause**: Google OAuth not enabled in Supabase
- **Solution**: 
  1. Go to Supabase Dashboard: https://app.supabase.com/project/pfqtzmxxxhhsxmlddrta/auth/providers
  2. Click on "Google" provider
  3. Enable it
  4. Add your OAuth credentials:
     - Client ID: `310418971046-skkrjvju66fid4r75lfdile2i8o8nrsd.apps.googleusercontent.com`
     - Client Secret: `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`
  5. Save changes

### 4. "Unsupported provider" Error
- **Cause**: Provider not enabled in Supabase
- **Solution**: Enable Google provider in Supabase Auth settings (see above)

### 5. Session Not Persisting
- **Cause**: Cookie or localStorage issues
- **Solution**: 
  - Check browser console for errors
  - Ensure cookies are enabled
  - Try incognito/private browsing mode

## Verification Steps

1. **Check Environment Variables in Vercel**:
   ```bash
   GOOGLE_CLIENT_ID=310418971046-skkrjvju66fid4r75lfdile2i8o8nrsd.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Test OAuth Flow**:
   - Visit https://staff.gangerdermatology.com
   - Click "Sign in with Google"
   - Should redirect to Google OAuth consent
   - After approval, should return to /auth/callback
   - Should then redirect to dashboard

3. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for any error messages
   - Check Network tab for failed requests

4. **Verify Supabase Configuration**:
   - Dashboard: https://app.supabase.com/project/pfqtzmxxxhhsxmlddrta
   - Check Auth → Providers → Google is enabled
   - Check Auth → URL Configuration:
     - Site URL: `https://staff.gangerdermatology.com`
     - Redirect URLs: Include `/auth/callback`

## Debug Information to Collect

When reporting auth issues, please provide:
1. Browser console errors
2. Network tab showing the OAuth flow
3. The exact error message
4. Which step in the flow fails

## Code Fix Applied

Fixed a bug in `/packages/auth/src/context.tsx` where `redirectTo` was being passed instead of `redirectUrl` to the OAuth options.

---
*Last Updated: January 8, 2025*