# 🔐 Manual Authentication Setup Steps

## Required Manual Steps

### 1. Supabase Database Schema Setup

**Action Required**: Copy and execute the following SQL in Supabase Dashboard → SQL Editor:

```sql
-- Copy the entire content from: /mnt/q/Projects/ganger-platform/supabase/migrations/001_auth_schema.sql
-- Execute in Supabase Dashboard at: https://supabase.com/dashboard/project/pfqtzmxxxhhsxmlddrta/sql/new
```

**What this creates**:
- `profiles` table for user metadata
- `teams` table for L10 team management  
- `team_members` table for role-based access
- `app_permissions` table for application access control
- `audit_logs` table for HIPAA compliance
- Row Level Security (RLS) policies
- Automatic user profile creation on signup
- Default admin permissions for anand@gangerdermatology.com

### 2. Google Cloud Console OAuth Setup

**Action Required**: Update Google OAuth redirect URIs:

1. Go to: https://console.cloud.google.com/apis/credentials/oauthclient/745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com?project=apigatewayproject-451519

2. Add these Authorized redirect URIs:
   ```
   https://staff.gangerdermatology.com/auth/callback
   https://staff.gangerdermatology.com/l10/auth/callback
   https://staff.gangerdermatology.com/handouts/auth/callback
   https://staff.gangerdermatology.com/inventory/auth/callback
   https://pfqtzmxxxhhsxmlddrta.supabase.co/auth/v1/callback
   ```

3. Save changes

### 3. Supabase Auth Provider Setup

**Action Required**: Configure Google OAuth in Supabase:

1. Go to: https://supabase.com/dashboard/project/pfqtzmxxxhhsxmlddrta/auth/providers

2. Enable Google provider with:
   - **Client ID**: `745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com`
   - **Client Secret**: `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`

3. Set Redirect URL: `https://staff.gangerdermatology.com/auth/callback`

4. Save configuration

## Verification Steps

After completing manual setup:

1. **Test Database**: Check that tables exist in Supabase Dashboard → Table Editor
2. **Test OAuth**: Visit any app and try Google sign-in
3. **Check User Creation**: Verify profile is created automatically on first login

## Next: Automated Steps

Once manual setup is complete, the following will be automated:
- Universal Auth Package creation
- L10 app authentication integration  
- Cross-app session management
- Production deployment

**Estimated manual setup time**: 15 minutes