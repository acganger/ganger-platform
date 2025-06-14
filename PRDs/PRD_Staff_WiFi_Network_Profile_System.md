# PRD: Staff WiFi Network Profile System
**Project**: Automated Staff WiFi Authentication & Tracking  
**Version**: 1.0  
**Date**: January 10, 2025  
**Author**: Anand Ganger  
**Status**: Planning  

---

## 🎯 **Executive Summary**

Create an automated staff WiFi authentication system using Google OAuth integration and network profiles to enable seamless multi-site access while providing comprehensive employee location tracking for the legacy staff portal's punch-fix dashboard.

### **Business Problem**
- Staff personal devices use MAC randomization, making employee network tracking impossible
- Current WiFi access lacks centralized control and audit capabilities  
- No integration between network presence and time tracking systems
- Manual WiFi setup creates security vulnerabilities and poor user experience

### **Solution Overview**
Deploy WPA2-Enterprise WiFi with Google OAuth authentication across all 4 practice locations, enabling automatic profile distribution via SMS and real-time network presence verification in existing staff management systems.

---

## 📋 **Product Requirements**

### **Core Functionality**

#### **1. Multi-Site WiFi Authentication**
- **Single network profile** works across all 4 practice locations
- **Google OAuth integration** using existing Google Cloud Identity accounts
- **WPA2-Enterprise** with certificate-based authentication  
- **Automatic device provisioning** without MAC address dependencies

#### **2. Automated Profile Distribution**
- **SMS-based profile delivery** during employee onboarding
- **Zero-touch installation** with secure download links
- **Cross-platform support** (iOS/Android) with proper configuration
- **Revocation capability** for terminated employees

#### **3. Legacy System Integration**
- **Punch-fix dashboard enhancement** showing network presence verification
- **Real-time location tracking** across all practice locations
- **Historical connection data** for attendance verification
- **Manager view integration** in existing staff portal

#### **4. Network Access Management**
- **Role-based access control** with dynamic policy updates
- **Temporary access restrictions** without profile reinstallation
- **Location-specific permissions** (printers, medical equipment)
- **Guest network isolation** from staff networks

---

## 🏗️ **Technical Architecture**

### **Network Infrastructure**

#### **UniFi Controller Configuration**
```bash
# Synchronized across all 4 controllers:
- Main/Home: UDM SE (192.168.1.1)
- Ann Arbor: UDM Pro (50.238.160.230)  
- Plymouth: UDM Pro (50.216.114.162)
- Wixom: UDM Pro (50.238.161.46)

# Unified SSID: "GD-Staff-Secure"
Security: WPA2-Enterprise
Authentication: 802.1X with Google OAuth
RADIUS: FreeRADIUS proxy to Google LDAP
```

#### **Google Integration Architecture**
```bash
# Authentication Flow:
Employee Device → WPA2-Enterprise → UniFi Controller → 
FreeRADIUS → Google Cloud Identity → Access Granted

# User Database: Existing Google Cloud Identity
Domain: gangerdermatology.com
Users: firstname.lastname@gangerdermatology.com
Groups: Staff role-based access control
```

### **Profile Distribution System**

#### **SMS Automation Pipeline**
```python
# Onboarding Workflow:
1. HR adds employee to Google Cloud Identity
2. Webhook triggers profile generation
3. Twilio MCP sends SMS with secure download link
4. Employee installs profile → instant WiFi access
5. Google Sheets MCP logs deployment status
```

#### **Profile Generation Service**
```bash
# Profile Contents:
- SSID: "GD-Staff-Secure"
- Security: WPA2-Enterprise  
- Authentication: PEAP-MSCHAPv2
- Username: employee@gangerdermatology.com
- Certificate: Auto-provisioned via Google
```

### **Legacy Integration Layer**

#### **Punch-Fix Dashboard Enhancement**
```php
// Enhanced manager view in legacy staff portal:
// File: legacy-a2hosting-apps/staff/views/dashboard_table.php

function getNetworkPresenceData($employee_id, $date) {
    // Query UniFi controllers via MCP service
    $locations = ['ann_arbor', 'plymouth', 'wixom', 'main'];
    $presence_data = [];
    
    foreach ($locations as $location) {
        $presence_data[$location] = queryUniFiController(
            $location, 
            $employee_id, 
            $date
        );
    }
    
    return $presence_data;
}
```

#### **Network Verification Service**
```bash
# V1: Manual MFA authentication (current limitation)
# V2: Service account for automated queries

Service Endpoint: /api/network-verification
Input: employee_email, date_range
Output: {
  "locations": [
    {
      "site": "ann_arbor",
      "login_time": "2025-01-10T08:30:15Z",
      "logout_time": "2025-01-10T17:45:22Z", 
      "duration": "9h 15m",
      "access_point": "U7 Pro XG Central"
    }
  ]
}
```

---

## 👥 **User Stories**

### **Employee Experience**
```
As a staff member, I want to:
- Receive WiFi setup automatically when I'm hired
- Connect seamlessly at any practice location  
- Not worry about network configuration or passwords
- Have my network access automatically revoked when I leave
```

### **Manager Experience**  
```
As a practice manager, I want to:
- Verify employee attendance using network presence data
- See which location employees are working from
- Identify discrepancies between reported and actual hours
- Have network data integrated into existing punch-fix workflow
```

### **IT Administrator Experience**
```
As IT admin, I want to:
- Provision WiFi access automatically for new hires
- Revoke access instantly for terminated employees
- Control access to location-specific resources
- Monitor network usage and security compliance
```

---

## 📅 **Implementation Roadmap**

### **Phase 1: Network Infrastructure (Weeks 1-2)**

#### **Week 1: UniFi Configuration**
- [ ] Configure WPA2-Enterprise on all 4 controllers
- [ ] Set up FreeRADIUS proxy to Google LDAP
- [ ] Create unified "GD-Staff-Secure" SSID
- [ ] Test basic Google authentication flow

#### **Week 2: Profile Generation** 
- [ ] Build iOS/Android profile generation service
- [ ] Create secure profile download portal
- [ ] Implement certificate management system
- [ ] Test profile installation on pilot devices

### **Phase 2: Automation & Integration (Weeks 3-4)**

#### **Week 3: SMS Distribution**
- [ ] Integrate Twilio MCP for SMS delivery
- [ ] Create onboarding automation workflow
- [ ] Build Google Sheets MCP logging system
- [ ] Test end-to-end profile distribution

#### **Week 4: Legacy Integration**
- [ ] Enhance punch-fix dashboard with network data
- [ ] Create UniFi query service (manual MFA)
- [ ] Add network presence verification to manager view
- [ ] Test integration with existing staff portal

### **Phase 3: Production & Optimization (Weeks 5-6)**

#### **Week 5: Deployment**
- [ ] Roll out to pilot group (front desk staff)
- [ ] Monitor network performance and access
- [ ] Collect user feedback and iterate
- [ ] Document troubleshooting procedures

#### **Week 6: Full Rollout**
- [ ] Deploy to all staff members
- [ ] Train managers on new dashboard features
- [ ] Implement monitoring and alerting
- [ ] Create user support documentation

---

## 🔧 **Technical Implementation Details**

### **MCP Server Integration**

#### **Required MCP Servers**
```bash
✅ Twilio MCP: SMS profile distribution
✅ Google Sheets MCP: Deployment tracking
✅ UniFi Network MCP: Network presence queries  
✅ Time MCP: HIPAA-compliant timestamping
✅ Memory MCP: Store employee network patterns
```

#### **Network Verification API**
```typescript
// src/api/network-verification.ts
interface NetworkPresenceQuery {
  employee_email: string;
  date: string;
  locations?: string[];
}

interface NetworkPresenceResponse {
  employee: string;
  date: string;
  locations: LocationPresence[];
  total_hours: number;
  verified: boolean;
}

async function queryNetworkPresence(
  query: NetworkPresenceQuery
): Promise<NetworkPresenceResponse> {
  // V1: Manual MFA authentication
  // V2: Service account automation
}
```

### **Database Schema Updates**

#### **Staff Portal Enhancement**
```sql
-- Add network verification to existing punch_fix table
ALTER TABLE punch_fix ADD COLUMN network_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE punch_fix ADD COLUMN network_location VARCHAR(50);
ALTER TABLE punch_fix ADD COLUMN network_login_time TIMESTAMP NULL;
ALTER TABLE punch_fix ADD COLUMN network_logout_time TIMESTAMP NULL;
ALTER TABLE punch_fix ADD COLUMN network_duration_minutes INT DEFAULT 0;

-- Create network presence log table
CREATE TABLE network_presence_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_email VARCHAR(255) NOT NULL,
  location VARCHAR(50) NOT NULL,
  login_time TIMESTAMP NOT NULL,
  logout_time TIMESTAMP NULL,
  access_point VARCHAR(100),
  ip_address VARCHAR(15),
  mac_address VARCHAR(17),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_employee_date (employee_email, DATE(login_time)),
  INDEX idx_location_date (location, DATE(login_time))
);
```

### **Security Considerations**

#### **Network Segmentation**
```bash
# Staff VLAN Configuration:
Staff Network: 10.1.20.0/24 (isolated from patient/guest)
Printer Access: Dynamic firewall rules per location
Medical Equipment: Role-based access control
Internet Access: Content filtering and monitoring
```

#### **Certificate Management**
```bash
# Certificate Lifecycle:
Issuance: Automatic via Google OAuth
Renewal: 90-day rotation with auto-renewal
Revocation: Instant via Google account disabling
Backup: Secure certificate store with audit trail
```

---

## 📊 **Success Metrics**

### **Deployment Metrics**
- **Profile installation success rate**: >95%
- **Multi-site connectivity success**: >99%
- **SMS delivery success rate**: >98%
- **Employee onboarding time**: <10 minutes

### **Operational Metrics**
- **Network presence accuracy**: >99%
- **Manager dashboard adoption**: >80%
- **IT support tickets reduction**: >50%
- **Time tracking verification improvement**: >90%

### **Security Metrics**
- **Unauthorized device connections**: 0
- **Certificate compromise incidents**: 0
- **Network segmentation violations**: 0
- **HIPAA compliance audit score**: 100%

---

## 🚧 **Known Limitations & Future Enhancements**

### **V1 Limitations**
- **Manual MFA authentication** required for UniFi controller access
- **Limited real-time updates** due to authentication constraints
- **Manager dashboard polling** instead of live updates

### **V2 Enhancements** 
- **Service account integration** for automated UniFi queries
- **Real-time presence updates** via WebSocket connections
- **Advanced analytics** with behavioral pattern detection
- **Mobile app integration** for manager notifications

### **Future Roadmap**
- **Clinic iPad integration** with managed device profiles
- **Patient device management** with separate network policies
- **Integration with badge systems** for comprehensive tracking
- **AI-powered attendance analytics** and anomaly detection

---

## 💰 **Budget & Resources**

### **Implementation Costs**
- **Development Time**: 6 weeks (1 developer)
- **Infrastructure**: No additional hardware required
- **Software Licensing**: FreeRADIUS (open source)
- **SMS Costs**: ~$0.01 per profile delivery

### **Ongoing Costs**
- **Certificate Management**: Included in Google Workspace
- **Network Monitoring**: Included in UniFi platform
- **SMS Notifications**: <$50/month for staff updates
- **Maintenance**: 2-4 hours/month

---

## 🔗 **Dependencies & Integration Points**

### **External Systems**
- **Google Cloud Identity**: User authentication and management
- **UniFi Network Controllers**: Network access control and monitoring  
- **Legacy Staff Portal**: Punch-fix dashboard integration
- **Twilio SMS Service**: Profile distribution automation

### **Internal Dependencies**
- **MCP Server Infrastructure**: Communication and logging
- **Existing Network Architecture**: WiFi infrastructure across all sites
- **Staff Onboarding Process**: HR workflow integration
- **Manager Training**: Dashboard usage and verification procedures

---

## 📝 **Acceptance Criteria**

### **Core Functionality**
- [ ] Single profile provides access to all 4 practice locations
- [ ] Google OAuth authentication works consistently
- [ ] SMS profile delivery completes within 5 minutes of hire
- [ ] Network presence data appears in punch-fix dashboard

### **Performance Requirements**
- [ ] Profile installation success rate >95%
- [ ] Network authentication latency <3 seconds
- [ ] Manager dashboard loads network data <10 seconds
- [ ] System handles 100+ concurrent staff connections

### **Security Requirements**
- [ ] Staff traffic isolated from patient/guest networks
- [ ] Certificate revocation effective within 1 hour
- [ ] Network access logs maintain HIPAA compliance
- [ ] No unauthorized device access to staff network

### **User Experience**
- [ ] One-click profile installation on mobile devices
- [ ] Seamless roaming between practice locations
- [ ] Clear manager dashboard showing presence vs. punch data
- [ ] Automated error handling and user support guidance

---

**🎯 This PRD provides a comprehensive roadmap for implementing enterprise-grade staff WiFi authentication with seamless integration into existing practice management workflows.**