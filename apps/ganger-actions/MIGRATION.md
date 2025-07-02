# Legacy Data Migration Guide

This document outlines the process for migrating data from the legacy PHP staff portal to the new Next.js/Supabase system.

## Overview

The migration script handles the transfer of:
- User profiles and authentication data
- Support tickets and issue tracking
- Comments and ticket discussions  
- File attachments and documents
- Manager relationships and organizational structure

## Prerequisites

### Environment Variables

Ensure the following environment variables are configured:

```bash
# Legacy MySQL Database
LEGACY_DB_HOST=localhost
LEGACY_DB_USER=gangerne_api_hub
LEGACY_DB_PASS=3D{.YAKxufOgoG^;t)
LEGACY_DB_NAME=gangerne_apihub
LEGACY_DB_PORT=3306

# Supabase Configuration
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google Workspace (for user sync)
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DOMAIN=gangerdermatology.com
GOOGLE_IMPERSONATE_EMAIL=anand@gangerdermatology.com
GOOGLE_TARGET_GROUP=gci-users@gangerdermatology.com
GOOGLE_TARGET_OU="/Google Cloud Identity"
```

### Database Access

1. **Legacy Database**: Ensure network access to the legacy MySQL database
2. **Supabase**: Verify service role key has admin permissions
3. **Backup**: Create a backup of both systems before migration

## Migration Process

### Step 1: Pre-Migration Validation

Run a dry-run to validate data and identify potential issues:

```bash
npm run migrate:legacy:dry-run
```

This will:
- Test database connections
- Validate data format and integrity
- Report potential migration issues
- Show migration statistics without making changes

### Step 2: Schema Preparation

Ensure the target Supabase database has the latest schema:

```sql
-- Run the migration file:
-- supabase/migrations/2025_01_11_create_staff_management_tables.sql
```

### Step 3: Full Migration

Execute the complete migration:

```bash
# Standard migration (batch size: 50)
npm run migrate:legacy

# Smaller batches for slower connections
npm run migrate:legacy:batch
```

### Step 4: Post-Migration Verification

1. **Data Integrity Check**:
   ```bash
   # Compare record counts
   SELECT COUNT(*) FROM staff_user_profiles;
   SELECT COUNT(*) FROM staff_tickets;
   SELECT COUNT(*) FROM staff_ticket_comments;
   SELECT COUNT(*) FROM staff_attachments;
   ```

2. **Relationship Validation**:
   ```sql
   -- Verify manager relationships
   SELECT COUNT(*) FROM staff_user_profiles WHERE manager_id IS NOT NULL;
   
   -- Verify ticket assignments
   SELECT COUNT(*) FROM staff_tickets WHERE assigned_to IS NOT NULL;
   ```

3. **Test User Authentication**:
   - Attempt login with migrated user accounts
   - Verify Google OAuth integration
   - Test permission levels (staff/manager/admin)

## Migration Details

### Data Mapping

The migration script handles automatic data transformation:

**User Roles**:
- `employee` → `staff`
- `supervisor` → `manager`  
- `administrator` → `admin`

**Ticket Status**:
- `new` → `pending`
- `working` → `in_progress`
- `resolved` → `completed`
- `rejected` → `cancelled`

**Locations**:
- `northfield` → `Northfield`
- `woodbury` → `Woodbury`
- `burnsville` → `Burnsville`
- `all`/`multiple` → `Multiple`

### Migration Order

1. **Users** (creates UUID mapping for foreign keys)
2. **Tickets** (depends on user IDs)
3. **Comments** (depends on users and tickets)
4. **Attachments** (depends on users and tickets)
5. **Form Definitions** (creates default forms)

### File Attachments

**Important**: File attachments are migrated as metadata only. The actual files remain in the legacy system with `storage_provider: 'legacy'`.

To complete file migration:
1. Use the attachment metadata to locate legacy files
2. Upload files to Supabase Storage
3. Update `file_path` and `storage_provider` fields

## Troubleshooting

### Common Issues

**Connection Errors**:
```bash
# Test legacy database connection
mysql -h $LEGACY_DB_HOST -u $LEGACY_DB_USER -p $LEGACY_DB_NAME

# Test Supabase connection
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_URL/rest/v1/"
```

**Permission Errors**:
- Verify Supabase service role key has admin permissions
- Check RLS policies allow service role access
- Ensure MySQL user has SELECT permissions on all tables

**Memory Issues**:
- Reduce batch size: `--batch-size=10`
- Run migration in segments by table
- Monitor database connection limits

### Data Validation Errors

**Missing Users**:
- Check user email format and domain restrictions
- Verify required fields (full_name, email)
- Review role mapping for invalid values

**Orphaned Records**:
- Comments without valid ticket IDs
- Tickets without valid submitter IDs
- Attachments with missing uploader IDs

**Duplicate Data**:
- Email addresses must be unique
- Ticket numbers should be unique
- Check for existing data in target tables

## Post-Migration Tasks

### 1. User Notification
- Send welcome emails to migrated users
- Provide new system training materials
- Update documentation with new procedures

### 2. System Configuration
- Configure email templates and notifications
- Set up automated backups
- Update DNS and redirect legacy URLs

### 3. File Migration
```bash
# Example file migration script
for attachment in legacy_attachments:
    local_file = download_from_legacy(attachment.file_path)
    supabase_path = upload_to_supabase(local_file)
    update_attachment_path(attachment.id, supabase_path)
```

### 4. Google Workspace Sync
After migration, sync users to Google Workspace:
```bash
# Via API
POST /api/admin/google-sync?action=bulk-sync
{
  "sync_all_active": true
}
```

### 5. Legacy System Decommission
1. Set legacy system to read-only mode
2. Redirect traffic to new system
3. Archive legacy data for compliance
4. Update external integrations and links

## Rollback Plan

If migration fails or critical issues are discovered:

1. **Stop New System**: Immediately disable access to new system
2. **Restore Legacy**: Ensure legacy system is accessible
3. **Data Cleanup**: Remove partially migrated data from Supabase
4. **Root Cause**: Analyze migration logs and errors
5. **Fix and Retry**: Address issues and re-run migration

## Support and Monitoring

### Migration Monitoring
- Check migration logs for errors and warnings
- Monitor database performance during migration
- Track user login success rates post-migration

### Performance Optimization
- Use connection pooling for large datasets
- Implement proper indexing in target tables
- Monitor memory usage during bulk operations

### Data Verification Queries

```sql
-- User migration verification
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active THEN 1 END) as active_users,
  COUNT(CASE WHEN manager_id IS NOT NULL THEN 1 END) as users_with_managers
FROM staff_user_profiles;

-- Ticket migration verification  
SELECT 
  status,
  COUNT(*) as ticket_count
FROM staff_tickets 
GROUP BY status;

-- Comment distribution
SELECT 
  t.status,
  COUNT(c.id) as comment_count
FROM staff_tickets t
LEFT JOIN staff_ticket_comments c ON t.id = c.ticket_id
GROUP BY t.status;
```

For additional support or migration issues, contact the development team or refer to the main project documentation.