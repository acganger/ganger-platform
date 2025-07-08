# Product Requirements Document: Waitlist Manager App

## 1. Overview

### 1.1 Purpose
The Waitlist Manager App addresses revenue loss and provider idle time caused by short-notice cancellations (<2 days) in a medical practice. It automates waitlist outreach, adheres to scheduling templates, and simplifies patient communication while maintaining care quality. The app ensures robust error handling, configurability, and analytics to optimize scheduling and recover revenue, with human oversight to prevent errors.

### 1.2 Background
The practice schedules patient visits in 15-minute increments, with variations in duration, revenue, and clinical priority (e.g., skin cancer vs. acne cyst). Providers and staff are scheduled 2+ weeks out, paid for full shifts, and incur overtime when needed. Patients can cancel/reschedule up to 2 days prior without penalty, and early cancellations are often rebooked from a waitlist. Short-notice cancellations result in idle time and no revenue. Scheduling templates limit appointment types (e.g., full body skin exams, or FBSEs, capped to prevent burnout), and patients often misunderstand FBSE scope, requiring clear communication.

### 1.3 Goals
- **Primary**: Fill 50%+ of short-notice cancellation slots within 3 months, recovering $5,000–$10,000/month in revenue.
- **Secondary**:
  - Adhere to scheduling templates to balance workload and care quality.
  - Simplify patient communication to reduce confusion (e.g., FBSE scope).
  - Minimize staff effort with automation and human oversight.
  - Ensure HIPAA compliance, EHR API compliance, and cost control.

### 1.4 Stakeholders
- **Practice Owner**: Approves features, monitors revenue impact, and ensures care quality.
- **Providers**: Benefit from optimized schedules and reduced idle time.
- **Staff (Schedulers)**: Use the app to monitor and approve outreach; provide feedback via Slack.
- **Patients**: Receive clear, timely notifications for available slots.
- **EHR Vendor**: Provides API access; enforces rate limits.
- **IT Team**: Develops and maintains the app, leveraging existing stack.

## 2. Requirements

### 2.1 Functional Requirements

#### 2.1.1 Cancellation Detection
- **Description**: Detect short-notice cancellations (<2 days) from the EHR in real time or near real time (based on API capabilities).
- **Details**:
  - Pull appointment data (ID, time, type, provider) via EHR API.
  - Store cancellations in MySQL with timestamp and status (processed/unprocessed).
  - Support sandbox mode for testing with mock data.
- **Success Criteria**: 100% of cancellations detected within 15 minutes of API update in live mode.

#### 2.1.2 Scheduling Template Integration
- **Description**: Ensure open slots are filled only with appointment types allowed by scheduling templates.
- **Details**:
  - Store templates in MySQL (e.g., max 2 FBSEs in morning, 1 in afternoon).
  - Match waitlist patients to slots based on template rules and appointment type.
  - Flag slots ineligible for FBSEs if limits are reached.
- **Success Criteria**: 0% of slots filled with non-compliant appointment types.

#### 2.1.3 Waitlist Management
- **Description**: Manage waitlist patients and match them to open slots.
- **Details**:
  - Store patient data (ID, name, contact, preferred appointment type, availability, snooze status).
  - Prioritize patients by waitlist entry date, unless snoozed.
  - Implement snooze logic: Two declines/no responses → snooze for configurable duration (default: 7 days).
  - Allow manual addition/removal of patients via dashboard.
- **Success Criteria**: 90% of matches align with patient preferences and templates.

#### 2.1.4 Automated Outreach
- **Description**: Notify waitlist patients of open slots via SMS/email with a 15-minute claim window.
- **Details**:
  - Send one patient at a time per slot, moving to the next if no response/decline.
  - Include clear messaging: “This is a [appt_type] slot for skin cancer screening at [time]. Reply ‘YES’ within 15 minutes to claim. Questions? Call [number].”
  - Support opt-out link in notifications.
  - Require human approval for all outreach in Phase 2; optional auto-approval in Phase 3.
  - Log all outreach attempts (patient, message, status, response).
- **Success Criteria**: 80% of notifications sent within 5 minutes of slot opening; <1% error rate.

#### 2.1.5 Human Oversight Dashboard
- **Description**: Allow staff to monitor and control outreach.
- **Details**:
  - Display open slots, matched patients, proposed outreach, and API usage.
  - Provide controls to approve, pause, or cancel outreach.
  - Show alerts for issues (e.g., >10 outreach attempts/hour, API throttling).
  - Support role-based access (admin vs. staff).
- **Success Criteria**: 100% of outreach actions logged; staff can pause outreach in <10 seconds.

#### 2.1.6 Feature Toggle
- **Description**: Enable/disable features to control rollout and mitigate risks.
- **Details**:
  - Toggleable features: Outreach, cancellation detection, template enforcement, analytics.
  - Store toggle states in MySQL, editable via config page.
  - Default: All features off in sandbox; outreach off in live mode until tested.
- **Success Criteria**: Features can be toggled without restarting the app; 0% unintended feature activation.

#### 2.1.7 Config Page
- **Description**: Allow admins to adjust settings without code changes.
- **Details**:
  - Configurable settings:
    - Snooze duration (1–30 days).
    - Max outreach attempts per slot (default: 5).
    - API polling frequency (e.g., every 15 minutes).
    - Template rules (e.g., max FBSEs per shift).
    - Notification templates (SMS/email text).
  - Restrict access to admins via Google Workspace SSO.
  - Log all config changes with timestamp and user.
- **Success Criteria**: 100% of settings saved and applied within 1 minute; 0% unauthorized access.

#### 2.1.8 Analytics and Reports
- **Description**: Track performance and revenue impact.
- **Details**:
  - Metrics: Slot fill rate, outreach success rate, cancellation rate, revenue recovered, provider idle time, API usage.
  - Reports:
    - Daily summary (slots filled, revenue recovered).
    - Weekly trends (cancellation patterns, FBSE declines).
    - API usage log (calls made, throttling incidents).
  - Display in dashboard with exportable CSV.
  - Use Python/Pandas for complex analytics (Phase 3).
- **Success Criteria**: Reports accurate to within 1% of EHR data; available within 24 hours of period end.

#### 2.1.9 Slack Feedback Loops
- **Description**: Notify staff of key events and collect feedback via Slack.
- **Details**:
  - Notifications:
    - Outreach paused due to error.
    - High decline rate (>50% for a slot).
    - API throttling detected.
  - Feedback channel: Allow staff to post comments or flag issues.
  - Use Slack Webhooks for integration.
- **Success Criteria**: 100% of critical alerts sent within 1 minute; staff feedback logged in MySQL.

### 2.2 Non-Functional Requirements

#### 2.2.1 Error Handling and Guardrails
- **Description**: Prevent system failures and unintended actions.
- **Details**:
  - **API Errors**: Retry failed EHR API calls with exponential backoff (max 3 retries).
  - **Outreach Limits**: Cap outreach at 10 attempts/hour/slot to prevent mass texting.
  - **Data Validation**: Reject invalid patient data (e.g., missing contact) or template rules.
  - **Fallbacks**: If API is down, cache last-known schedule and pause outreach.
  - **Alerts**: Notify staff via Slack and dashboard for errors (e.g., throttling, outreach cap hit).
  - Log all errors in MySQL with timestamp, type, and resolution status.
- **Success Criteria**: 0% unhandled errors; 100% of errors logged and alerted.

#### 2.2.2 Cost Monitoring
- **Description**: Track and control costs for Twilio and EHR API usage.
- **Details**:
  - Log Twilio usage (SMS/email sent, cost per message).
  - Estimate EHR API costs based on call volume (if vendor charges).
  - Display costs in dashboard with configurable thresholds (e.g., alert at $100/month).
  - Allow pause of outreach if costs exceed threshold.
- **Success Criteria**: Costs tracked within 5% of vendor invoices; alerts sent at 80% of threshold.

#### 2.2.3 Unit Testing
- **Description**: Ensure code reliability through automated tests.
- **Details**:
  - Test coverage: 90%+ for core logic (cancellation detection, waitlist matching, outreach).
  - Test cases:
    - Template compliance (e.g., FBSE limits).
    - Snooze logic (e.g., two declines → 7-day snooze).
    - API error handling (e.g., throttling, timeouts).
    - Outreach sequencing (e.g., one patient at a time).
  - Use PHPUnit for PHP; Pytest for Python analytics.
  - Run tests in CI pipeline (e.g., GitHub Actions).
- **Success Criteria**: 0% critical bugs in production; tests pass before deployment.

#### 2.2.4 Performance
- **Description**: Ensure fast and reliable operation.
- **Details**:
  - Dashboard load time: <2 seconds for 100 slots.
  - Outreach processing: <5 seconds from cancellation to notification.
  - API polling: Configurable (default: every 15 minutes) to avoid throttling.
  - Handle 1,000 waitlist patients and 50 daily cancellations.
- **Success Criteria**: 99.9% uptime; no performance degradation at scale.

#### 2.2.5 Security and Compliance
- **Description**: Protect patient data and comply with regulations.
- **Details**:
  - Encrypt patient data in MySQL (AES-256).
  - Use Twilio’s HIPAA-compliant plan with Business Associate Agreement.
  - Secure EHR API calls with TLS and OAuth.
  - Restrict dashboard/config access via Google Workspace SSO.
  - Audit logs for all data access and outreach.
  - Comply with HIPAA and GDPR (if applicable).
- **Success Criteria**: 0% data breaches; pass HIPAA audit.

## 3. Phased Implementation Plan

### 3.1 Phase 1: Sandbox and Minimal Waitlist Outreach (4–6 Weeks)
- **Objective**: Build and test cancellation detection, template integration, and simulated outreach in a sandbox environment.
- **Features**:
  - Cancellation detection via EHR API (sandbox mode).
  - Template-based waitlist matching.
  - Simulated outreach with 15-minute claim window and snooze logic.
  - Human oversight dashboard with feature toggles.
  - Config page for snooze duration and template rules.
  - Basic error handling (API retries, outreach caps).
- **Deliverables**:
  - MySQL schema for waitlist, cancellations, templates, logs.
  - Dashboard with toggle controls and simulated outreach logs.
  - Report on EHR API capabilities and limits.
- **Success Metrics**:
  - 100% of mock cancellations detected and matched correctly.
  - 0% template violations in simulations.
  - Staff can toggle features in <10 seconds.

### 3.2 Phase 2: Live Outreach with Human Oversight (6–8 Weeks)
- **Objective**: Deploy live outreach with human approval, refine based on feedback.
- **Features**:
  - Live SMS/email notifications via Twilio.
  - Enhanced dashboard with cost monitoring and Slack alerts.
  - Patient education in notifications (e.g., FBSE scope).
  - Advanced error handling (fallbacks, validation).
  - Analytics: Fill rate, outreach success, API usage.
- **Deliverables**:
  - Live outreach system with approval workflow.
  - FAQ page for patient education.
  - Initial analytics report (fill rates, costs).
- **Success Metrics**:
  - 20–30% of slots filled within 2 months.
  - <1% notification errors.
  - Costs <50% of revenue recovered.

### 3.3 Phase 3: Optimization and Analytics (6–8 Weeks)
- **Objective**: Improve fill rates with predictive analytics and automation.
- **Features**:
  - Predictive cancellation modeling (Python/Pandas).
  - Smart scheduling for template optimization.
  - Optional auto-approval for low-risk slots.
  - Comprehensive analytics dashboard with CSV export.
  - Patient feedback surveys via email.
- **Deliverables**:
  - Predictive model with 70%+ accuracy.
  - Optimized templates reducing idle time by 20%.
  - Survey results on patient satisfaction.
- **Success Metrics**:
  - 50%+ slot fill rate.
  - $5,000–$10,000/month revenue recovered.
  - 90% patient satisfaction in surveys.

## 4. Design Considerations

### 4.1 User Interface
- **Dashboard**:
  - Responsive layout with Tailwind CSS/Alpine.js.
  - Sections: Open slots, waitlist matches, outreach queue, API/cost metrics.
  - Controls: Approve/pause outreach, toggle features, view logs.
  - Charts: Fill rates, decline trends (Phase 3, Chart.js).
- **Config Page**:
  - Form-based UI with validation (e.g., snooze duration 1–30 days).
  - Audit log of changes.
- **Accessibility**:
  - WCAG 2.1 compliance (e.g., keyboard navigation, screen reader support).
  - High-contrast mode for staff with visual impairments.

### 4.2 Error Handling and Guardrails
- **Circuit Breaker**: Pause outreach if >10 attempts/hour or API errors >5 in 10 minutes.
- **Rate Limiting**: Cap EHR API calls at 80% of vendor limit (e.g., 80/hour if limit is 100).
- **Data Integrity**: Validate all inputs (e.g., patient contact, template rules) before processing.
- **Monitoring**: Real-time alerts for anomalies (e.g., high declines, cost spikes) via Slack/dashboard.

### 4.3 Scalability
- **Database**: Index MySQL tables for fast queries (e.g., waitlist by entry date).
- **Caching**: Store EHR data locally for 1 hour to reduce API calls.
- **Load Handling**: Support 2,000 waitlist patients and 100 daily cancellations by Phase 3.

### 4.4 Cost Management
- **Twilio**: Estimate $0.045/SMS, $0.01/email; cap at $100/month initially.
- **EHR API**: Monitor calls and negotiate with vendor if charges apply.
- **Hosting**: Use existing PHP/MySQL server (staff tools infrastructure).

## 5. Foolproofing Plan

### 5.1 Pre-Development Validation
- **EHR API Review**:
  - Request vendor documentation for endpoints, rate limits, and sandbox access.
  - Test mock API calls to confirm real-time data availability.
- **Template Workshop**:
  - Meet with providers to define templates (e.g., FBSE caps, priority rules).
  - Simulate schedules to ensure feasibility.
- **Patient Communication Testing**:
  - Draft notification templates and test with 10 patients for clarity.
  - Validate FAQ page content with providers.
- **Risk Assessment**:
  - Identify failure modes (e.g., mass texting, template errors).
  - Design guardrails (e.g., outreach caps, human approval).

### 5.2 Testing Strategy
- **Unit Tests**:
  - Cover 90%+ of PHP (PHPUnit) and Python (Pytest) code.
  - Test edge cases (e.g., no waitlist matches, API downtime).
- **Integration Tests**:
  - Simulate EHR API responses in sandbox.
  - Test Twilio integration in test mode.
- **User Acceptance Testing (UAT)**:
  - Train 2 staff members to use dashboard in sandbox.
  - Collect feedback on usability and errors.
- **Load Testing**:
  - Simulate 100 cancellations/day and 1,000 waitlist patients.
  - Verify performance under stress.

### 5.3 Feedback Loops
- **Staff Feedback**:
  - Slack channel for real-time comments and issue reporting.
  - Weekly review meetings during Phase 2.
- **Patient Feedback**:
  - Surveys in Phase 3 to assess notification clarity and satisfaction.
  - Monitor opt-out rates as a proxy for annoyance.
- **Analytics Review**:
  - Biweekly analysis of fill rates, declines, and costs to guide iterations.

## 6. Assumptions and Constraints

### 6.1 Assumptions
- EHR API supports near-real-time cancellation data (within 15 minutes).
- Vendor provides sandbox environment or mock data.
- Twilio’s HIPAA-compliant plan meets all compliance needs.
- Existing PHP/MySQL server can handle additional load.
- Staff can dedicate 1–2 hours/day to oversight in Phase 2.

### 6.2 Constraints
- **EHR API Limits**: Unknown rate limits; assume 100 calls/hour until confirmed.
- **Budget**: Leverage in-house development to minimize costs.
- **Timeline**: Phase 1 must be complete in 4–6 weeks to maintain momentum.
- **Compliance**: HIPAA and EHR vendor requirements must be met.

## 7. Risks and Mitigations

| **Risk** | **Impact** | **Likelihood** | **Mitigation** |
|----------|------------|----------------|---------------|
| EHR API throttling | Delays cancellation detection | High | Cache data, reduce polling, negotiate with vendor |
| Patient confusion (e.g., FBSE scope) | High decline rates | Medium | Clear notifications, FAQ page, callback option |
| Mass texting error | Patient annoyance, compliance risk | Low | Outreach caps, human approval, circuit breaker |
| Staff resistance | Slow adoption | Medium | Training, simple UI, Slack feedback channel |
| High Twilio costs | Budget overrun | Low | Cost monitoring, thresholds, pause outreach if exceeded |
| Template errors | Provider burnout, delays | Medium | Pre-deployment validation, provider review |

## 8. Success Metrics

- **Phase 1**: 100% of mock cancellations detected and matched; 0% template violations; staff can use dashboard in sandbox.
- **Phase 2**: 20–30% slot fill rate; <1% notification errors; costs <50% of revenue recovered.
- **Phase 3**: 50%+ slot fill rate; $5,000–$10,000/month revenue recovered; 90% patient satisfaction.

## 9. Next Steps

1. **EHR Vendor Coordination** (1 week):
   - Request API documentation, sandbox access, and rate limit details.
   - Confirm endpoints for cancellations and patient data.
2. **Template Definition** (1 week):
   - Meet with providers to finalize scheduling templates.
   - Document rules in a shared format (e.g., JSON).
3. **Notification Design** (2 weeks):
   - Draft SMS/email templates and FAQ content.
   - Test with 10 patients for clarity and feedback.
4. **Wireframe and Design Review** (2 weeks):
   - Create dashboard and config page wireframes.
   - Review with staff for usability and accessibility.
5. **Development Kickoff** (Post-PRD Approval):
   - Set up MySQL schema and sandbox environment.
   - Begin Phase 1 coding with unit tests.

## 10. Appendices

### 10.1 Sample Scheduling Template
```json
{
  "morning": {
    "fbse": 2,
    "followup": 3,
    "procedure": 1
  },
  "afternoon": {
    "fbse": 1,
    "followup": 4,
    "procedure": 2
  }
}
```

### 10.2 Sample Notification
**SMS**: “A full body skin exam (skin cancer screening) is available at 2 PM tomorrow. Reply ‘YES’ within 15 minutes to claim. Questions? Call [number]. Opt out: [link].”

### 10.3 Database Schema (Simplified)
```sql
CREATE TABLE cancellations (
  appt_id VARCHAR(50) PRIMARY KEY,
  slot_time DATETIME,
  appt_type VARCHAR(50),
  processed BOOLEAN DEFAULT FALSE
);

CREATE TABLE waitlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(100),
  contact VARCHAR(100),
  preferred_appt_type VARCHAR(50),
  added_date DATETIME,
  snooze_until DATETIME,
  decline_count INT DEFAULT 0
);

CREATE TABLE templates (
  period VARCHAR(20),
  appt_type VARCHAR(50),
  max_count INT
);

CREATE TABLE outreach_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT,
  message TEXT,
  status VARCHAR(20),
  response VARCHAR(50),
  timestamp DATETIME
);

CREATE TABLE config (
  setting_name VARCHAR(50) PRIMARY KEY,
  value TEXT,
  updated_by VARCHAR(100),
  updated_at DATETIME
);
```