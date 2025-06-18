# PRD - Employee Device Management System
*Automated device enrollment and WiFi access control with attendance tracking assistance*

**📚 Documentation Reference:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: Employee Device Management
- **PRD ID**: PRD-EDM-001
- **Priority**: High 
- **Development Timeline**: 3-4 weeks (based on PROJECT_TRACKER.md velocity data)
- **Terminal Assignment**: Mixed (Frontend UI + Backend UniFi integration)
- **Dependencies**: @ganger/auth, @ganger/integrations/server (Twilio, UniFi), @ganger/ui
- **MCP Integration Requirements**: UniFi MCP (installed), Twilio MCP, Supabase MCP
- **Quality Gate Requirements**: Standard gates + UniFi API integration testing

---

## 🎯 Product Overview

### **Purpose Statement**
Automate employee personal device enrollment for WiFi access and provide attendance tracking assistance through network connection analytics.

### **Target Users**
- **Primary**: Managers and HR staff (device approval, attendance verification)
- **Secondary**: All employees (device enrollment via QR code/SMS)
- **Tertiary**: IT administrators (network security oversight)

### **Success Metrics**
- 95% employee device enrollment within 30 days of launch
- 50% reduction in manual WiFi access requests to IT
- 25% reduction in timesheet correction requests through network-based attendance assistance
- 100% automated MAC address lifecycle management (hire/terminate)

### **Business Value Measurement**
- **ROI Target**: 300% within 6 months (IT time savings + HR efficiency)
- **Cost Savings**: $2,400/month in IT support time (4 hours/week @ $150/hour)
- **Revenue Impact**: Indirect revenue protection through improved time tracking accuracy
- **User Productivity**: 15 minutes/employee saved on WiFi setup, 10 minutes/manager saved per timesheet correction

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard - MANDATORY)**
```yaml
Frontend: Next.js 14+ with TypeScript (100% compilation required)
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers (with global edge network)
Styling: Tailwind CSS + Ganger Design System (NO custom CSS allowed)
Real-time: Supabase subscriptions for device status updates
File Storage: Supabase Storage for QR code generation
Build System: Turborepo (workspace compliance required)
Quality Gates: Automated pre-commit hooks (see MASTER_DEVELOPMENT_GUIDE.md)
```

### **Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { 
  Button, Card, DataTable, FormField, Input, Modal, QRCodeGenerator,
  LoadingSpinner, StatCard, Toast
} from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { validateForm, formatDate, formatTime } from '@ganger/utils/client';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { db, createClient, Repository } from '@ganger/db';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { 
  ServerCommunicationService,  // Twilio SMS for device verification
  ServerUniFiService          // UniFi MCP for WiFi management
} from '@ganger/integrations/server';
import { analytics, auditLog, healthCheck } from '@ganger/utils/server';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  User, Device, NetworkConnection, TimeEntry,
  ApiResponse, PaginationMeta, ValidationRule
} from '@ganger/types';
```

### **App-Specific Technology**
- **UniFi Controller API**: Network device management and client tracking
- **QR Code Generation**: Dynamic enrollment links for device registration
- **SMS Verification**: Twilio integration for mobile number confirmation
- **Device Fingerprinting**: Browser/native APIs for device identification
- **Real-time Monitoring**: Live device status and connection tracking

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard - Updated Hierarchy)**
```typescript
// Device management permissions
interface DevicePermissions {
  enrollOwnDevices: ['superadmin', 'manager', 'provider', 'nurse', 'medical_assistant', 'pharmacy_tech', 'billing', 'user'];
  approveDevices: ['superadmin', 'manager'];
  viewAllDevices: ['superadmin', 'manager'];
  viewConnectionHistory: ['superadmin', 'manager'];
  manageWiFiAccess: ['superadmin', 'manager'];
  viewAttendanceData: ['superadmin', 'manager'];
  manualTimeEntry: ['superadmin', 'manager'];
}

// Location-based access control
const hasLocationAccess = PermissionService.canAccessLocation(user, employee.locationId);
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Multi-location Access**: Managers can only view devices for their assigned locations
- **Device Ownership**: Employees can only enroll devices linked to their mobile number
- **Attendance Data**: Managers can only view attendance data for their direct reports

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff
```

### **App-Specific Tables**
```sql
-- Employee devices and enrollment
CREATE TABLE employee_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('phone', 'tablet', 'laptop', 'watch', 'other')),
  mac_address TEXT UNIQUE NOT NULL,
  device_fingerprint JSONB, -- Browser/OS info, screen resolution, etc.
  mobile_number TEXT, -- For SMS verification
  enrollment_method TEXT CHECK (enrollment_method IN ('qr_code', 'sms_link', 'manual')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  wifi_access_enabled BOOLEAN DEFAULT false,
  unifi_client_id TEXT, -- UniFi client identifier
  last_seen_network TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- RLS policy: Users can view own devices, managers can view all in their locations
  CONSTRAINT device_ownership CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN location_staff ls ON ur.user_id = ls.user_id
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('manager', 'superadmin')
      AND ls.location_id = (SELECT location_id FROM location_staff WHERE user_id = employee_devices.user_id)
    )
  )
);

-- Device enrollment sessions
CREATE TABLE device_enrollment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  mobile_number TEXT NOT NULL,
  qr_code_url TEXT,
  sms_sent BOOLEAN DEFAULT false,
  verification_code TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  device_id UUID REFERENCES employee_devices(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Network connection history (from UniFi)
CREATE TABLE network_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES employee_devices(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  unifi_client_id TEXT NOT NULL,
  connection_start TIMESTAMPTZ NOT NULL,
  connection_end TIMESTAMPTZ,
  access_point_name TEXT,
  access_point_location TEXT,
  ip_address INET,
  data_usage_mb NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for attendance queries
  INDEX idx_network_connections_user_date ON network_connections(user_id, DATE(connection_start))
);

-- Attendance assistance data
CREATE TABLE attendance_network_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  analysis_date DATE NOT NULL,
  first_connection TIMESTAMPTZ,
  last_disconnection TIMESTAMPTZ,
  total_connections INTEGER DEFAULT 0,
  total_time_on_network INTERVAL,
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  suggested_clock_in TIME,
  suggested_clock_out TIME,
  manager_reviewed BOOLEAN DEFAULT false,
  manager_id UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, analysis_date)
);
```

### **Data Relationships**
- **Devices to Users**: One employee can have multiple devices (phone, tablet, watch)
- **Connections to Devices**: Historical network connection tracking
- **Attendance Analysis**: Daily aggregation of network presence for time tracking assistance
- **Location-based Access**: Managers can only access data for employees in their locations

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated with Response Standards)**
```typescript
// Device management CRUD
GET    /api/devices                 // List user's devices (or all for managers)
POST   /api/devices                 // Create new device enrollment session
GET    /api/devices/[id]            // Get specific device details
PUT    /api/devices/[id]            // Update device (approval, WiFi access)
DELETE /api/devices/[id]            // Remove device and revoke WiFi access

// Enrollment flow
POST   /api/devices/enroll/start    // Generate QR code and send SMS
GET    /api/devices/enroll/[token]  // Device enrollment landing page
POST   /api/devices/enroll/verify   // Complete device enrollment with verification

// Manager functions
GET    /api/devices/pending         // Devices awaiting approval
POST   /api/devices/[id]/approve    // Approve device for WiFi access
POST   /api/devices/[id]/reject     // Reject device enrollment

// Attendance assistance
GET    /api/attendance/network      // Network-based attendance data
POST   /api/attendance/analyze      // Generate attendance suggestions for date range
GET    /api/attendance/user/[id]    // Specific employee's network presence
```

### **App-Specific Endpoints**
```typescript
// UniFi integration endpoints
POST   /api/unifi/sync-devices      // Sync with UniFi controller
GET    /api/unifi/network-status    // Real-time network status
POST   /api/unifi/provision-access  // Add MAC to WiFi access list
DELETE /api/unifi/revoke-access     // Remove MAC from WiFi access list

// Attendance assistance
GET    /api/attendance/daily/[date] // Daily attendance analysis for all employees
POST   /api/attendance/manual-entry // Manager manual time entry with network reference
GET    /api/attendance/missing-punches // Employees with missing clock in/out
```

### **External Integrations (Use Universal Hubs ONLY)**
```typescript
// ✅ REQUIRED: Use Universal Hubs - NO direct external API calls
import { 
  UniversalCommunicationHub,  // Twilio MCP (SMS verification)
  UniversalUniFiHub,         // UniFi MCP (WiFi management)
  UniversalDatabaseHub       // Supabase MCP (Device data)
} from '@ganger/integrations/server';

// SMS verification for device enrollment
const commHub = new UniversalCommunicationHub();
await commHub.sendSMS({
  to: employee.mobileNumber,
  message: `Device enrollment link: ${enrollmentUrl}\nVerification code: ${verificationCode}`
});

// UniFi WiFi access management
const unifiHub = new UniversalUniFiHub();
await unifiHub.addClientToWiFiGroup({
  macAddress: device.macAddress,
  groupName: 'staff_devices',
  description: `${employee.name} - ${device.deviceName}`
});

// Network connection monitoring
const connections = await unifiHub.getClientConnections({
  macAddress: device.macAddress,
  startDate: startOfDay,
  endDate: endOfDay
});
```

**Integration Details:**
- **UniFi Controller**: WiFi access provisioning, client monitoring, connection history
- **Twilio SMS**: Device verification, enrollment notifications
- **Supabase Real-time**: Live device status updates, connection monitoring

---

## 🎨 User Interface Design

### **Component Usage**
```typescript
// Device enrollment interface
import {
  QRCodeDisplay,           // Generated QR codes for device enrollment
  DeviceCardList,          // Employee's enrolled devices
  NetworkStatusIndicator,  // Real-time connection status
  AttendanceTimelineCard,  // Network-based attendance visualization
  DeviceApprovalPanel,     // Manager device approval interface
  TimeEntryAssistant      // Network-suggested time entries
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **QR Code Display**: Large, scannable codes with fallback SMS option
- **Device Status Cards**: Real-time indicators (connected, disconnected, pending approval)
- **Network Timeline Visualization**: Daily connection patterns for attendance assistance
- **Mobile-First Enrollment**: Touch-optimized device enrollment flow
- **Manager Dashboard**: Batch device approval and attendance review interface

---

## 📱 User Experience

### **User Workflows**

**1. Employee Device Enrollment**
```
Employee → Profile Page → "Add Device" Button → 
QR Code Generated + SMS Sent → 
Scan QR on Device OR Click SMS Link → 
Device Info Captured → 
Verification Code Entry → 
Manager Approval → 
WiFi Access Granted
```

**2. Manager Attendance Assistance**
```
Manager → Staff Dashboard → "Missing Timesheet" Alert → 
View Network Timeline → 
See First/Last Connection Times → 
Click "Suggest Time Entry" → 
Review + Adjust Times → 
Submit Manual Time Entry
```

**3. Device Lifecycle Management**
```
Employee Termination → 
HR System Update → 
Automated MAC Address Removal → 
WiFi Access Revoked → 
Device Status: Inactive
```

### **Performance Requirements (Enforced by Performance Budgets)**
```typescript
const PERFORMANCE_BUDGETS = {
  fcp: 1000, // 1.0s max (critical for mobile enrollment)
  lcp: 1800, // 1.8s max
  cls: 0.1,  // Max 0.1 CLS score
  tti: 2500, // 2.5s max
};

// Real-time features
networkStatusUpdates: 200, // 200ms max latency
deviceApprovalResponse: 500, // 500ms max approval processing
qrCodeGeneration: 100, // 100ms max QR code creation
```

### **Mobile-First Considerations**
- **Touch-Optimized Enrollment**: Large touch targets, simple one-handed operation
- **Camera Integration**: Direct QR code scanning with camera permissions
- **Offline Capability**: Enrollment form caching for poor network conditions
- **Progressive Enhancement**: Works on older mobile browsers

---

## 🧪 Testing Strategy

### **App-Specific Testing**
```typescript
// UniFi integration testing
describe('UniFi WiFi Management', () => {
  it('provisions WiFi access for approved devices', async () => {
    const device = await createTestDevice({ verified: true, approved: true });
    const result = await unifiHub.addClientToWiFiGroup(device.macAddress);
    expect(result.success).toBe(true);
  });
  
  it('removes WiFi access when employee terminated', async () => {
    const employee = await createTestEmployee({ status: 'terminated' });
    await processEmployeeTermination(employee.id);
    const access = await unifiHub.checkClientAccess(employee.devices[0].macAddress);
    expect(access.hasAccess).toBe(false);
  });
});

// SMS verification testing
describe('Device Enrollment SMS', () => {
  it('sends verification SMS with enrollment link', async () => {
    const session = await startDeviceEnrollment(testUser.id, '+1234567890');
    expect(session.smsRequest.sent).toBe(true);
    expect(session.smsRequest.message).toContain(session.enrollmentUrl);
  });
});

// Attendance analysis testing
describe('Network-Based Attendance', () => {
  it('calculates suggested clock times from network connections', async () => {
    const connections = createMockConnections('2025-01-15', {
      firstConnection: '08:30:00',
      lastDisconnection: '17:15:00'
    });
    const analysis = await analyzeAttendanceFromNetwork(testUser.id, connections);
    expect(analysis.suggestedClockIn).toBe('08:30:00');
    expect(analysis.suggestedClockOut).toBe('17:15:00');
    expect(analysis.confidenceScore).toBeGreaterThan(0.8);
  });
});
```

### **Integration Testing Scenarios**
- **Device Enrollment Flow**: Complete QR → SMS → Verification → Approval cycle
- **WiFi Provisioning**: MAC address addition/removal from UniFi controller
- **Attendance Analysis**: Network connection pattern analysis accuracy
- **Cross-Location Security**: Manager access restrictions for multi-location setup
- **Employee Termination**: Automated device deactivation workflow

---

## 🚀 Deployment & Operations

### **Environment Configuration**
```bash
# App-specific environment variables
UNIFI_CONTROLLER_URL=https://unifi.gangerdermatology.com:8443
UNIFI_USERNAME=device-manager
UNIFI_PASSWORD=[secure_password]
UNIFI_SITE_ID=default

TWILIO_ACCOUNT_SID=[existing_twilio_account]
TWILIO_AUTH_TOKEN=[existing_twilio_token]
TWILIO_PHONE_NUMBER=[staff_sms_number]

DEVICE_ENROLLMENT_DOMAIN=devices.gangerdermatology.com
QR_CODE_BASE_URL=https://devices.gangerdermatology.com/enroll
```

### **Monitoring & Alerts**
- **UniFi API Health**: Monitor controller connectivity and API response times
- **Device Enrollment Success Rate**: Track enrollment completion percentage
- **WiFi Access Failures**: Alert on MAC address provisioning failures
- **Attendance Analysis Accuracy**: Monitor confidence scores and manager feedback

---

## 📊 Analytics & Reporting

### **App-Specific Analytics**
- **Device Enrollment Metrics**: Success rate, time to completion, approval rate
- **WiFi Usage Patterns**: Connection frequency, data usage, popular access points
- **Attendance Assistance Effectiveness**: Manager adoption rate, time savings measurement
- **Security Metrics**: Unauthorized device detection, MAC address conflicts

### **Manager Reports**
- **Daily Attendance Summary**: Network-based attendance vs manual timesheet comparison
- **Device Inventory Report**: All approved devices by location and employee
- **WiFi Usage Analytics**: Network utilization patterns and peak usage times
- **Employee Connectivity Trends**: Regular vs irregular connection patterns

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **MAC Address Protection**: Hashed storage, encrypted transmission to UniFi
- **SMS Verification**: Rate limiting, expiring tokens, verification code complexity
- **Device Fingerprinting**: Privacy-conscious data collection, user consent
- **Network Monitoring**: Secure API access to UniFi, audit logging

### **Privacy Protection**
- **Data Minimization**: Only collect device info necessary for WiFi access and attendance
- **Employee Consent**: Clear explanation of network monitoring for attendance assistance
- **Data Retention**: Automatic purging of connection logs after 90 days
- **Access Controls**: Role-based access to sensitive network and attendance data

### **WiFi Security Integration**
- **MAC Address Validation**: Verify device ownership before WiFi provisioning
- **Guest Network Isolation**: Personal devices isolated from corporate network
- **Automatic Deprovisioning**: Immediate WiFi access removal on termination
- **Rogue Device Detection**: Alert on unauthorized devices attempting network access

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] QR code enrollment flow functional on mobile devices
- [ ] SMS verification working with existing Twilio integration
- [ ] UniFi API integration provisioning/deprovisioning WiFi access
- [ ] Manager dashboard showing network-based attendance suggestions
- [ ] Automated employee termination WiFi access removal

### **Success Metrics (6 months)**
- 95% of active employees have enrolled at least one device
- 50% reduction in IT help desk WiFi access requests
- 25% reduction in manual timesheet correction requests
- 90%+ accuracy rate for network-based attendance suggestions
- Zero unauthorized device access incidents

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **UniFi API Compatibility**: Monitor for controller firmware updates affecting API
- **Device Database Cleanup**: Quarterly removal of inactive/terminated employee devices
- **Attendance Algorithm Tuning**: Monthly review of confidence score accuracy
- **SMS Cost Optimization**: Monitor verification message costs and optimize content

### **Future Enhancements**
- **Multi-Site WiFi Management**: Support for multiple UniFi controllers
- **Advanced Attendance Analytics**: Integration with existing time tracking systems
- **Mobile App Push Notifications**: Device-specific notifications for WiFi status
- **IoT Device Support**: Extended support for smart watches, health monitors
- **Automatic Time Entry**: Direct integration with payroll systems for suggested times

---

## 🤖 AI Development Integration

### **Terminal Coordination**
```yaml
Terminal_Assignment: Mixed

Frontend_Terminal_Focus:
  - Device enrollment UI (QR code display, mobile optimization)
  - Manager dashboard for device approval and attendance review
  - Real-time device status indicators
  - Network timeline visualization components

Backend_Terminal_Focus:
  - UniFi MCP integration for WiFi management
  - SMS verification workflow via Twilio MCP
  - Attendance analysis algorithms from network data
  - Device lifecycle management and automated deprovisioning

Coordination_Points:
  - Real-time device status updates via Supabase subscriptions
  - Network connection data synchronization from UniFi
  - Manager approval workflow triggering WiFi provisioning
  - Employee termination event handling across systems
```

### **MCP Integration Opportunities**
```typescript
// Primary MCP integrations for enhanced development:
- UniFi MCP: WiFi access control, client monitoring, connection history
- Twilio MCP: SMS verification for device enrollment
- Supabase MCP: Real-time device status, attendance data storage
- Memory MCP: Context preservation for complex UniFi API integration
- Time MCP: Attendance analysis with proper timezone handling
```

---

*This PRD provides comprehensive guidance for building an automated employee device management system that leverages existing infrastructure while providing significant operational value through WiFi access control and attendance tracking assistance.*

**📚 Essential Reading Before Development:**
- `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Complete technical standards
- `/true-docs/AI_WORKFLOW_GUIDE.md` - AI development methodologies for mixed terminal coordination
- `UniFi MCP Documentation` - Integration patterns for network management
