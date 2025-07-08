# Ganger Actions - Form Field Analysis Report

## Executive Summary

This report provides a comprehensive analysis of form fields comparing the legacy PHP system with the new Next.js implementation. Several critical field mismatches and missing functionality have been identified that need immediate attention for 100% compatibility.

## Form Type Comparison

### 1. Support Ticket Form

#### Legacy Fields (from PHP):
```json
{
  "priority": "Urgent + Important", // String format
  "details": "Description text",
  "photos": "URL to uploaded photos",
  "location": "Wixom/Ann Arbor/Plymouth",
  "submitter_name": "Full Name",
  "request_type": "Admin Issue/IT (network, computer, software)/Building Maintenance (Indoor)/General Support"
}
```

#### Current Implementation:
```typescript
{
  location: 'Northfield' | 'Woodbury' | 'Burnsville',
  requestType: 'General Support' | 'Equipment Issue' | 'Software Problem' | 'Network Issue' | 'Other',
  priority: {
    urgency: 'Urgent' | 'Not Urgent',
    importance: 'Important' | 'Not Important'
  },
  description: string,
  attachments: File[]
}
```

#### Issues Found:
1. **Location Mismatch**: Legacy uses "Wixom/Ann Arbor/Plymouth", new uses "Northfield/Woodbury/Burnsville"
2. **Request Type Mismatch**: Legacy has different categories including "Admin Issue", "Building Maintenance"
3. **Priority Format**: Legacy uses concatenated string "Urgent + Important", new uses nested object
4. **Photos vs Attachments**: Legacy stores URL strings, new uses File objects
5. **Missing submitter_name**: Legacy explicitly includes this field

### 2. Time Off Request Form

#### Legacy Fields:
```json
{
  "start_date": "2025-01-15",
  "end_date": "2025-01-17",
  "requesting_pto": "Yes/No",
  "reason": "Vacation request text",
  "comments": "Additional comments",
  "submitter_name": "Full Name"
}
```

#### Current Implementation:
```typescript
{
  dateRange: {
    startDate: Date,
    endDate: Date
  },
  ptoElection: 'Paid Time Off' | 'Unpaid Leave' | 'Sick Leave',
  reason?: string
}
```

#### Issues Found:
1. **Field Name Changes**: start_date/end_date → dateRange object
2. **PTO Field Mismatch**: "requesting_pto" (Yes/No) → "ptoElection" (enum)
3. **Missing comments field**: Legacy has separate comments field
4. **Missing submitter_name**: Not captured in new form

### 3. Punch Fix Form

#### Legacy Fields:
```json
{
  "employee_name": "Name",
  "employee_email": "email@domain.com",
  "date": "2025-05-15",
  "in_time": "09:00",
  "out_time": "17:00",
  "comments": "Explanation",
  "submitter_name": "Name"
}
```

#### Current Implementation:
```typescript
{
  employee_name?: string,
  employee_email?: string,
  date: string,
  in_time?: string,
  out_time?: string,
  comments: string
  // Additional fields not in legacy:
  punch_type: string,
  scheduled_in?: string,
  scheduled_out?: string,
  actual_in?: string,
  actual_out?: string,
  reason: string,
  supervisor_aware?: boolean
}
```

#### Issues Found:
1. **Overcomplicated**: New form adds many fields not in legacy system
2. **Field confusion**: in_time/out_time vs actual_in/actual_out
3. **Missing submitter_name**: Should be tracked separately

### 4. Change of Availability Form

#### Legacy Fields:
```json
{
  "employee_name": "Name",
  "employee_email": "email@domain.com",
  "availability_change": "Increasing/Decreasing",
  "employment_type": "Full-time/Part-time",
  "effective_date": "2025-06-22",
  "probation_completed": "Yes/No",
  "days_affected": "Monday, Tuesday",
  "limited_availability_details": "Details",
  "return_date": "",
  "reason": "Explanation",
  "supporting_documentation": "",
  "additional_comments": "Comments",
  "submitter_name": "Name"
}
```

#### Current Implementation:
Mostly matches legacy, but stores days_affected as array instead of comma-separated string.

### 5. Expense Reimbursement Form

#### Legacy Fields:
```json
{
  "expense_date": "2025-04-21",
  "amount": "96.00",
  "category": "Travel/Supplies/Meals/Other",
  "description": "Details",
  "receipt": "URL or empty",
  "submitter_name": "Name"
}
```

#### Current Implementation:
Matches legacy but adds unnecessary complexity with expense_items array and different category values.

### 6. Meeting Request Form

#### Legacy Fields:
```json
{
  "meeting_date": "2025-06-24",
  "meeting_time": "12:30",
  "subject": "Meeting Subject",
  "participants": "email1@domain.com, email2@domain.com",
  "details": "Meeting details",
  "submitter_name": "Name",
  "submitter_email": "email@domain.com"
}
```

#### Current Implementation:
Matches legacy structure well.

### 7. Impact Filter Form

#### Legacy Fields:
```json
{
  "goal": "What is the goal/objective",
  "submitter_name": "Name"
}
```

#### Current Implementation:
Adds many fields not in legacy:
- context
- success_definition
- tradeoffs
- participants
- timeframe

## Database Schema Issues

### Current Schema (from migrations):
```sql
form_data JSONB NOT NULL DEFAULT '{}'
```

The current schema stores all form-specific data in a JSONB column, which is correct. However:

1. **Missing Indexes**: No functional indexes on JSONB fields for common queries
2. **No Validation**: JSONB allows any structure, leading to inconsistencies
3. **Reporting Challenges**: Extracting data for dashboards requires complex JSON queries

## Critical Issues for 100% Compatibility

### 1. Location Data Mismatch
**CRITICAL**: The locations don't match between legacy and new:
- Legacy: "Wixom", "Ann Arbor", "Plymouth"
- New: "Northfield", "Woodbury", "Burnsville"

### 2. Missing submitter_name Field
All legacy forms include "submitter_name" in the payload, but new forms don't consistently capture this.

### 3. Priority Format Incompatibility
Legacy uses string format "Urgent + Important", new uses object structure.

### 4. Request Type Categories
Support ticket request types are completely different between systems.

## Recommended Schema Improvements

### 1. Add Functional Indexes
```sql
-- Index for reporting by form type and date
CREATE INDEX idx_tickets_form_type_created ON tickets(form_type, created_at);

-- Index for location-based queries
CREATE INDEX idx_tickets_form_location ON tickets((form_data->>'location'));

-- Index for expense reporting
CREATE INDEX idx_tickets_expense_amount ON tickets((form_data->>'amount')) 
WHERE form_type = 'expense_reimbursement';
```

### 2. Add Computed Columns for Reporting
```sql
ALTER TABLE tickets ADD COLUMN computed_priority TEXT 
GENERATED ALWAYS AS (
  CASE 
    WHEN form_data->>'priority' LIKE '%Urgent%Important%' THEN 'urgent'
    WHEN form_data->>'priority' LIKE '%Urgent%' THEN 'high'
    WHEN form_data->>'priority' LIKE '%Important%' THEN 'high'
    ELSE 'normal'
  END
) STORED;

ALTER TABLE tickets ADD COLUMN expense_amount DECIMAL(10,2)
GENERATED ALWAYS AS (
  CASE 
    WHEN form_type = 'expense_reimbursement' 
    THEN (form_data->>'amount')::DECIMAL
    ELSE NULL
  END
) STORED;
```

### 3. Add Validation Constraints
```sql
-- Ensure required fields exist based on form type
ALTER TABLE tickets ADD CONSTRAINT check_support_ticket_fields
CHECK (
  form_type != 'support_ticket' OR (
    form_data ? 'location' AND
    form_data ? 'request_type' AND
    form_data ? 'priority' AND
    form_data ? 'details'
  )
);
```

## Migration Strategy

### 1. Update Location Mapping
Create a mapping function to convert between location systems:
```typescript
const locationMap = {
  'Wixom': 'Northfield',
  'Ann Arbor': 'Woodbury',
  'Plymouth': 'Burnsville'
};
```

### 2. Standardize Priority Format
Convert object format to legacy string format for compatibility:
```typescript
const formatPriority = (priority: {urgency: string, importance: string}) => {
  return `${priority.urgency} + ${priority.importance}`;
};
```

### 3. Add Missing Fields
Ensure all forms capture:
- submitter_name
- submitter_email
- All legacy field names

## Dashboard Requirements

For effective reporting, we need:

1. **Ticket Volume by Type**: Already supported
2. **Location-based Analytics**: Needs location mapping fix
3. **Expense Tracking**: Needs amount field standardization
4. **Time Off Calendar**: Needs date extraction from JSONB
5. **Response Time Metrics**: Already supported
6. **Approval Workflow Status**: Needs standardization

## Action Items

1. **Immediate (Breaking Issues)**:
   - Fix location values to match legacy system
   - Standardize priority format
   - Add missing submitter_name to all forms
   - Update request_type values for support tickets

2. **Short-term (Data Quality)**:
   - Add database indexes for reporting
   - Implement field validation
   - Standardize date/time formats

3. **Long-term (Enhancement)**:
   - Consider breaking out common fields from JSONB
   - Implement form versioning
   - Add audit trail for form changes

## Summary

The current implementation has good structure but lacks compatibility with the legacy system. The most critical issues are the location mismatch and missing fields that will prevent successful migration of existing data. These must be fixed before deployment to ensure continuity of operations.
