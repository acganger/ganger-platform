# Shared API Services

*Last Updated: January 2025*

This directory contains reusable API service classes for the Ganger Platform. These services follow the singleton pattern and provide a consistent interface for all platform applications to interact with external APIs.

## 📋 Available Services

### 1. TwilioService
SMS and voice communication via Twilio API.

**Configuration:**
```php
// Environment variables (optional - has defaults)
TWILIO_ACCOUNT_SID=AC9931ff9e0373b113ff74896254b46ee4
TWILIO_AUTH_TOKEN=1842839203b725e0233d9a3f6179273e  
TWILIO_PHONE_NUMBER=+17348225566
TWILIO_TEST_MODE=false  // Set to true for testing without sending
```

**Usage:**
```php
use Ganger\Shared\Services\API\TwilioService;

$twilio = TwilioService::getInstance();

// Send single SMS
$result = $twilio->sendSMS('+1234567890', 'Your appointment is confirmed');

// Send bulk SMS
$recipients = ['+1234567890', '+0987654321'];
$result = $twilio->sendBulkSMS($recipients, 'Office closed for holiday');

// Get account info
$info = $twilio->getAccountInfo();

// Format phone number to E.164
$formatted = TwilioService::formatPhoneNumber('734-822-5566'); // Returns: +17348225566

// Validate phone number
$isValid = TwilioService::validatePhoneNumber('+17348225566'); // Returns: true
```

### 2. SendGridService
Email delivery via SendGrid API.

**Configuration:**
```php
// Environment variables (optional - has defaults)
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=noreply@gangerdermatology.com
SENDGRID_FROM_NAME=Ganger Dermatology
SENDGRID_SANDBOX_MODE=false  // Set to true for testing
```

**Usage:**
```php
use Ganger\Shared\Services\API\SendGridService;

$sendgrid = SendGridService::getInstance();

// Send single email
$result = $sendgrid->sendEmail([
    'to' => 'patient@example.com',
    'subject' => 'Appointment Reminder',
    'content' => 'Plain text content',
    'html' => '<p>HTML content</p>',
    'cc' => 'manager@gangerdermatology.com',
    'categories' => ['appointment', 'reminder']
]);

// Send bulk email
$recipients = ['user1@example.com', 'user2@example.com'];
$result = $sendgrid->sendBulkEmail(
    $recipients, 
    'Office Update', 
    'Plain text message',
    '<p>HTML message</p>'
);

// Send with template
$result = $sendgrid->sendTemplate(
    'patient@example.com',
    'd-template-id-here',
    ['name' => 'John Doe', 'date' => 'Jan 20']
);

// Validate email
$isValid = SendGridService::validateEmail('test@example.com'); // Returns: true
```

### 3. SlackService
Slack notifications via webhook and API.

**Configuration:**
```php
// Environment variables
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_APP_TOKEN=xapp-token  // Optional for advanced features
SLACK_BOT_TOKEN=xoxb-token  // Optional for advanced features
SLACK_DEFAULT_CHANNEL=#general
SLACK_DEFAULT_USERNAME=Ganger Platform
SLACK_DEFAULT_ICON=:hospital:
```

**Usage:**
```php
use Ganger\Shared\Services\API\SlackService;

$slack = SlackService::getInstance();

// Simple notification
$result = $slack->sendWebhook('System maintenance completed');

// Rich notification with formatting
$result = $slack->sendRichNotification(
    'Deployment Complete',
    'Version 2.0 deployed successfully',
    'success',  // Level: info, success, warning, error
    ['Version' => '2.0', 'Environment' => 'Production'],
    [['text' => 'View Changes', 'url' => 'https://github.com/...']]
);

// Error notification
$result = $slack->sendError(
    'Database connection failed',
    'PaymentProcessor',
    ['Server' => 'db-01', 'Error Code' => 'CONN_TIMEOUT']
);

// Success notification
$result = $slack->sendSuccess(
    'All tests passed',
    'CI/CD Pipeline',
    ['Tests Run' => 145, 'Duration' => '2m 30s']
);

// Deployment notification
$result = $slack->sendDeploymentNotification(
    'production',
    'v2.0.1',
    'anand@gangerdermatology.com',
    ['Fix: Authentication bug', 'Feature: New dashboard']
);

// System alert
$result = $slack->sendSystemAlert(
    'High memory usage detected',
    'high',  // Severity: low, medium, high, critical
    ['Memory Usage' => '92%', 'Server' => 'app-01']
);

// Text formatting helpers
$bold = SlackService::formatBold('Important');
$code = SlackService::formatCode('$result = true;');
$link = SlackService::formatLink('https://example.com', 'Click here');
```

### 4. TriNetService
HR management via TriNet/Zenefits API.

**Configuration:**
```php
// Environment variables (optional - has defaults)
TRINET_API_KEY=wn1Y6KKFRB2j+GCH47K0
TRINET_COMPANY_ID=923571
TRINET_SANDBOX_MODE=false
```

**Usage:**
```php
use Ganger\Shared\Services\API\TriNetService;

$trinet = TriNetService::getInstance();

// Get company info
$company = $trinet->getCompany();

// Get all employees
$employees = $trinet->getEmployees();

// Get active employees only
$activeEmployees = $trinet->getActiveEmployees();

// Get employee by email
$employee = $trinet->getEmployeeByEmail('john@gangerdermatology.com');

// Get employee details
$details = $trinet->getEmployee('employee-id-123');

// Get departments
$departments = $trinet->getDepartments();

// Get locations
$locations = $trinet->getLocations();

// Get employees by department
$deptEmployees = $trinet->getEmployeesByDepartment('dept-id');

// Get vacation requests
$vacationRequests = $trinet->getVacationRequests([
    'status' => 'approved',
    'start_date' => '2025-01-01',
    'end_date' => '2025-01-31'
]);

// Get employee's manager
$manager = $trinet->getEmployeeManager('employee-id');

// Get direct reports
$reports = $trinet->getDirectReports('manager-id');

// Check if employee exists
$exists = $trinet->employeeExists('test@gangerdermatology.com');

// Format employee data for display
$formatted = TriNetService::formatEmployee($employeeData);
```

### 5. ModMedAPI 
Electronic Medical Records via ModMed/EMA FHIR API v2.

**Location:** `/shared/Services/API/ModMedAPI.php`  
**Namespace:** `Ganger\Shared\Services\API\ModMedAPI`

**Configuration:**
```php
// Environment variables (optional - has defaults)
MODMED_API_KEY=d6544613-bac8-497e-97f9-8825012ad5bf
MODMED_OAUTH2_USER=fhir_cParg
MODMED_OAUTH2_PASS=DdoHuMihUN
MODMED_FIRM_ID=gangerderm
```

**Usage:**
```php
use Ganger\Shared\Services\API\ModMedAPI;

$api = ModMedAPI::getInstance();

// Search patients
$patients = $api->searchPatients(['name' => 'Smith'], 10);

// Get specific patient
$patient = $api->getPatient('144596');

// Get today's appointments
$appointments = $api->getTodaysAppointments();

// Search appointments with criteria
$appointments = $api->searchAppointments(['date' => '2025-01-20'], 50);

// Get practitioners/providers
$practitioners = $api->searchPractitioners([], 50);

// Get patient documents
$documents = $api->getPatientDocuments('144596');

// Get patient allergies
$allergies = $api->getPatientAllergies('144596');

// Get patient conditions/diagnoses
$conditions = $api->getPatientConditions('144596');

// Get patient medications
$medications = $api->getPatientMedications('144596');

// Get available appointment slots
$slots = $api->getAvailableSlots('230881', '2025-01-20', '2025-01-27');

// Test connection
$test = $api->testConnection();
if ($test['success']) {
    echo "Connected to ModMed API";
}

// Direct FHIR resource access
$bundle = $api->request('Patient', ['_count' => 10]);
```

**Features:**
- OAuth2 authentication with automatic token refresh
- FHIR v2 compliant resource access
- Automatic rate limiting (max 50 results per request)
- Comprehensive error handling
- Singleton pattern for efficiency
- Support for 12+ FHIR resources

## 🚀 Quick Start

### 1. Include Autoloader
```php
require_once '/path/to/shared/autoload.php';
```

### 2. Use Service
```php
use Ganger\Shared\Services\API\TwilioService;
use Ganger\Shared\Services\API\SendGridService;
use Ganger\Shared\Services\API\SlackService;

// Services use singleton pattern
$twilio = TwilioService::getInstance();
$sendgrid = SendGridService::getInstance();
$slack = SlackService::getInstance();
```

### 3. Handle Responses
All services return consistent response arrays:
```php
$result = $service->method();

if ($result['success']) {
    // Success
    $data = $result['data'] ?? [];
    $message = $result['message'];
} else {
    // Error
    $error = $result['error'];
    $message = $result['message'];
}
```

## 🔧 Common Features

### Singleton Pattern
All services use singleton pattern for efficiency:
```php
$service1 = ServiceName::getInstance();
$service2 = ServiceName::getInstance();
// $service1 === $service2 (same instance)
```

### Environment Variables
Services check environment variables first, then fall back to defaults:
```php
// In .env file
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

// Service will use env vars if available
$twilio = TwilioService::getInstance();
```

### Error Handling
All services include comprehensive error handling:
```php
try {
    $result = $service->method();
    if (!$result['success']) {
        error_log('API Error: ' . $result['error']);
    }
} catch (Exception $e) {
    error_log('Exception: ' . $e->getMessage());
}
```

### Test/Sandbox Modes
Most services support test modes:
```php
// Set in environment
TWILIO_TEST_MODE=true
SENDGRID_SANDBOX_MODE=true
TRINET_SANDBOX_MODE=true

// Services will simulate operations without making real API calls
```

### Windows Development Support
All services automatically detect Windows environment and disable SSL verification for local development:
```php
$isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, !$isWindows);
```

## 📊 Service Status

Check service status using the test script:
```bash
curl https://gangerdermatology.com/staff/test-api-connectivity.php
```

Or view in System Diagnostics:
```
https://gangerdermatology.com/staff/system-diagnostics.php
```

## 🔒 Security Notes

1. **Credentials**: All API credentials are stored in environment variables or have secure defaults
2. **Singleton Pattern**: Prevents multiple instances and credential exposure
3. **Error Logging**: Sensitive data is never logged
4. **SSL Verification**: Enabled in production, disabled only on Windows dev
5. **Rate Limiting**: Services include delays for bulk operations to avoid rate limits

## 📝 Adding New Services

To add a new API service:

1. Create new file in `/shared/Services/API/`:
```php
<?php
namespace Ganger\Shared\Services\API;

class NewService
{
    private static ?self $instance = null;
    
    private function __construct()
    {
        // Initialize with env vars
    }
    
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    // Add methods...
}
```

2. Update this README with usage examples

3. Add to test script (`test-api-connectivity.php`)

4. Configure environment variables in `.env`

## 🧪 Testing

Each service can be tested individually:

```php
// Test Twilio
$twilio = TwilioService::getInstance();
$info = $twilio->getAccountInfo();
var_dump($info);

// Test SendGrid  
$sendgrid = SendGridService::getInstance();
$result = $sendgrid->sendEmail([
    'to' => 'test@example.com',
    'subject' => 'Test',
    'content' => 'Test message'
]);
var_dump($result);

// Test Slack
$slack = SlackService::getInstance();
$result = $slack->sendWebhook('Test notification');
var_dump($result);
```

## 📞 Support

For issues or questions about these services:
- Check API documentation in `/API-Reference.md`
- Review service implementation in source files
- Check system diagnostics for real-time status
- Contact technical lead for API credential updates

---

*These shared services are designed to be used across all Ganger Platform applications for consistent API integration.*