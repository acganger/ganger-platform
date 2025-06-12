# Shared Database Schema Documentation

## Database: `gangerne_apihub`

This document maps the current database structure used by both the Staff Portal and Tickets System, ensuring safe migration and new app development.

## Core Tables Used by Both Apps

### 1. `staff_tickets` - Main Ticket Storage
```sql
CREATE TABLE `staff_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `submitter_email` varchar(200) NOT NULL,
  `form_type` varchar(50) NOT NULL,           -- Differentiates app types
  `status` enum('Pending Approval','Open','In Progress','Stalled','Approved','Denied','Completed') NOT NULL DEFAULT 'Pending Approval',
  `priority` varchar(50) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `assigned_to_email` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `action_taken_at` datetime DEFAULT NULL,
  `completed_by` varchar(255) DEFAULT NULL,
  `request_type_virtual` varchar(100) GENERATED ALWAYS AS (json_unquote(json_extract(`payload`,'$.request_type'))) VIRTUAL,
  PRIMARY KEY (`id`),
  KEY `idx_form_type` (`form_type`),
  KEY `idx_status` (`status`),
  KEY `idx_submitter` (`submitter_email`)
);
```

**Form Types in Use:**
- `support_ticket` - Used by both Staff Portal and Tickets System
- `time_off_request` - Staff Portal only
- `punch_fix` - Staff Portal only
- `change_of_availability` - Staff Portal only
- `expense_reimbursement` - Staff Portal only
- `meeting_request` - Staff Portal only

### 2. `staff_ticket_comments` - Comment System
```sql
CREATE TABLE `staff_ticket_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `author_email` varchar(200) NOT NULL,
  `comment` text DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`ticket_id`) REFERENCES `staff_tickets` (`id`) ON DELETE CASCADE
);
```

## Staff Portal Specific Tables

### 3. `staff_user_cache` - Google OAuth User Data
```sql
CREATE TABLE `staff_user_cache` (
  `email` varchar(255) NOT NULL,
  `user_data` longtext NOT NULL,              -- JSON: {email, name, id, verified_email, picture}
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`email`)
);
```

### 4. `staff_login_attempts` - Security Logging
```sql
CREATE TABLE `staff_login_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `user_agent` varchar(255) DEFAULT NULL,
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);
```

### 5. `staff_job_queue` - Background Jobs
```sql
CREATE TABLE `staff_job_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `handler` varchar(100) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `priority` int(11) DEFAULT 0,
  `retry_count` int(11) DEFAULT 0,
  `status` enum('pending','running','complete','failed') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);
```

### 6. `staff_file_uploads` - File Management
```sql
CREATE TABLE `staff_file_uploads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `file_size` int(11) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `upload_path` varchar(500) NOT NULL,
  `uploaded_by` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `archived_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`ticket_id`) REFERENCES `staff_tickets` (`id`) ON DELETE CASCADE
);
```

## Shared Data Patterns

### JSON Payload Structure

**Support Tickets (both apps):**
```json
{
  "location": "Ann Arbor|Wixom|Plymouth|Vinya Construction",
  "priority": "Urgent + Important|Not Urgent + Important|Urgent + Not Important|Not Urgent + Not Important",
  "request_type": "IT (network, computer, software)|Building Maintenance (Indoor)|Property Maintenance (Outdoor)|General Support|Electrical|Admin Issue|Information Request",
  "details": "Description text",
  "submitter_name": "User Name",
  "photos": "comma,separated,urls"
}
```

**Staff Portal Forms:**
```json
{
  "submitter_name": "Employee Name",
  "submitter_email": "email@gangerdermatology.com",
  // Form-specific fields vary by form_type
}
```

### Status Workflow
```
Pending Approval → Approved/Denied
Approved → Open → In Progress → Completed
                → Stalled → (any status)
```

### Location Values
- `Ann Arbor` - Ganger Dermatology Ann Arbor
- `Wixom` - Ganger Dermatology Wixom  
- `Plymouth` - Ganger Dermatology Plymouth
- `Vinya Construction` - Vinya Construction office
- `Any/All` - General/multiple locations

### Priority Matrix (Eisenhower)
- `Urgent + Important` - Red, highest priority
- `Not Urgent + Important` - Orange, high priority
- `Urgent + Not Important` - Blue, medium priority
- `Not Urgent + Not Important` - Gray, low priority

## Safe Migration Strategy

### For New Apps (TimeTrader, L10, etc.)
**Option 1: New Tables (Recommended)**
```sql
-- TimeTrader tables
CREATE TABLE `lunch_appointments` (...)
CREATE TABLE `lunch_reps` (...)
CREATE TABLE `lunch_locations` (...)

-- L10 tables  
CREATE TABLE `l10_meetings` (...)
CREATE TABLE `l10_scorecard` (...)
```

**Option 2: Extend Existing (Caution)**
- Add new `form_type` values
- Ensure payload schema doesn't conflict
- Test thoroughly with existing apps

### Migration-Safe Rules
1. **Never modify existing ENUM values** in `staff_tickets.status`
2. **Never change existing column types** 
3. **Always ADD columns** with DEFAULT values
4. **Test form_type filtering** before deploying
5. **Use transactions** for data migrations
6. **Backup before any schema changes**

## Authentication & Permissions

### Current User Roles (Staff Portal)
Based on email patterns and hardcoded logic:
- **Staff**: Regular employees (@gangerdermatology.com)
- **Manager**: Specific emails or admin designation
- **SuperAdmin**: anand@gangerdermatology.com, ops@gangerdermatology.com

### Permission Matrix
| Feature | Staff | Manager | SuperAdmin |
|---------|-------|---------|------------|
| View own tickets | ✅ | ✅ | ✅ |
| View all tickets | ❌ | ✅ | ✅ |
| Approve/Deny | ❌ | ✅ | ✅ |
| Bulk actions | ❌ | ✅ | ✅ |
| User management | ❌ | ❌ | ✅ |
| Switch user | ❌ | ❌ | ✅ |

## Environment Variables (Shared)

Located in `/home/gangerne/.env`:
```env
# Database (shared by all apps)
DB_HOST=localhost
DB_NAME=gangerne_apihub
DB_USER=gangerne_apiuser
DB_PASS=[encrypted]

# Google OAuth (Staff Portal)
GOOGLE_CLIENT_ID=[hidden]
GOOGLE_CLIENT_SECRET=[hidden]
GOOGLE_REDIRECT_URI=https://gangerdermatology.com/staff/oauth2callback.php
GOOGLE_DOMAIN=gangerdermatology.com

# Integrations
SLACK_WEBHOOK_URL=[hidden]
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Current Data Volume
- **Total tickets**: ~134 active records
- **Comments**: ~10 records  
- **User cache**: ~15 cached users
- **File uploads**: Minimal usage
- **Job queue**: ~15 pending jobs

## Performance Considerations
- Add indexes for new query patterns
- Consider partitioning by form_type for large datasets
- Monitor JSON payload query performance
- Archive old completed tickets periodically

## Security Notes
- All apps share the same database user
- JSON payloads contain sensitive employee data
- File uploads use local filesystem storage
- Session data not stored in database (file-based)

---

*This schema supports both existing apps and provides safe extension points for new applications.*