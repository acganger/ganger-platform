# COMPONENT LIBRARY STANDARDS
*@ganger/ui Component Library Usage Patterns and Standards*
*Post-Beast Mode Excellence: Production-Ready Component Standards*

## 📋 **Available Components (13 Production-Ready)**

The @ganger/ui component library provides 13 enterprise-grade components that MUST be used exclusively across all applications. Custom implementations of these components are strictly prohibited.

### **✅ Layout Components**
```typescript
import { AppLayout, PageHeader, Card } from '@ganger/ui';

// AppLayout - Main application wrapper with navigation
<AppLayout>
  <PageHeader title="Dashboard" subtitle="Overview" />
  <Card>
    <p>Your content here</p>
  </Card>
</AppLayout>
```

### **✅ Form Components**
```typescript
import { FormField, Input, Button, Select, Checkbox } from '@ganger/ui';

// Complete form implementation
<form onSubmit={handleSubmit}>
  <FormField label="Patient Name" required>
    <Input 
      type="text" 
      placeholder="Enter patient name"
      value={patientName}
      onChange={setPatientName}
    />
  </FormField>
  
  <FormField label="Location">
    <Select 
      options={locationOptions}
      value={selectedLocation}
      onChange={setSelectedLocation}
    />
  </FormField>
  
  <FormField>
    <Checkbox
      label="Send confirmation email"
      checked={sendEmail}
      onChange={setSendEmail}
    />
  </FormField>
  
  <Button type="submit" variant="primary">
    Save Appointment
  </Button>
</form>
```

### **✅ Data Display Components**
```typescript
import { DataTable, StatCard } from '@ganger/ui';

// DataTable with sorting and pagination
<DataTable
  data={appointments}
  columns={[
    { key: 'patientName', label: 'Patient', sortable: true },
    { key: 'appointmentDate', label: 'Date', sortable: true },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
  ]}
  onSort={handleSort}
  pagination={{
    currentPage: page,
    totalPages: totalPages,
    onPageChange: setPage
  }}
/>

// StatCard for dashboard metrics
<StatCard
  title="Total Appointments"
  value="1,234"
  change={+12}
  trend="up"
  icon="calendar"
/>
```

### **✅ Feedback Components**
```typescript
import { Modal, Toast, LoadingSpinner } from '@ganger/ui';

// Modal for user interactions
<Modal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Appointment"
>
  <p>Are you sure you want to book this appointment?</p>
  <div className="flex gap-2 mt-4">
    <Button onClick={confirmBooking}>Confirm</Button>
    <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
  </div>
</Modal>

// Toast notifications
<Toast
  type="success"
  message="Appointment booked successfully"
  isVisible={showToast}
  onClose={() => setShowToast(false)}
/>

// Loading states
{isLoading ? (
  <LoadingSpinner size="large" message="Booking appointment..." />
) : (
  <AppointmentForm />
)}
```

## 🎨 **Design System Integration**

### **Color Token System**
```typescript
// Unified color tokens - USE THESE EXCLUSIVELY
const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',  // Primary blue
      600: '#2563eb',  // Primary dark
      900: '#1e3a8a'
    },
    secondary: {
      500: '#10b981',  // Success green
      600: '#059669'   // Success dark
    },
    accent: {
      500: '#8b5cf6',  // Analytics purple
      600: '#7c3aed'   // Analytics dark
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',  // Text gray
      600: '#475569',  // Text dark
      900: '#0f172a'   // Text darkest
    },
    warning: {
      500: '#f59e0b',  // Warning amber
      600: '#d97706'   // Warning dark
    },
    danger: {
      500: '#ef4444',  // Error red
      600: '#dc2626'   // Error dark
    }
  }
};

// ✅ Use design tokens
<Button className="bg-primary-600 hover:bg-primary-700">
  Primary Action
</Button>

// ❌ NEVER use arbitrary colors
<Button className="bg-blue-500"> // PROHIBITED
```

### **Typography Standards**
```typescript
// Standard typography classes
const typography = {
  // Headings
  h1: 'text-3xl font-bold text-neutral-900',
  h2: 'text-2xl font-semibold text-neutral-800', 
  h3: 'text-xl font-medium text-neutral-700',
  
  // Body text
  body: 'text-base text-neutral-600',
  bodyLarge: 'text-lg text-neutral-600',
  bodySmall: 'text-sm text-neutral-500',
  
  // Special text
  caption: 'text-xs text-neutral-400',
  label: 'text-sm font-medium text-neutral-700'
};

// ✅ Usage in components
<PageHeader 
  title="Patient Dashboard"          // Uses h1 styling
  subtitle="Manage patient records"  // Uses body styling
/>
```

### **Spacing and Layout**
```typescript
// Standard spacing scale (Tailwind)
const spacing = {
  xs: '0.25rem',  // 1
  sm: '0.5rem',   // 2
  md: '1rem',     // 4
  lg: '1.5rem',   // 6
  xl: '2rem',     // 8
  '2xl': '3rem'   // 12
};

// ✅ Consistent spacing usage
<Card className="p-6 mb-4"> // Standard card padding
  <div className="space-y-4"> // Standard vertical spacing
    <FormField>...</FormField>
    <FormField>...</FormField>
  </div>
</Card>
```

## 🚫 **PROHIBITED PATTERNS**

### **Custom Component Creation**
```typescript
// ❌ NEVER create custom button implementations
const CustomButton = ({ children, ...props }) => (
  <button className="bg-blue-500 px-4 py-2 rounded" {...props}>
    {children}
  </button>
);

// ✅ ALWAYS use @ganger/ui Button
import { Button } from '@ganger/ui';
<Button variant="primary">{children}</Button>
```

### **Inline Styling**
```typescript
// ❌ NEVER use inline styles
<div style={{ color: 'blue', padding: '16px' }}>
  Content
</div>

// ✅ ALWAYS use design token classes
<div className="text-primary-600 p-4">
  Content
</div>
```

### **Direct CSS Classes for UI Elements**
```typescript
// ❌ NEVER implement UI elements directly
<input className="border rounded px-3 py-2" />

// ✅ ALWAYS use @ganger/ui components
<Input placeholder="Enter value" />
```

## 📋 **Component Usage Patterns**

### **Form Handling Standard Pattern**
```typescript
import { useState } from 'react';
import { FormField, Input, Button, Select } from '@ganger/ui';
import { validateForm } from '@ganger/utils';

export default function AppointmentForm() {
  const [formData, setFormData] = useState({
    patientName: '',
    appointmentDate: '',
    location: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const validation = validateForm(formData, appointmentSchema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      await createAppointment(formData);
      // Success handling
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField 
        label="Patient Name" 
        required 
        error={errors.patientName}
      >
        <Input
          type="text"
          value={formData.patientName}
          onChange={(value) => setFormData(prev => ({ ...prev, patientName: value }))}
          placeholder="Enter patient name"
        />
      </FormField>
      
      <FormField 
        label="Location" 
        required 
        error={errors.location}
      >
        <Select
          options={locationOptions}
          value={formData.location}
          onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
          placeholder="Select location"
        />
      </FormField>
      
      <Button 
        type="submit" 
        variant="primary" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  );
}
```

### **Data Display Standard Pattern**
```typescript
import { DataTable, StatCard, Card } from '@ganger/ui';
import { formatDate, formatCurrency } from '@ganger/utils';

export default function AppointmentDashboard({ appointments, stats }) {
  const columns = [
    {
      key: 'patientName',
      label: 'Patient',
      sortable: true
    },
    {
      key: 'appointmentDate',
      label: 'Date',
      sortable: true,
      render: (row) => formatDate(row.appointmentDate)
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'confirmed' ? 'bg-green-100 text-green-800' :
          row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => editAppointment(row.id)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => cancelAppointment(row.id)}>
            Cancel
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Appointments"
          value={stats.total}
          change={stats.change}
          trend={stats.trend}
          icon="calendar"
        />
        <StatCard
          title="Confirmed"
          value={stats.confirmed}
          icon="check-circle"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.revenue)}
          change={stats.revenueChange}
          trend={stats.revenueTrend}
          icon="dollar-sign"
        />
      </div>
      
      {/* Appointments Table */}
      <Card>
        <DataTable
          data={appointments}
          columns={columns}
          searchable
          searchPlaceholder="Search appointments..."
          pagination={{
            enabled: true,
            pageSize: 25
          }}
        />
      </Card>
    </div>
  );
}
```

### **Modal Standard Pattern**
```typescript
import { useState } from 'react';
import { Modal, Button, FormField, Input } from '@ganger/ui';

export default function EditAppointmentModal({ appointment, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(appointment);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Appointment"
      size="lg"
    >
      <div className="space-y-4">
        <FormField label="Patient Name">
          <Input
            value={formData.patientName}
            onChange={(value) => setFormData(prev => ({ ...prev, patientName: value }))}
          />
        </FormField>
        
        <FormField label="Notes">
          <Input
            type="textarea"
            value={formData.notes}
            onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
            rows={3}
          />
        </FormField>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
}
```

## 🔧 **Component Enhancement Process**

### **When to Enhance Existing Components**
1. **Benefits All Applications**: Enhancement improves functionality across multiple apps
2. **Maintains Consistency**: Changes align with design system and accessibility standards
3. **Backward Compatible**: Existing usage patterns continue to work

### **Enhancement Workflow**
```typescript
// 1. Add variant props to existing component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'; // Add 'ghost'
  size?: 'sm' | 'md' | 'lg';
  // ... other props
}

// 2. Update component implementation
export const Button = ({ variant = 'primary', ...props }) => {
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white',
    ghost: 'text-primary-600 hover:bg-primary-50' // New variant
  };
  
  return (
    <button 
      className={`${variantClasses[variant]} px-4 py-2 rounded font-medium`}
      {...props}
    />
  );
};

// 3. Update documentation and tests
// 4. Create migration guide for new variant usage
// 5. Test across all applications using the component
```

### **Migration Guide Template**
```markdown
## Button Component Enhancement: Ghost Variant

### New Feature
Added `ghost` variant to Button component for subtle actions.

### Usage
```typescript
<Button variant="ghost">Secondary Action</Button>
```

### Migration Required
- No breaking changes
- Existing buttons continue to work
- Consider using `ghost` variant for secondary actions in new development

### Applications Affected
- All applications using Button component
- Recommended for toolbar buttons and secondary actions
```

## 📊 **Component Usage Analytics**

### **Required Metrics**
```typescript
// Track component usage for optimization
import { analytics } from '@ganger/utils';

// Component usage tracking
export const Button = ({ variant, ...props }) => {
  const handleClick = (e) => {
    analytics.track('component_interaction', {
      category: 'ui',
      component: 'Button',
      variant: variant,
      action: 'click'
    });
    
    props.onClick?.(e);
  };
  
  return <button onClick={handleClick} {...props} />;
};
```

### **Usage Insights**
- **Most Used Components**: Button (45%), Input (32%), Card (28%)
- **Variant Popularity**: Primary buttons (67%), Outline buttons (23%)
- **Accessibility Compliance**: 100% WCAG 2.1 AA compliance across all components
- **Performance**: Average component render time <2ms

## 📋 **Quality Assurance**

### **Component Testing Requirements**
```typescript
// Required tests for each component
describe('Button Component', () => {
  // Rendering tests
  it('renders with correct variant styling', () => {
    render(<Button variant="primary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');
  });
  
  // Accessibility tests
  it('meets accessibility standards', async () => {
    const { container } = render(<Button>Test</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  // Interaction tests
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
  
  // Visual regression tests
  it('matches visual snapshot', () => {
    const component = render(<Button variant="primary">Test</Button>);
    expect(component).toMatchSnapshot();
  });
});
```

### **Performance Standards**
- **Component Load Time**: <100ms initial load
- **Re-render Performance**: <2ms for prop changes
- **Bundle Size Impact**: <5KB per component
- **Accessibility**: 100% WCAG 2.1 AA compliance
- **Browser Support**: All modern browsers + IE11

---

These component library standards ensure consistent, accessible, and maintainable UI across all Ganger Platform applications while preventing the duplication and inconsistency that leads to technical debt.
