# User Management Database Schema

*Comprehensive documentation for the Ganger Platform user management system*  
*Last Updated: January 7, 2025 1:45 AM EST*

---

## 📊 Overview

The user management system provides a complete solution for employee profiles, roles, permissions, and organizational structure. Built with Row Level Security (RLS) for data protection and audit trails for compliance.

---

## 🗄️ Database Tables

### 1. **user_profiles**
*Core employee profile information*

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key, references auth.users | PK, FK |
| employee_id | VARCHAR(50) | Unique employee identifier | UNIQUE |
| full_name | VARCHAR(255) | Employee full name | NOT NULL |
| email | VARCHAR(255) | Employee email address | UNIQUE, NOT NULL |
| phone | VARCHAR(50) | Contact phone number | - |
| department | VARCHAR(100) | Department name | - |
| position | VARCHAR(100) | Job title/position | - |
| role | VARCHAR(50) | System role | CHECK IN ('admin', 'manager', 'staff', 'intern') |
| location | VARCHAR(50) | Primary work location | CHECK IN ('Ann Arbor', 'Wixom', 'Plymouth', 'Remote', 'All') |
| manager_id | UUID | Reference to manager's profile | FK to user_profiles |
| hire_date | DATE | Employment start date | - |
| is_active | BOOLEAN | Active employment status | DEFAULT true |
| profile_picture_url | TEXT | URL to profile image | - |
| google_user_data | JSONB | Google Workspace metadata | - |
| skills | TEXT[] | Array of skills/certifications | - |
| emergency_contact | JSONB | Emergency contact information | - |
| created_at | TIMESTAMPTZ | Record creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | Last update timestamp | DEFAULT NOW() |

**Indexes:**
- idx_user_profiles_email
- idx_user_profiles_manager_id
- idx_user_profiles_location
- idx_user_profiles_department
- idx_user_profiles_is_active

### 2. **user_permissions**
*Granular permission assignments*

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK |
| user_id | UUID | User receiving permission | FK to user_profiles |
| permission | VARCHAR(100) | Permission name | NOT NULL |
| granted_by | UUID | User who granted permission | FK to user_profiles |
| granted_at | TIMESTAMPTZ | When permission was granted | DEFAULT NOW() |
| expires_at | TIMESTAMPTZ | Optional expiration date | - |

**Unique Constraint:** (user_id, permission)

**Indexes:**
- idx_user_permissions_user_id
- idx_user_permissions_permission

### 3. **manager_assignments**
*Historical tracking of manager-employee relationships*

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK |
| employee_id | UUID | Employee in relationship | FK to user_profiles |
| manager_id | UUID | Manager in relationship | FK to user_profiles |
| start_date | DATE | Assignment start date | NOT NULL, DEFAULT CURRENT_DATE |
| end_date | DATE | Assignment end date (null = current) | - |
| reason | VARCHAR(255) | Reason for change | - |
| created_by | UUID | User who made the assignment | FK to user_profiles |
| created_at | TIMESTAMPTZ | Record creation timestamp | DEFAULT NOW() |

**Indexes:**
- idx_manager_assignments_employee_id
- idx_manager_assignments_manager_id
- idx_manager_assignments_dates

### 4. **departments**
*Organizational structure*

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK |
| name | VARCHAR(100) | Department name | UNIQUE, NOT NULL |
| description | TEXT | Department description | - |
| head_id | UUID | Department head | FK to user_profiles |
| parent_department_id | UUID | Parent department for hierarchy | FK to departments |
| created_at | TIMESTAMPTZ | Creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | Last update timestamp | DEFAULT NOW() |

**Default Departments:**
- Administration
- Clinical
- Operations
- IT
- Finance
- Marketing

### 5. **user_activity_log**
*Audit trail for user actions*

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK |
| user_id | UUID | User who performed action | FK to user_profiles |
| action | VARCHAR(100) | Action performed | NOT NULL |
| details | JSONB | Additional action details | - |
| ip_address | INET | Client IP address | - |
| user_agent | TEXT | Browser/client information | - |
| created_at | TIMESTAMPTZ | Action timestamp | DEFAULT NOW() |

**Indexes:**
- idx_user_activity_log_user_id
- idx_user_activity_log_action
- idx_user_activity_log_created_at

---

## 🔒 Row Level Security Policies

### user_profiles
- **View**: All users can view active profiles
- **Update Own**: Users can update their own profile
- **Full Access**: Admins and managers can manage all profiles

### user_permissions
- **View Own**: Users can view their own permissions
- **Full Access**: Admins can manage all permissions

### manager_assignments
- **View**: Everyone can view manager assignments
- **Manage**: Admins and managers can create/update assignments

### departments
- **View**: Everyone can view departments
- **Manage**: Admins can manage departments

### user_activity_log
- **View Own**: Users can view their own activity
- **View All**: Admins can view all activity

---

## 🔧 Helper Functions

### `handle_new_user()`
*Automatically creates user profile when auth.users record is created*

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### `get_team_members(manager_uuid UUID)`
*Returns all active direct reports for a manager*

**Returns:**
- id, full_name, email, position, department, location, hire_date

### `user_has_permission(user_uuid UUID, permission_name VARCHAR)`
*Checks if user has specific permission*

**Logic:**
1. Checks direct permission assignment
2. Checks role-based permissions (admins have all)
3. Managers get team management permissions

---

## 🎯 Role-Based Permissions

### Admin
- All permissions
- User management
- System configuration
- Full data access

### Manager
- View and manage team members
- Approve time off requests
- Approve expense reimbursements
- View team analytics

### Staff
- View own profile
- Update own information
- Submit forms
- View directory

### Intern
- Limited staff permissions
- Restricted data access

---

## 📡 API Endpoints

### GET /api/users
*List users with filtering and pagination*

**Query Parameters:**
- search: Search by name or email
- department: Filter by department
- location: Filter by location
- role: Filter by role
- manager_id: Filter by manager
- is_active: Filter active/inactive
- page: Page number
- limit: Results per page

**Response:**
```json
{
  "users": [...],
  "total": 150,
  "page": 1,
  "limit": 50,
  "filters": {
    "departments": [...],
    "locations": [...],
    "roles": [...]
  }
}
```

### POST /api/users
*Create new user (admin/manager only)*

**Request Body:**
```json
{
  "email": "user@gangerdermatology.com",
  "full_name": "John Doe",
  "phone": "555-0123",
  "department": "Clinical",
  "position": "Medical Assistant",
  "role": "staff",
  "location": "Ann Arbor",
  "manager_id": "uuid",
  "hire_date": "2025-01-07",
  "employee_id": "EMP001"
}
```

---

## 🔄 Migration & Setup

### Apply Migration
```bash
# Run migration
psql $DATABASE_URL < supabase/migrations/20250107_create_user_management_tables.sql

# Or via Supabase CLI
supabase db push
```

### Initial Setup
1. Migration creates tables and indexes
2. RLS policies are automatically applied
3. Default departments are inserted
4. Triggers are set up for profile creation

---

## 🎨 Usage Examples

### Get User's Team
```sql
SELECT * FROM get_team_members('manager-uuid-here');
```

### Check Permission
```sql
SELECT user_has_permission('user-uuid', 'approve_expenses');
```

### Find Users by Department
```sql
SELECT * FROM user_profiles 
WHERE department = 'Clinical' 
  AND is_active = true
ORDER BY full_name;
```

### Get Manager History
```sql
SELECT * FROM manager_assignments
WHERE employee_id = 'employee-uuid'
ORDER BY start_date DESC;
```

---

## 🚨 Important Notes

1. **Email Domain**: System enforces @gangerdermatology.com domain
2. **Profile Creation**: Automatic on auth.users insert
3. **Soft Deletes**: Use is_active=false instead of deleting
4. **Audit Trail**: All changes logged to user_activity_log
5. **Manager Chain**: Can traverse up via manager_id recursively

---

*This schema provides a complete, secure, and auditable user management system for the Ganger Platform.*