# Ganger Platform MCP Server

A comprehensive Model Context Protocol (MCP) server designed specifically for testing and development of the Ganger Platform medical applications. This MCP provides mock authentication, test data management, application testing, and database management capabilities.

## Features

### 🔐 Mock Authentication
- Create test user accounts with realistic roles and permissions
- Generate valid JWT tokens for API testing
- Simulate Google OAuth flows without real credentials
- Validate test sessions and tokens

### 📊 Test Data Management
- Generate realistic medical test data for all applications
- Create test patients, appointments, inventory, and more
- Seed data for specific applications or entire platform
- Clear test data when testing is complete

### 🧪 Application Testing
- Test authentication flows for all platform applications
- Validate API endpoints with various user roles
- Test database operations (CRUD) with proper permissions
- Simulate complete user workflows end-to-end

### 💾 Database Management
- Reset test database to clean state
- Create and restore test data backups
- Check database health and connectivity
- Manage test environment isolation

## Installation

1. Navigate to the MCP server directory:
```bash
cd mcp-servers/ganger-platform-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

4. Configure environment variables (optional):
```bash
cp .env.example .env
# Edit .env with your test database settings
```

## Configuration

Add the server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ganger-platform": {
      "command": "node",
      "args": ["/path/to/ganger-platform/mcp-servers/ganger-platform-mcp/dist/index.js"],
      "env": {
        "TEST_DATABASE_URL": "postgresql://postgres:password@localhost:54322/postgres",
        "TEST_JWT_SECRET": "test-jwt-secret-ganger-platform-2025"
      }
    }
  }
}
```

## Usage Examples

### Authentication Testing

#### Create Test Users
```typescript
// Create an admin test user
create_test_user({
  email: "admin@test.gangerdermatology.com",
  role: "admin",
  department: "IT",
  permissions: ["*"]
})

// Create a staff user with specific permissions
create_test_user({
  email: "nurse@test.gangerdermatology.com", 
  role: "staff",
  department: "Nursing",
  permissions: ["read", "write", "inventory", "checkin"]
})
```

#### Generate Authentication Tokens
```typescript
// Generate a token for API testing
generate_test_token({
  userId: "user-id-from-create-user",
  expiresIn: "2h"
})

// Use the token in API requests
// Authorization: Bearer <generated-token>
```

#### Mock Google OAuth
```typescript
// Simulate OAuth flow
mock_google_oauth({
  email: "provider@test.gangerdermatology.com",
  returnUrl: "https://inventory.gangerdermatology.com/auth/callback"
})
```

### Test Data Generation

#### Seed Application Data
```typescript
// Seed data for all applications
seed_test_data({
  recordCount: 100
})

// Seed specific applications
seed_test_data({
  applications: ["inventory", "handouts"],
  recordCount: 50
})
```

#### Create Specific Test Data
```typescript
// Create test appointments
create_test_appointments({
  count: 25,
  dateRange: "30" // days from today
})

// Create test patients with medical histories
create_test_patients({
  count: 150,
  includeHistories: true
})

// Create test inventory
create_test_inventory({
  count: 300,
  locations: ["Ann Arbor", "Plymouth", "Wixom"]
})
```

### Application Testing

#### Test Authentication Flows
```typescript
// Test authentication for inventory app
test_app_authentication({
  appName: "inventory",
  testScenarios: ["Admin Access", "Staff Access", "Viewer Access"]
})
```

#### Test API Endpoints
```typescript
// Test all endpoints for an application
test_api_endpoints({
  appName: "handouts"
})

// Test specific endpoints
test_api_endpoints({
  appName: "inventory",
  endpoints: ["/api/inventory", "/api/inventory/scan"]
})
```

#### Test Database Operations
```typescript
// Test all CRUD operations
test_database_operations({
  operation: "all"
})

// Test specific operation on specific table
test_database_operations({
  operation: "create",
  table: "appointments"
})
```

#### Simulate User Workflows
```typescript
// Simulate patient check-in workflow
simulate_user_workflow({
  workflow: "patient-checkin",
  userType: "staff"
})

// Simulate inventory scanning workflow
simulate_user_workflow({
  workflow: "inventory-scan", 
  userType: "nurse",
  steps: ["login", "scan-barcode", "update-quantity"]
})
```

### Database Management

#### Reset Database
```typescript
// Reset to clean state
reset_test_database()
```

#### Backup and Restore
```typescript
// Create backup
backup_test_data({
  backupName: "pre-testing-state",
  includeLogs: false
})

// Restore from backup
restore_test_data({
  backupName: "pre-testing-state"
})
```

#### Health Checks
```typescript
// Check database health
check_database_health()
```

## Available Tools

### Authentication Tools
- `create_test_user` - Create test user accounts
- `generate_test_token` - Generate JWT tokens for API testing
- `mock_google_oauth` - Simulate Google OAuth flows
- `validate_test_session` - Validate tokens and sessions
- `cleanup_test_users` - Remove all test users

### Test Data Tools
- `seed_test_data` - Populate database with realistic test data
- `create_test_appointments` - Generate appointment data
- `create_test_patients` - Generate patient records
- `create_test_inventory` - Generate inventory data
- `clear_test_data` - Remove test data

### Testing Tools
- `test_app_authentication` - Test authentication flows
- `test_api_endpoints` - Test API endpoint functionality
- `test_database_operations` - Test database CRUD operations
- `simulate_user_workflow` - Simulate end-to-end workflows

### Database Tools
- `reset_test_database` - Reset database to clean state
- `backup_test_data` - Create data backups
- `restore_test_data` - Restore from backups
- `check_database_health` - Verify database status

## Supported Applications

The MCP supports testing for all Ganger Platform applications:

- **Inventory Management** (`inventory`) - Medical supply tracking
- **Patient Handouts** (`handouts`) - Educational material generation
- **Check-in Kiosk** (`checkin-kiosk`) - Patient self-service
- **EOS L10** (`eos-l10`) - Team management dashboard
- **Medication Authorization** (`medication-auth`) - Prior authorization
- **Pharmaceutical Scheduling** (`pharma-scheduling`) - Rep scheduling

## Security Features

- **Test Environment Isolation**: All operations are isolated to test environment
- **No Production Data Access**: Cannot access or modify production data
- **Realistic Test Data**: HIPAA-compliant synthetic medical data
- **Proper Authentication**: Implements same security patterns as production
- **Audit Logging**: All test operations are logged for debugging

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_DATABASE_URL` | Test database connection string | `postgresql://localhost:54322/postgres` |
| `TEST_JWT_SECRET` | JWT signing secret for test tokens | `test-jwt-secret-ganger-platform-2025` |
| `TEST_BACKUP_LOCATION` | Directory for test backups | `./test-backups` |

## Development

### Running in Development
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

## Integration with Ganger Platform

This MCP is designed to work seamlessly with the Ganger Platform's authentication and testing infrastructure:

- **Compatible with @ganger/auth**: Uses same JWT structure and validation
- **Matches Production API**: Same endpoint patterns and response formats
- **Realistic Data**: Generated data matches production schema exactly
- **Performance Testing**: Simulates realistic load and response times

## Best Practices

1. **Always use test domain emails**: `@test.gangerdermatology.com`
2. **Reset database between major test suites**: Use `reset_test_database`
3. **Create backups before destructive testing**: Use `backup_test_data`
4. **Validate tokens before API testing**: Use `validate_test_session`
5. **Clean up after testing**: Use `cleanup_test_users` and `clear_test_data`

## Troubleshooting

### Common Issues

**"Test user email must end with @test.gangerdermatology.com"**
- Use only test domain emails for test users
- Production domain emails are protected

**"Database connection failed"**
- Ensure Supabase is running locally: `npm run supabase:start`
- Check TEST_DATABASE_URL environment variable

**"Token validation failed"**
- Generate new token: `generate_test_token`
- Check token expiration time

**"Application not responding"**
- Ensure application is running: `npm run dev:app-name`
- Check application health endpoints

## License

MIT License - Part of the Ganger Platform medical application suite.