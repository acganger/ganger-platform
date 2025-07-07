# Ganger Actions - Deployment Checklist

*Last Updated: January 7, 2025*

## ✅ Pre-Deployment Verification

### 1. **Code Quality**
- [x] All TypeScript errors resolved
- [x] Proper error handling implemented across all API routes
- [x] Logging system in place for debugging
- [x] No hardcoded secrets or credentials
- [x] All forms match legacy PHP field names

### 2. **Monorepo Compliance**
- [x] Package name follows convention: `@ganger/ganger-actions`
- [x] Uses workspace dependencies: `workspace:*`
- [x] Vercel.json configured for monorepo build
- [x] PostCSS uses Tailwind v4 syntax: `'@tailwindcss/postcss': {}`
- [x] next.config.js includes transpilePackages for all @ganger/* packages

### 3. **Authentication & Security**
- [x] NextAuth configured with Google OAuth
- [x] Domain restriction to @gangerdermatology.com
- [x] Row Level Security enabled on all database tables
- [x] CSRF protection on forms
- [x] Role-based access control implemented

### 4. **Database**
- [x] All migrations applied to Supabase
- [x] User management tables created
- [x] Tickets system fully implemented
- [x] Activity logging in place
- [x] Indexes created for performance

### 5. **Features Complete**
- [x] All 7 form types implemented
- [x] User management with profiles
- [x] Ticket system with comments
- [x] Dashboard with analytics
- [x] Google Workspace integration ready
- [x] Export functionality (CSV)

## 🚀 Deployment Steps

### 1. **Environment Variables**
Set all required variables in Vercel dashboard:

```bash
# NextAuth
NEXTAUTH_URL=https://staff.gangerdermatology.com
NEXTAUTH_SECRET=[generate-secret]

# Google OAuth
GOOGLE_CLIENT_ID=[from-google-cloud]
GOOGLE_CLIENT_SECRET=[from-google-cloud]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=[from-supabase]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from-supabase]
SUPABASE_SERVICE_ROLE_KEY=[from-supabase]

# Database
DATABASE_URL=[postgresql-connection-string]

# Google Workspace (optional)
GOOGLE_CLIENT_EMAIL=[service-account-email]
GOOGLE_PRIVATE_KEY=[service-account-key]
GOOGLE_DOMAIN=gangerdermatology.com
GOOGLE_IMPERSONATE_EMAIL=anand@gangerdermatology.com
GOOGLE_TARGET_GROUP=gci-users@gangerdermatology.com
GOOGLE_TARGET_OU=/Google Cloud Identity
```

### 2. **Vercel Project Configuration**
1. Create new Vercel project
2. Connect to GitHub repository
3. Set root directory to: `apps/ganger-actions`
4. Import all environment variables
5. Deploy

### 3. **DNS Configuration**
1. In Cloudflare, create CNAME record:
   - Name: `staff`
   - Target: `cname.vercel-dns.com`
2. In Vercel, add custom domain: `staff.gangerdermatology.com`

### 4. **Google OAuth Setup**
1. In Google Cloud Console:
   - Add redirect URI: `https://staff.gangerdermatology.com/api/auth/callback/google`
   - Ensure app is internal (domain restricted)

### 5. **Post-Deployment Testing**
- [ ] Test Google OAuth login
- [ ] Submit test ticket for each form type
- [ ] Create test user
- [ ] Add comment to ticket
- [ ] Export ticket data
- [ ] Check all role-based permissions

## 📋 Optional Post-Launch Tasks

### 1. **Enable Google Workspace Sync**
- Create service account with domain-wide delegation
- Add service account credentials to environment variables
- Test user provisioning

### 2. **Set Up Monitoring**
- Configure Vercel Analytics
- Set up error tracking (e.g., Sentry)
- Monitor API performance

### 3. **Data Migration**
- Configure legacy database connection
- Run migration scripts
- Verify data integrity

### 4. **User Training**
- Create user guide
- Record training videos
- Schedule training sessions

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check all environment variables are set
   - Verify monorepo structure is intact
   - Check for git submodules (remove if present)

2. **Authentication Errors**
   - Verify NEXTAUTH_URL matches deployment URL
   - Check Google OAuth redirect URIs
   - Ensure NEXTAUTH_SECRET is set

3. **Database Connection**
   - Verify DATABASE_URL is correct
   - Check Supabase service is running
   - Ensure RLS policies aren't blocking access

4. **Missing Data**
   - Run database migrations
   - Check user has correct role
   - Verify API endpoints are working

## ✅ Final Verification

Before going live:
- [ ] All critical features tested
- [ ] Performance acceptable (< 3s page loads)
- [ ] Error handling working properly
- [ ] Logging capturing necessary info
- [ ] Security measures in place
- [ ] Backup procedures documented

The application is now ready for production deployment!