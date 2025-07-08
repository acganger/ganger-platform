# Legacy to New Field Mapping Guide

## Support Ticket Form

| Legacy Field | Legacy Type | New Field | New Type | Action Required |
|--------------|-------------|-----------|----------|----------------|
| priority | "Urgent + Important" | priority.urgency + priority.importance | Object | Convert to string format |
| details | string | description | string | Rename field |
| photos | string (URL) | attachments | File[] | Handle file upload differently |
| location | "Wixom"/"Ann Arbor"/"Plymouth" | location | "Northfield"/"Woodbury"/"Burnsville" | **FIX LOCATION VALUES** |
| submitter_name | string | - | - | **ADD FIELD** |
| request_type | "Admin Issue"/"IT"/"Building Maintenance" | requestType | Different values | **UPDATE ENUM VALUES** |

### Required Changes:
```typescript
// Fix location enum
type Location = 'Wixom' | 'Ann Arbor' | 'Plymouth';

// Fix request type enum
type RequestType = 'Admin Issue' | 'IT (network, computer, software)' | 
                   'Building Maintenance (Indoor)' | 'General Support';

// Update form data structure
interface SupportTicketFormData {
  location: Location;
  request_type: RequestType; // Use legacy field name
  priority: string; // Store as "Urgent + Important" format
  details: string; // Use legacy field name
  photos: string; // URL string instead of File[]
  submitter_name: string; // Add this field
}
```

## Time Off Request Form

| Legacy Field | Legacy Type | New Field | New Type | Action Required |
|--------------|-------------|-----------|----------|----------------|
| start_date | string | dateRange.startDate | Date | Extract to flat field |
| end_date | string | dateRange.endDate | Date | Extract to flat field |
| requesting_pto | "Yes"/"No" | ptoElection | Enum | Convert to boolean |
| reason | string | reason | string | ✓ Matches |
| comments | string | - | - | **ADD FIELD** |
| submitter_name | string | - | - | **ADD FIELD** |

### Required Changes:
```typescript
interface TimeOffRequestFormData {
  start_date: string; // YYYY-MM-DD format
  end_date: string; // YYYY-MM-DD format
  requesting_pto: 'Yes' | 'No';
  reason: string;
  comments: string; // Add this field
  submitter_name: string; // Add this field
}
```

## Punch Fix Form

| Legacy Field | Legacy Type | New Field | New Type | Action Required |
|--------------|-------------|-----------|----------|----------------|
| employee_name | string | employee_name | string | ✓ Matches |
| employee_email | string | employee_email | string | ✓ Matches |
| date | string | date | string | ✓ Matches |
| in_time | string | in_time | string | ✓ Matches |
| out_time | string | out_time | string | ✓ Matches |
| comments | string | comments | string | ✓ Matches |
| submitter_name | string | - | - | **ADD FIELD** |

### Required Changes:
```typescript
// Remove extra fields not in legacy
interface PunchFixFormData {
  employee_name: string;
  employee_email?: string;
  date: string;
  in_time: string;
  out_time: string;
  comments: string;
  submitter_name: string; // Add this field
  // Remove: punch_type, scheduled_in/out, actual_in/out, reason, supervisor_aware
}
```

## Change of Availability Form

| Legacy Field | Legacy Type | New Field | New Type | Action Required |
|--------------|-------------|-----------|----------|----------------|
| employee_name | string | employee_name | string | ✓ Matches |
| employee_email | string | employee_email | string | ✓ Matches |
| availability_change | "Increasing"/"Decreasing" | availability_change | Enum | ✓ Matches |
| employment_type | "Full-time"/"Part-time" | employment_type | Enum | ✓ Matches |
| effective_date | string | effective_date | string | ✓ Matches |
| probation_completed | "Yes"/"No" | probation_completed | Enum | ✓ Matches |
| days_affected | "Monday, Tuesday" | days_affected | string[] | Convert to string |
| limited_availability_details | string | limited_availability_details | string | ✓ Matches |
| return_date | string | return_date | string | ✓ Matches |
| reason | string | reason | string | ✓ Matches |
| supporting_documentation | string | supporting_documentation | File | Store as URL |
| additional_comments | string | additional_comments | string | ✓ Matches |
| submitter_name | string | - | - | **ADD FIELD** |

### Required Changes:
```typescript
interface AvailabilityFormData {
  // ... existing fields ...
  days_affected: string; // Store as comma-separated string
  supporting_documentation: string; // URL string instead of File
  submitter_name: string; // Add this field
}
```

## Expense Reimbursement Form

| Legacy Field | Legacy Type | New Field | New Type | Action Required |
|--------------|-------------|-----------|----------|----------------|
| expense_date | string | expense_date | string | ✓ Matches |
| amount | string | amount | string | ✓ Matches |
| category | "Other" etc | category | Enum | ✓ Matches |
| description | string | description | string | ✓ Matches |
| receipt | string (URL) | receipt | File | Store as URL |
| submitter_name | string | - | - | **ADD FIELD** |

### Required Changes:
```typescript
interface ExpenseFormData {
  expense_date: string;
  amount: string; // Keep as string with decimal
  category: 'Travel' | 'Supplies' | 'Meals' | 'Other';
  description: string;
  receipt: string; // URL string instead of File
  submitter_name: string; // Add this field
  // Remove: expense_type, expense_items array
}
```

## Meeting Request Form

| Legacy Field | Legacy Type | New Field | New Type | Action Required |
|--------------|-------------|-----------|----------|----------------|
| meeting_date | string | meeting_date | string | ✓ Matches |
| meeting_time | string | meeting_time | string | ✓ Matches |
| subject | string | subject | string | ✓ Matches |
| participants | string | participants | string | ✓ Matches |
| details | string | details | string | ✓ Matches |
| submitter_name | string | - | - | **ADD FIELD** |
| submitter_email | string | - | - | **ADD FIELD** |

### Required Changes:
```typescript
interface MeetingFormData {
  meeting_date: string;
  meeting_time: string;
  subject: string;
  participants: string; // Comma-separated emails
  details: string;
  submitter_name: string; // Add this field
  submitter_email: string; // Add this field
}
```

## Impact Filter Form

| Legacy Field | Legacy Type | New Field | New Type | Action Required |
|--------------|-------------|-----------|----------|----------------|
| goal | string | goal | string | ✓ Matches |
| submitter_name | string | submitter_name | string | ✓ Matches |

### Required Changes:
```typescript
// Simplify to match legacy - remove extra fields
interface ImpactFilterFormData {
  goal: string;
  submitter_name: string;
  // Remove: context, success_definition, tradeoffs, participants, timeframe
}
```

## Universal Changes Required

1. **All Forms Must Include**:
   ```typescript
   submitter_name: string;
   submitter_email: string;
   ```

2. **Location Values Must Be**:
   ```typescript
   type Location = 'Wixom' | 'Ann Arbor' | 'Plymouth';
   ```

3. **File Uploads**: Store URLs in form_data, not File objects

4. **Field Names**: Use exact legacy field names (e.g., `details` not `description`)

5. **Date Formats**: Always use YYYY-MM-DD string format

6. **Time Formats**: Always use HH:MM string format

## Database Migration Query

```sql
-- Update location values in existing data
UPDATE tickets 
SET form_data = jsonb_set(
  form_data, 
  '{location}',
  CASE form_data->>'location'
    WHEN 'Northfield' THEN '"Wixom"'
    WHEN 'Woodbury' THEN '"Ann Arbor"' 
    WHEN 'Burnsville' THEN '"Plymouth"'
    ELSE form_data->'location'
  END::jsonb
)
WHERE form_data->>'location' IN ('Northfield', 'Woodbury', 'Burnsville');

-- Convert priority format
UPDATE tickets
SET form_data = jsonb_set(
  form_data,
  '{priority}',
  ('"' || 
    CASE 
      WHEN form_data->'priority'->>'urgency' = 'Urgent' 
        AND form_data->'priority'->>'importance' = 'Important' 
      THEN 'Urgent + Important'
      WHEN form_data->'priority'->>'urgency' = 'Urgent' 
      THEN 'Urgent + Not Important'
      WHEN form_data->'priority'->>'importance' = 'Important' 
      THEN 'Not Urgent + Important'
      ELSE 'Not Urgent + Not Important'
    END || 
  '"')::jsonb
)
WHERE form_type = 'support_ticket' 
  AND form_data->'priority' ? 'urgency';
```
