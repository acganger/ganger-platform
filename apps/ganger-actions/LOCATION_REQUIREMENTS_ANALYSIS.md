# Location Requirements Analysis for Ganger Actions Forms

## Executive Summary

This analysis determines which forms actually require location fields and which can default to the user's profile location. The key finding is that there's a **critical mismatch** between the legacy locations (Wixom, Ann Arbor, Plymouth) and the user profile locations (Northfield, Woodbury, Burnsville).

## Location Mismatch Issue

### Legacy System Locations:
- **Wixom** 
- **Ann Arbor**
- **Plymouth**

### User Profile Locations (from database.ts):
- **Northfield**
- **Woodbury** 
- **Burnsville**
- **Multiple** (for users who work at multiple locations)

**CRITICAL**: These are completely different sets of locations! This indicates either:
1. The company moved/renamed offices between legacy and new system
2. There's a mapping that needs to be applied
3. The analysis is looking at different organizations

## Form-by-Form Location Requirements

### 1. **Support Ticket** ✅ REQUIRES LOCATION
- **Why**: IT needs to know which physical office has the issue
- **Use Case**: "Printer broken in Wixom office" vs "Network down in Ann Arbor"
- **Implementation**: Must show dropdown with all office locations
- **Default**: Can default to user's profile location but must be changeable

### 2. **Time Off Request** ❌ DOES NOT REQUIRE LOCATION
- **Why**: Time off applies to the employee regardless of location
- **Use Case**: Employee takes vacation - doesn't matter which office
- **Implementation**: Use employee's profile location for reporting only
- **Default**: Automatically use user's profile location (hidden field)

### 3. **Punch Fix** ❌ DOES NOT REQUIRE LOCATION  
- **Why**: Punch corrections are tied to the employee, not location
- **Use Case**: Employee forgot to clock out - location is wherever they work
- **Implementation**: Use employee's profile location
- **Default**: Automatically use user's profile location (hidden field)

### 4. **Change of Availability** ⚠️ MAY REQUIRE LOCATION
- **Why**: Availability might differ by location if employee works at multiple sites
- **Use Case**: "Available Mondays only at Wixom, all days at Ann Arbor"
- **Implementation**: 
  - If user has location = "Multiple", show location dropdown
  - Otherwise, use profile location
- **Default**: Hide field unless user works at multiple locations

### 5. **Expense Reimbursement** ❌ DOES NOT REQUIRE LOCATION
- **Why**: Expenses are tied to the employee, not office location
- **Use Case**: Employee buys supplies - reimbursement goes to employee
- **Implementation**: Not needed in form
- **Default**: Can use profile location for accounting purposes only

### 6. **Meeting Request** ✅ REQUIRES LOCATION
- **Why**: Need to know which office's conference room to book
- **Use Case**: "Book conference room at Ann Arbor office"
- **Implementation**: Must show dropdown with all office locations
- **Default**: Can default to user's location but must be changeable

### 7. **Impact Filter** ❌ DOES NOT REQUIRE LOCATION
- **Why**: Goals/objectives are typically company-wide
- **Use Case**: Strategic initiatives affect all locations
- **Implementation**: Not needed in form
- **Default**: Not applicable

## Recommended Implementation Strategy

### 1. Create Location Mapping
Since the locations don't match, we need either:
```typescript
// Option A: If offices were renamed/moved
const locationMapping = {
  'Wixom': 'Northfield',
  'Ann Arbor': 'Woodbury',
  'Plymouth': 'Burnsville'
};

// Option B: Support both sets of locations
type LegacyLocation = 'Wixom' | 'Ann Arbor' | 'Plymouth';
type CurrentLocation = 'Northfield' | 'Woodbury' | 'Burnsville' | 'Multiple';
type AllLocations = LegacyLocation | CurrentLocation;
```

### 2. Form-Specific Implementation

```typescript
// Support Ticket - Always show location dropdown
<Select
  name="location"
  label="Location *"
  required
  defaultValue={user.location !== 'Multiple' ? user.location : undefined}
  options={ALL_LOCATIONS}
/>

// Time Off Request - Hidden field
<input type="hidden" name="location" value={user.location} />

// Meeting Request - Show location dropdown
<Select
  name="location"
  label="Meeting Location *"
  required
  defaultValue={user.location !== 'Multiple' ? user.location : undefined}
  options={ALL_LOCATIONS}
/>

// Change of Availability - Conditional display
{user.location === 'Multiple' && (
  <Select
    name="location"
    label="Location"
    options={ALL_LOCATIONS}
  />
)}
```

### 3. Database Considerations

For backward compatibility with legacy data:
```sql
-- Add computed column to handle both location sets
ALTER TABLE tickets ADD COLUMN normalized_location TEXT 
GENERATED ALWAYS AS (
  CASE 
    WHEN form_data->>'location' IN ('Wixom', 'Ann Arbor', 'Plymouth') THEN form_data->>'location'
    WHEN form_data->>'location' IN ('Northfield', 'Woodbury', 'Burnsville') THEN form_data->>'location'
    ELSE 'Unknown'
  END
) STORED;
```

## Action Items

1. **URGENT**: Clarify the location mismatch with stakeholders
   - Are these the same offices with new names?
   - Do we need to support both sets of locations?
   - Is there a migration mapping needed?

2. **Update Forms**:
   - Support Ticket: Keep location dropdown (fix values)
   - Time Off Request: Remove location field from form
   - Punch Fix: Remove location field from form
   - Change of Availability: Make conditional based on user.location
   - Expense Reimbursement: Remove location field
   - Meeting Request: Keep location dropdown
   - Impact Filter: Remove location field

3. **User Profile Integration**:
   - Ensure all forms have access to authenticated user's profile
   - Use profile location as default where applicable
   - Handle "Multiple" location users appropriately

4. **Legacy Data Migration**:
   - Create mapping between old and new location values
   - Update migration scripts to handle location transformation
   - Ensure backward compatibility for existing tickets

## Summary Table

| Form Type | Requires Location Field | Source | Reasoning |
|-----------|------------------------|--------|-----------|
| Support Ticket | ✅ Yes | Dropdown | IT needs to know which office |
| Time Off Request | ❌ No | User Profile | Time off isn't location-specific |
| Punch Fix | ❌ No | User Profile | Punches tied to employee |
| Change of Availability | ⚠️ Conditional | Dropdown if Multiple | Only if works multiple locations |
| Expense Reimbursement | ❌ No | User Profile | Expenses tied to employee |
| Meeting Request | ✅ Yes | Dropdown | Need to book specific office room |
| Impact Filter | ❌ No | Not Needed | Company-wide objectives |

## Critical Next Steps

1. **Resolve location mismatch** between legacy and current systems
2. **Update form components** to match requirements above
3. **Test with users** who have location = "Multiple"
4. **Update validation schemas** to make location optional where appropriate
5. **Ensure backward compatibility** with existing legacy data