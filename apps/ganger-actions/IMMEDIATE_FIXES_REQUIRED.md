# Immediate Fixes Required for Legacy Compatibility

## Priority 1: Breaking Changes (Must Fix Before Deployment)

### 1. Fix Location Values

**File**: `/src/types/index.ts`
```typescript
// CURRENT (WRONG):
export interface Ticket {
  location: 'Northfield' | 'Woodbury' | 'Burnsville';
}

// MUST CHANGE TO:
export interface Ticket {
  location: 'Wixom' | 'Ann Arbor' | 'Plymouth';
}
```

**File**: `/src/components/forms/SupportTicketForm.tsx`
```typescript
// Line 101-104, CHANGE TO:
options={[
  { value: 'Wixom', label: 'Wixom' },
  { value: 'Ann Arbor', label: 'Ann Arbor' },
  { value: 'Plymouth', label: 'Plymouth' }
]}
```

### 2. Fix Support Ticket Request Types

**File**: `/src/components/forms/SupportTicketForm.tsx`
```typescript
// Line 14-21, CHANGE TO:
requestType: z.enum([
  'Admin Issue',
  'IT (network, computer, software)', 
  'Building Maintenance (Indoor)',
  'Building Maintenance (Outdoor)',
  'General Support',
  'Information Request',
  'Other'
], {
  required_error: 'Please select a request type',
}),
```

### 3. Fix Priority Format

**File**: `/src/components/forms/SupportTicketForm.tsx`
```typescript
// REMOVE the nested priority object (lines 23-30)
// REPLACE WITH:
priority: z.enum([
  'Urgent + Important',
  'Urgent + Not Important', 
  'Not Urgent + Important',
  'Not Urgent + Not Important'
], {
  required_error: 'Please select priority',
}),
```

### 4. Add submitter_name to ALL Forms

**Every form needs to capture submitter_name in form_data**

Example for Support Ticket:
```typescript
// In the submission handler:
form_data: {
  ...data,
  submitter_name: user?.name || '',
  submitter_email: user?.email || '',
  // Rename fields to match legacy:
  details: data.description, // not 'description'
  photos: '', // not 'attachments'
}
```

## Priority 2: Field Name Corrections

### Support Ticket Form
- `description` → `details`
- `requestType` → `request_type`
- `attachments` → `photos` (store as URL string)

### Time Off Request Form
- Flatten `dateRange.startDate` → `start_date`
- Flatten `dateRange.endDate` → `end_date`  
- `ptoElection` → `requesting_pto` (with values "Yes"/"No")
- Add `comments` field

### Punch Fix Form
- Remove unnecessary fields: `punch_type`, `scheduled_in`, `scheduled_out`, `actual_in`, `actual_out`, `reason`, `supervisor_aware`
- Keep only legacy fields

### Expense Reimbursement Form
- Remove `expense_items` array
- `receipt` should be URL string, not File

## Priority 3: Database Schema Updates

### Add Migration Script
```sql
-- Fix any existing data with wrong locations
UPDATE tickets 
SET location = CASE location
  WHEN 'Northfield' THEN 'Wixom'
  WHEN 'Woodbury' THEN 'Ann Arbor'
  WHEN 'Burnsville' THEN 'Plymouth'
  ELSE location
END
WHERE location IN ('Northfield', 'Woodbury', 'Burnsville');
```

### Add Indexes for Reporting
```sql
-- Critical for dashboard queries
CREATE INDEX idx_tickets_form_data_location ON tickets((form_data->>'location'));
CREATE INDEX idx_tickets_form_data_request_type ON tickets((form_data->>'request_type')) WHERE form_type = 'support_ticket';
CREATE INDEX idx_tickets_form_data_dates ON tickets((form_data->>'start_date'), (form_data->>'end_date')) WHERE form_type = 'time_off_request';
```

## Testing Checklist

### Before Deployment:
1. [ ] Import sample legacy data and verify all fields map correctly
2. [ ] Test each form submission stores data in legacy format
3. [ ] Verify dashboard queries work with legacy field names
4. [ ] Check that priority displays as "Urgent + Important" format
5. [ ] Ensure locations show as Wixom/Ann Arbor/Plymouth
6. [ ] Validate submitter_name is captured in all forms

### Legacy Data Import Test:
```typescript
// Test data matching legacy format
const legacyTicket = {
  form_type: 'support_ticket',
  form_data: {
    priority: 'Urgent + Important',
    details: 'Computer not working',
    photos: '',
    location: 'Wixom',
    submitter_name: 'John Doe',
    request_type: 'IT (network, computer, software)'
  }
};

// This should work without any transformation
```

## Quick Fix Script

Run this to update all form components at once:

```bash
# Update location values
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i "s/'Northfield'/'Wixom'/g"
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i "s/'Woodbury'/'Ann Arbor'/g"
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i "s/'Burnsville'/'Plymouth'/g"

# Update field names
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i "s/description:/details:/g"
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i "s/requestType/request_type/g"
```

## Verification

After fixes, run:
```sql
-- Check that all tickets have valid locations
SELECT DISTINCT location FROM tickets;
-- Should only show: Wixom, Ann Arbor, Plymouth

-- Check form_data structure matches legacy
SELECT form_type, jsonb_object_keys(form_data) as field_name
FROM tickets
GROUP BY form_type, field_name
ORDER BY form_type, field_name;
-- Should match legacy field names exactly
```
