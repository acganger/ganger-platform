# Ganger Dermatology Platform

*Version 2.0 - Enterprise PHP Application Suite*  
*Last Updated: January 29, 2025*

## 🏥 Overview

The Ganger Dermatology Platform is a secure, HIPAA-compliant internal web application suite designed to streamline administrative and operational workflows for Ganger Dermatology's three locations (Ann Arbor, Wixom, Plymouth). Built with PHP 7.4+ and MySQL, it provides multiple integrated applications including a comprehensive ticketing system (Staff Portal), EOS implementation platform (L10), and unified authentication with Single Sign-On across all applications.

## 🏗️ Architecture

### Technology Stack

- **Backend**: PHP 7.4+ (Native, no framework)
- **Database**: MySQL 5.7+
- **Frontend**: Tailwind CSS 3.x (compiled), Alpine.js (minimal JavaScript)
- **Authentication**: Google OAuth 2.0 with Unified SSO System
- **Deployment**: Traditional web hosting with FTP deployment
- **Version Control**: Git with GitHub integration
- **Styling**: Centralized compiled CSS (`/staff/css/app.css`) shared across all apps

### Design Patterns

The application follows an **MVC (Model-View-Controller)** architecture:

- **Models** (`/src/Models/`): Data access and business logic
- **Views** (`/src/Views/`): Presentation templates
- **Controllers** (`/src/Controllers/`): Request handling and orchestration
- **Services** (`/src/Services/`): External integrations and utilities

### Core Components

1. **Autoloader** (`autoload.php`): Custom class loading and initialization
2. **Security Layer** (`/src/Security/`): CSRF protection, rate limiting, session management
3. **Database Abstraction** (`/src/Database/`): PDO-based database wrapper
4. **Configuration** (`/src/Config/`): Environment-based configuration management

## 📁 Directory Structure

```
/staff/
├── autoload.php              # System bootstrap and initialization
├── index.php                 # Entry point with authentication check
├── dashboard.php             # Main dashboard controller
├── form.php                  # Form submission interface
├── User-Create.php           # User management (manager-only)
├── status.php                # System health monitoring
├── oauth2callback.php        # Google OAuth callback handler
├── logout.php                # Session termination
│
├── /config/                  # Configuration files
│   ├── database.php          # Database connection settings
│   ├── forms.json            # Form type definitions
│   └── oauth.php             # OAuth configuration
│
├── /src/                     # Application source code
│   ├── /Config/              # Configuration management
│   ├── /Controllers/         # Request controllers
│   ├── /Database/            # Database abstraction
│   ├── /Models/              # Data models
│   ├── /Security/            # Security components
│   ├── /Services/            # Business services
│   └── /Views/               # View templates
│
├── /shared/                  # Platform-wide shared resources
│   ├── /Auth/                # Unified authentication system
│   ├── /components/          # Reusable UI components
│   └── /assets/              # CSS/JS assets
│
├── /uploads/                 # File upload directories
│   ├── /support_attachments/
│   ├── /time_off_attachments/
│   └── /[other_form_types]/
│
├── /css/                     # Compiled stylesheets
├── /js/                      # JavaScript files
├── /docs/                    # Documentation
├── /migrations/              # Database migrations
├── /logs/                    # Application logs
├── /v1/                      # Legacy version 1 code (reference)
└── /_backup_*/               # Timestamped backups

/l10/                         # L10 EOS Platform
├── autoload.php              # App initialization with model/service loading
├── dashboard.php             # Main dashboard with live data
├── oauth2callback.php        # OAuth handler (unified auth enabled)
├── /src/                     # Application source
│   ├── /Models/              # Data models
│   │   ├── Team.php          # Team management
│   │   ├── Rock.php          # 90-day priorities
│   │   ├── Issue.php         # IDS (Identify, Discuss, Solve)
│   │   ├── Todo.php          # Complete todo tracking
│   │   ├── Process.php       # EOS Process! documentation
│   │   ├── Scorecard.php     # Measurables tracking
│   │   ├── Meeting.php       # L10 meeting management
│   │   ├── VTO.php           # Vision/Traction Organizer
│   │   └── People.php        # People Analyzer
│   ├── /Services/            # Business services
│   │   ├── GoogleOUService.php      # Google Admin SDK integration
│   │   ├── ManagerService.php       # Manager/OU detection
│   │   ├── NotificationService.php  # Multi-channel notifications
│   │   └── AuthService.php          # Authentication handling
│   └── /Views/               # View templates
└── /admin/                   # Manager administration interface
```

### System Entry Points

- **`/staff/index.php`** - Main entry with authentication check
- **`/staff/oauth2callback.php`** - OAuth callback handler  
- **`/staff/api.php`** - Legacy AJAX endpoint handler (with compatibility layer)
- **`/staff/api/tickets.php`** - Modern REST API for ticket operations
- **`/staff/api/employees.php`** - Employee data API with real-time integration
- **`/staff/autocomplete.php`** - User search API
- **`/staff/worker.php`** - Background job processor
- **`/staff/submit.php`** - Form submission handler
- **`/staff/ticket.php`** - Ticket detail view

### File Upload Directories

The system organizes uploaded files by form type:

- **`/uploads/support_attachments/`** - Support ticket files
- **`/uploads/time_off_attachments/`** - Time off request documents
- **`/uploads/punch_fix_attachments/`** - Timecard corrections
- **`/uploads/change_of_availability_attachments/`** - Schedule changes
- **`/uploads/expense_reimbursement_attachments/`** - Expense receipts
- **`/uploads/meeting_request_attachments/`** - Meeting materials
- **`/uploads/impact_filter_attachments/`** - Impact filter documents
- **`/uploads/temp/`** - Temporary file staging
- **`/uploads/active/`** - Currently active documents
- **`/uploads/archived/`** - Archived documents

## 🔐 Security Architecture

### Authentication & Authorization

1. **Google OAuth 2.0 Integration**
   - Restricted to `@gangerdermatology.com` domain
   - 24-hour session timeout
   - Automatic session validation

2. **Access Control Levels**
   - **Staff**: Basic access to submit and view own tickets
   - **Manager**: Can approve/reject tickets, view all submissions
   - **Super User**: Full system access, debug capabilities

3. **Security Features**
   - CSRF token protection on all forms
   - Rate limiting (100 requests per minute)
   - Input sanitization and validation
   - Secure session management
   - SQL injection prevention via prepared statements
   - XSS protection through output encoding

### Special Security Measures

- **Blocked Accounts**: Shared account `office@gangerdermatology.com` is explicitly blocked
- **Session Hijacking Prevention**: IP and user agent validation
- **Security Headers**: Content Security Policy, X-Frame-Options, etc.

## 🔌 API Architecture & Best Practices

### Modern API Pattern (January 2025)

The platform now implements a **unified request handling pattern** that supports both JSON and FormData transparently, providing stability and consistency across all endpoints.

#### Core Components

1. **RequestParser** (`/src/Utils/RequestParser.php`)
   - Universal request handler supporting JSON, FormData, and URL-encoded data
   - Consistent response methods with proper HTTP status codes
   - CSRF token validation from multiple sources (body, headers, POST)
   - Reusable across all projects

2. **Modern API Endpoints** (`/api/`)
   - **`/api/tickets.php`** - RESTful ticket operations
   - **`/api/employees.php`** - Real-time employee data from multiple sources
   - Consistent JSON responses with success/error structure
   - Proper HTTP status codes (200, 400, 403, 404, 500)

3. **Compatibility Layer** (`api-compat.php`)
   - Ensures backward compatibility for legacy endpoints
   - Allows gradual migration from FormData to JSON
   - No breaking changes to existing code

#### API Response Standards

```json
// Success Response
{
    "success": true,
    "message": "Operation completed",
    "data": { ... }
}

// Error Response
{
    "success": false,
    "error": "Validation failed",
    "errors": [...]
}
```

#### JavaScript Client Pattern

```javascript
// Best Practice: Always use JSON for modern APIs
const response = await fetch('/staff/api/resource.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
        action: 'update',
        data: {...},
        csrf_token: csrfToken
    })
});
const result = await response.json();
```

For complete API implementation guidelines, see **[/docs/API_BEST_PRACTICES.md](./staff/docs/API_BEST_PRACTICES.md)**

## 💾 Database Structure

### Primary Tables

1. **staff_tickets**
   - Core ticketing system table
   - Stores all form submissions
   - JSON payload for flexible data storage

2. **ticket_files**
   - File attachment metadata
   - Links to physical files in `/uploads/`

3. **rate_limiting**
   - IP-based rate limit tracking
   - Automatic cleanup of old entries

### Key Fields

- All tables use auto-incrementing `id` as primary key
- Timestamps: `created_at`, `updated_at`
- Status tracking: `status` field with predefined values
- User tracking: `submitter_email`, `assigned_to`

## 🚀 Platform Applications

### Unified Authentication System (January 2025)
The platform now features a **Single Sign-On (SSO)** system that provides seamless authentication across all applications:
- **Location**: `/shared/Auth/UnifiedAuth.php`
- **Benefits**: Login once, access all apps; centralized security; consistent session management
- **Migration Status**: Staff Portal (ready), L10 App (✅ migrated)

### Applications

1. **Staff Portal** (`/staff/`)
   - Core ticketing and administrative system
   - Primary application for staff operations
   - Google OAuth with domain restriction

2. **L10 EOS Platform** (`/l10/`) 
   - Full Entrepreneurial Operating System (EOS) implementation
   - Team-based project management with Rocks, Issues, and To-Dos
   - **Process Documentation** following EOS "Process!" methodology (3-7 step rule, FBA tracking)
   - **Multi-Channel Notifications**: Email (SendGrid/SMTP), Slack webhooks, SMS (Twilio)
   - **Manager Detection**: Google Admin SDK with automatic managers OU detection
   - **Complete Todo System**: Overdue tracking, bulk operations, meeting integration
   - Integrated with unified authentication (SSO enabled)
   - Uses staff portal's compiled CSS for consistent UI/UX

3. **Additional Apps** (Coming Soon)
   - Social Media Management (`/socials/`)
   - Kiosk System (`/kiosk/`)

## 🚀 Features

### v3.0 "Delight" Release (January 2025)

The latest release includes 22 major enhancements focused on user experience:
- **Search & Discovery**: Global search, quick filters, ticket preview on hover
- **Communication**: @Mentions, quick comments, Slack integration
- **Visual Experience**: Animations, loading skeletons, toast notifications
- **Workflow**: Smart defaults, bulk actions, enhanced dark mode
- **Security**: Enhanced admin tools, account blocking, audit logging

See `/staff/docs/RELEASE_NOTES_v3.md` for complete v3.0 enhancement details.

### Core Functionality

1. **Multi-Form Ticketing System**
   - Support Tickets
   - Time Off Requests
   - Punch Fix Requests
   - Change of Availability
   - Expense Reimbursement
   - Meeting Requests
   - Impact Filter Requests

2. **Dashboard Features**
   - Tabbed interface for different ticket types
   - Real-time status updates
   - Quick actions (approve/reject)
   - Search and filter capabilities
   - Export functionality

3. **File Management**
   - Secure file uploads
   - Automatic file organization
   - Virus scanning integration (planned)
   - Size and type restrictions

4. **User Management**
   - Google Workspace user creation
   - Role assignment
   - Permission management

### Advanced UI Features

1. **Skeleton Loading System**
   - Loading states for better UX (`/css/skeletons.css`, `/js/skeletons.js`)
   - Automatic skeleton generation for tables and forms
   - Smooth transitions between loading and content

2. **Toast Notifications**
   - Non-intrusive user feedback (`/shared/assets/js/toast-notifications.js`)
   - Success, error, warning, and info variants
   - Auto-dismiss with configurable timing

3. **Mentions System**
   - @mentions in comments and notes (`/js/mentions.js`)
   - Auto-complete user suggestions
   - Real-time user search integration

4. **Smart Form Defaults**
   - Intelligent form pre-population (`/shared/assets/js/smart-defaults.js`)
   - Based on user history and context
   - Reduces repetitive data entry

5. **Success Animations**
   - Visual feedback for completed actions (`/shared/assets/css/success-animations.css`)
   - Checkmark animations for approvals
   - Smooth state transitions

6. **Multiple Dashboard Views**
   - Standard dashboard (`dashboard.php`)
   - Enhanced dashboard with advanced features (`dashboard_enhanced.php`)
   - Customizable view preferences

7. **Form Wizard Mode**
   - Step-by-step form completion (`form-wizard.php`)
   - Progress indicators
   - Validation at each step

## 🔧 Configuration

### API Integrations

For detailed API documentation, credentials, and integration guides, see:
- **[API-Reference.md](./API-Reference.md)** - Complete API documentation
  - TriNet HR API (Employee data, payroll, benefits)
  - **Google APIs** (OAuth, Admin SDK - ✅ Already configured with domain-wide delegation)
    - Service account at `/home/gangerne/service-account.json`
    - Used by both staff portal and L10 for OU detection
  - SendGrid API (Email notifications for L10 - needs credentials)
  - Twilio API (SMS notifications via MCP server - needs credentials)
  - Slack Webhooks (Team notifications - needs webhook URLs)
  - Deputy API (Scheduling - future)
  - ModMed API (EMR - future)
  - Stripe (via MCP server)

### Environment Variables (.env)

```bash
# Database Configuration
DB_HOST=localhost
DB_NAME=staff_portal
DB_USER=portal_user
DB_PASS=secure_password

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://gangerdermatology.com/staff/oauth2callback.php

# Application Settings
APP_ENV=production
APP_DEBUG=false
APP_URL=https://gangerdermatology.com/staff
SESSION_LIFETIME=1440  # 24 hours in minutes
```

### Form Configuration

Forms are defined in `/config/forms.json` with:
- Field definitions
- Validation rules
- Smart defaults
- Conditional logic

## 🛠️ Development Workflow

### Local Development

1. Clone repository
2. Configure `.env` file
3. Set up local MySQL database
4. Run database migrations
5. Configure local web server (Apache/Nginx)
6. Access via `http://localhost/staff/`

### Testing

The Staff Portal includes a comprehensive testing suite located in `/staff/testing/`:

#### Test Categories
1. **Infrastructure Tests** - Database, environment, sessions, file system
2. **Security Tests** - Authentication, authorization, CSRF, rate limiting
3. **UI Features Tests** - Notifications, mentions, copy functionality, smart defaults
4. **API & Forms Tests** - AJAX endpoints, form submissions, performance

#### Accessing Tests
- Navigate to `/staff/testing/` for the test dashboard
- Individual test suites available at `/staff/testing/[category].php`
- Authentication required; some tests need Manager/Super User access

#### Quick Links
- Test Dashboard: `/staff/testing/`
- Test Documentation: `/staff/testing/README.md`

### Deployment

1. **Pre-deployment Checks**
   - Run `verify_production.sh`
   - Check syntax with `syntax_check_all.php`

2. **Deployment Process**
   - Uses FTP for file transfer
   - GitHub Actions for CI/CD (planned)
   - Automatic cache clearing

3. **Post-deployment**
   - Verify system status at `/staff/status.php`
   - Monitor error logs
   - Test critical workflows

## 📊 Monitoring & Maintenance

### Health Checks

- **System Status Page** (`/staff/status.php`)
  - Database connectivity
  - Session validation
  - Environment variables
  - Upload directory permissions
  - Form configuration

### Logging

- **Application Logs**: `/logs/`
- **Security Events**: `/logs/security.log`
- **PHP Error Log**: Server-specific location

### Debug & Maintenance Tools (Super User Only)

- **`/staff/clear_opcache.php`** - Clear PHP opcache
- **`/staff/test_db.php`** - Database connectivity test
- **`/staff/debug_session.php`** - Session debugging
- **`/staff/verify_paths.php`** - Path verification
- **`/staff/syntax_check_all.php`** - PHP syntax validation
- **`/staff/phpinfo.php`** - PHP configuration info

### Performance Optimization

- OPcache enabled for production
- Database query optimization with indexes
- Lazy loading of components
- Minimal JavaScript usage

## 🔄 Recent Updates

### January 29, 2025 - API Pattern Modernization
- **Fixed**: Dashboard status update errors caused by JSON/FormData mismatch
- **Added**: Universal RequestParser utility for unified request handling
- **Added**: Modern REST API pattern with `/api/tickets.php` endpoint
- **Added**: Backward compatibility layer for legacy endpoints
- **Documented**: API best practices in `/staff/docs/API_BEST_PRACTICES.md`
- **Impact**: All status updates, comments, and bulk operations now work reliably

### Key Improvements
- Consistent JSON response format across all endpoints
- Support for both JSON and FormData transparently
- Proper HTTP status codes (200, 400, 403, 404, 500)
- Enhanced CSRF token validation from multiple sources
- Reusable pattern for new application development

## 📡 API Architecture & Best Practices

### Modern API Pattern
The Staff Portal now implements a standardized REST API pattern that serves as the template for all new development:

#### RequestParser Utility (`/src/Utils/RequestParser.php`)
Universal request parser that handles multiple content types:
```php
// Parse any request format (JSON, FormData, URL-encoded)
$input = RequestParser::parse();

// Get specific fields with defaults
$ticketId = RequestParser::get('ticket_id', 0);

// Send consistent JSON responses
RequestParser::successResponse(['data' => $result]);
RequestParser::errorResponse('Invalid input', 400);
```

#### Implementation Example
```php
// Modern API endpoint
require_once dirname(__DIR__) . '/autoload.php';

requireAuth();
$action = RequestParser::get('action', '');

try {
    switch ($action) {
        case 'update_status':
            handleStatusUpdate();
            break;
        default:
            RequestParser::errorResponse('Invalid action', 400);
    }
} catch (Exception $e) {
    RequestParser::errorResponse('Server error', 500);
}
```

#### JavaScript Client Pattern
```javascript
// Always use JSON for modern APIs
async function apiCall(action, data = {}) {
    const response = await fetch('/staff/api/resource.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            action: action,
            ...data,
            csrf_token: getCsrfToken()
        })
    });
    
    return await response.json();
}
```

### Benefits of the Pattern
- **Framework Agnostic**: Works with React, Vue, Alpine.js, jQuery
- **Testing Friendly**: Consistent JSON makes testing easier
- **Mobile Ready**: JSON APIs work seamlessly with mobile apps
- **Error Handling**: Standardized error responses
- **Future Proof**: Industry-standard REST patterns

For complete implementation guide, see `/staff/docs/API_BEST_PRACTICES.md`

## 🚨 HIPAA Compliance

### Data Protection

- Encrypted data transmission (HTTPS only)
- Secure file storage with access controls
- Audit logging for all data access
- Regular security updates

### Access Controls

- Role-based permissions
- Automatic session timeout
- Two-factor authentication (via Google)
- IP restriction capabilities

### Audit Trail

- All actions logged with timestamp
- User identification on all operations
- Data modification tracking
- Export capabilities for compliance reporting

## 🐛 Known Issues & Limitations

1. **Browser Compatibility**: Optimized for Chrome, Firefox, Safari (modern versions)
2. **Mobile Experience**: Responsive but not mobile-first design
3. **File Size Limits**: 10MB per file, configurable in PHP settings
4. **Concurrent Users**: Tested up to 50 concurrent users

## 🎯 L10 Platform Features

### EOS Process Documentation System
Following the methodology from "Process!" by Mike Paton and Lisa Gonzalez:
- **3-7 Step Rule**: Enforces the 20/80 principle for process simplification
- **Process Types**: Core (customer-facing), Support (internal), Management (leadership)
- **FBA Tracking**: "Followed By All" compliance monitoring
- **Version Control**: Track all process changes with versioning
- **90-Day Reviews**: Automatic reminders for process reviews
- **Measurables**: Define and track process effectiveness metrics

### Notification System
Multi-channel notification capabilities:
- **Email**: SendGrid API (primary) or SMTP fallback with HTML templates
- **Slack**: Webhook integration with formatted message cards
- **SMS**: Twilio integration with automatic 160-character truncation
- **Event Types**: 10 pre-configured L10 event notifications
- **User Preferences**: Respects individual channel preferences

### Manager Detection & Leadership Team
- **Primary**: Google Admin SDK checks for /Managers OU membership
- **Integration**: Reuses staff portal's existing Google Admin SDK with domain-wide delegation
- **Service Account**: Located at `/home/gangerne/service-account.json` (production)
- **Admin Impersonation**: Uses anand@gangerdermatology.com for API calls
- **Automatic Assignment**: Users in /Managers OU automatically join Leadership team
- **Fallback Support**: Manual configuration when API unavailable (anand@gangerdermatology.com hardcoded)
- **Role-Based Access**: Leader, Member, and Viewer roles per team

### Todo Management System
Complete task tracking with:
- **Smart Sorting**: By status, due date, and priority
- **Overdue Detection**: Automatic flagging of past-due items
- **Bulk Operations**: Update multiple todos simultaneously
- **Meeting Integration**: Link todos to specific L10 meetings
- **Statistics**: Completion rates, assignee workload, trends
- **Due Soon Alerts**: Configurable day-ahead notifications

## 📝 Documentation

### Available Documentation

- `/docs/TECHNICAL_DOCUMENTATION.md` - Technical details
- `/docs/MANAGER-GUIDE.md` - Manager user guide
- `/docs/STAFF-USER-GUIDE.md` - Staff user guide
- `/docs/DEPLOYMENT_GUIDE.md` - Deployment instructions
- `/docs/SECURITY_UPDATES.md` - Security patch history

### API Documentation

The Staff Portal provides both legacy and modern API endpoints:

#### Legacy Endpoints (with compatibility layer)
- `/api.php` - Internal AJAX endpoints (supports JSON and FormData)
- `/autocomplete.php` - User search endpoint
- `/worker.php` - Background job processing

#### Modern REST API (Best Practice Pattern)
- `/api/tickets.php` - Ticket operations (status, comments, bulk updates)
- `/api/employees.php` - Employee data operations (future)

## 👥 Support & Maintenance

### Contact Information

- **Technical Support**: IT Department
- **Bug Reports**: Create ticket via Support Ticket form
- **Feature Requests**: Submit via Meeting Request form

### Development Team

- **Lead Developer**: Configured in system
- **Maintained By**: Ganger Dermatology IT Team
- **AI Assistant**: Claude Code for automation

## 📜 License & Compliance

This is proprietary software owned by Ganger Dermatology. 
- Not for public distribution
- HIPAA-compliant medical software
- Subject to healthcare regulations

---

*© 2025 Ganger Dermatology. All rights reserved.*