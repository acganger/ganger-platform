# Ganger Platform - Frontend Development Guide

*Complete frontend development reference for React/Next.js applications with @ganger/ui component library.*

## Table of Contents

### **Core Frontend Development**
- [Component Library and UI Standards](#component-library-and-ui-standards)
- [Application Development Guidelines](#application-development-guidelines)
- [Client-Server Integration Patterns](#client-server-integration-patterns)

### **Development Workflow**
- [Frontend Platform Overview](#frontend-platform-overview)
- [Development Environment Setup](#development-environment-setup)
- [Frontend Quality Gates](#frontend-quality-gates)
- [Testing and Debugging](#testing-and-debugging)

### **Companion Documents**
- 🔧 **[Backend Development Guide](./BACKEND_DEVELOPMENT_GUIDE.md)** - Complete backend development reference
- 🏗️ **[Shared Infrastructure Guide](./SHARED_INFRASTRUCTURE_GUIDE.md)** - Platform-wide standards and setup

---

*This frontend guide provides complete guidance for developing React/Next.js applications on the Ganger Platform. Frontend developers should reference this alongside the Shared Infrastructure Guide for platform setup and quality enforcement.*

---

# Component Library and UI Standards

## @ganger/ui Component Library

The @ganger/ui component library provides enterprise-grade components that MUST be used exclusively across all applications. Custom implementations of these components are strictly prohibited.

### Available Components

**Layout Components:**
```typescript
import { AppLayout, PageHeader, Card } from '@ganger/ui';

<AppLayout>
  <PageHeader title="Dashboard" subtitle="Overview" />
  <Card>
    <p>Your content here</p>
  </Card>
</AppLayout>
```

**Form Components:**
```typescript
import { FormField, Input, Button, Select, Checkbox } from '@ganger/ui';

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
  
  <Button type="submit" variant="primary">
    Save Appointment
  </Button>
</form>
```

**Data Display Components:**
```typescript
import { DataTable, StatCard } from '@ganger/ui';

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
```

**Feedback Components:**
```typescript
import { Modal, Toast, LoadingSpinner } from '@ganger/ui';

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
```

## Design System Integration

### Color Token System

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

### Typography Standards

```typescript
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
```

### Spacing and Layout

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

## Prohibited Patterns

### Custom Component Creation

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

### Inline Styling

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

### Direct CSS Classes for UI Elements

```typescript
// ❌ NEVER implement UI elements directly
<input className="border rounded px-3 py-2" />

// ✅ ALWAYS use @ganger/ui components
<Input placeholder="Enter value" />
```

## Standard Usage Patterns

### Form Handling Pattern

```typescript
'use client'

import { useState } from 'react';
import { FormField, Input, Button, Select } from '@ganger/ui';
import { validateForm } from '@ganger/utils/client';

export default function AppointmentForm() {
  const [formData, setFormData] = useState({
    patientName: '',
    appointmentDate: '',
    location: ''
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
      // Use API route for server-side operations
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to create appointment');
      
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

### Data Display Pattern

```typescript
'use client'

import { DataTable, StatCard, Card } from '@ganger/ui';
import { formatDate, formatCurrency } from '@ganger/utils/client';

export default function Dashboard({ appointments, stats }) {
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
      </div>
      
      {/* Data Table */}
      <Card>
        <DataTable
          data={appointments}
          columns={columns}
          searchable
          pagination={{ enabled: true, pageSize: 25 }}
        />
      </Card>
    </div>
  );
}
```

## Quality Standards

### Performance Requirements
- Component Load Time: <100ms initial load
- Re-render Performance: <2ms for prop changes  
- Bundle Size Impact: <5KB per component
- Accessibility: 100% WCAG 2.1 AA compliance
- Browser Support: All modern browsers + IE11

### Component Testing Requirements

```typescript
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
});
```

---

# Application Development Guidelines

## New Application Development Standards

All new applications in the Ganger Platform MUST follow these comprehensive standards to ensure consistency, maintainability, and architectural compliance.

### Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)

```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { /* ALL UI components */ } from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { 
  ClientCommunicationService, 
  ClientPaymentService,
  ClientCacheService 
} from '@ganger/integrations/client';
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  User, Patient, Appointment, Provider,
  ApiResponse, PaginationMeta, ValidationRule
} from '@ganger/types';

// ❌ PROHIBITED IN CLIENT COMPONENTS
import { db, createClient } from '@ganger/db'; // Server-only
import { ServerCommunicationService } from '@ganger/integrations/server'; // Server-only
import { googleapis } from 'googleapis'; // Server-only
import puppeteer from 'puppeteer'; // Server-only
```

## Client-Server Integration Standards

### **Critical Next.js Boundary Rules**

**1. 'use client' Directive Requirements:**
```typescript
// ✅ REQUIRED for interactive components
'use client'

import { useState, useEffect } from 'react';
import { Button } from '@ganger/ui';

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <Button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </Button>
  );
}
```

**2. Server Component Patterns:**
```typescript
// ✅ NO 'use client' - server component
import { db } from '@ganger/db';
import { ServerCommunicationService } from '@ganger/integrations/server';

export default async function ServerComponent() {
  // Server-side data fetching
  const data = await db.appointments.findMany();
  
  return (
    <div>
      <h1>Appointments</h1>
      {data.map(appointment => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  );
}
```

**3. API Route Implementation:**
```typescript
// pages/api/appointments/route.ts - Server-only
import { withAuth } from '@ganger/auth/server';
import { db } from '@ganger/db';
import { ServerCommunicationService } from '@ganger/integrations/server';

export async function POST(request: Request) {
  const data = await request.json();
  
  // Server-side validation and processing
  const appointment = await db.appointments.create({
    data: {
      patientName: data.patientName,
      appointmentDate: data.appointmentDate,
      locationId: data.locationId
    }
  });
  
  // Send confirmation via server communication hub
  await ServerCommunicationService.sendSMS({
    to: data.patientPhone,
    message: `Appointment confirmed for ${data.appointmentDate}`
  });
  
  return Response.json({ success: true, appointment });
}
```

### **Package Export Standards**

**@ganger/integrations Package Structure:**
```typescript
// packages/integrations/client/index.ts
export { ClientCommunicationService } from './communication';
export { ClientPaymentService } from './payment';
export { ClientCacheService } from './cache';

// packages/integrations/server/index.ts  
export { ServerCommunicationService } from './communication';
export { ServerPaymentService } from './payment';
export { ServerPdfService } from './pdf';
export { ServerGoogleService } from './google';
export { ServerCacheService } from './cache';

// packages/integrations/index.ts - Main export
export * from './client';
// NOTE: Server exports are NOT re-exported to prevent client access
```

### **Integration Service Architecture**

**Universal Communication Hub (Client-side):**
```typescript
// ✅ Client-safe communication service
'use client'

import { ClientCommunicationService } from '@ganger/integrations/client';

export default function NotificationComponent() {
  const handleSendNotification = async () => {
    // Client triggers server action via API route
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: 'patient@example.com',
        message: 'Appointment reminder'
      })
    });
  };
  
  return (
    <Button onClick={handleSendNotification}>
      Send Notification
    </Button>
  );
}
```

### **Next.js Configuration Requirements**

**Webpack Configuration (next.config.js):**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Prevent server-only packages from being bundled in client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        child_process: false,
      };
      
      config.externals = [
        ...config.externals,
        'puppeteer',
        'puppeteer-core', 
        '@ganger/db',
        '@ganger/integrations/server',
        'googleapis',
        'ioredis',
        'stripe' // Server Stripe SDK
      ];
    }
    
    return config;
  },
  
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer',
      'googleapis', 
      '@ganger/db'
    ]
  }
};

module.exports = nextConfig;
```

### **Pre-Development Validation**

**Required Validation Steps:**
```bash
# 1. Verify shared package access
npm run audit:package-boundaries

# 2. Validate component library compliance  
npm run audit:ui-compliance

# 3. Check authentication integration
npm run audit:auth-compliance

# 4. Verify performance budgets
npm run audit:performance-budget

# 5. Test client-server boundaries
npm run audit:client-server-boundaries

# 6. Validate 'use client' directive usage
npm run audit:use-client-directive

# 7. Check for server imports in client code
npm run audit:server-imports
```

### **New Application Checklist**

**✅ Pre-Development Setup:**
- [ ] App directory created in `/apps/[app-name]`
- [ ] Package.json configured with required dependencies
- [ ] Shared package imports configured correctly
- [ ] Next.js configuration with client-server boundary enforcement
- [ ] Authentication integration tested
- [ ] Performance budgets defined and configured

**✅ Development Phase:**
- [ ] All UI components use @ganger/ui exclusively
- [ ] No custom authentication implementation
- [ ] Client-server boundaries properly enforced
- [ ] 'use client' directive used appropriately
- [ ] API routes handle all server-side operations
- [ ] TypeScript compilation passes with 0 errors

**✅ Quality Verification:**
- [ ] All quality gates pass (`npm run pre-commit`)
- [ ] Performance budgets met
- [ ] Bundle size within limits
- [ ] Accessibility compliance verified
- [ ] Security compliance passed

**✅ Deployment Readiness:**
- [ ] Production build succeeds
- [ ] Environment variables configured
- [ ] Cloudflare Workers configuration tested
- [ ] Monitoring and health checks enabled

---

# Frontend Platform Overview

## Technology Stack for Frontend Development

### **Core Frontend Technologies**
- **React Framework**: Next.js 14 with App Router
- **TypeScript**: Strict mode with zero-error tolerance
- **UI Library**: @ganger/ui (mandatory usage)
- **Styling**: Tailwind CSS with design tokens
- **State Management**: React hooks + context patterns
- **Form Handling**: @ganger/utils validation with @ganger/ui components

### **Frontend Application Structure**
```
ganger-platform/
├── apps/
│   ├── inventory/              # Medical supply tracking
│   ├── handouts/              # Custom educational materials
│   ├── checkin-kiosk/         # Patient self-service terminal
│   ├── eos-l10/               # Team management dashboard
│   ├── medication-auth/       # Medication authorization workflow
│   └── pharma-scheduling/     # Pharmaceutical rep scheduling
├── packages/
│   ├── ui/                    # ✅ Component library (mandatory)
│   │   ├── components/        # All reusable UI components
│   │   ├── styles/           # Design tokens and global styles
│   │   └── hooks/            # UI-related React hooks
│   ├── auth/client/          # ✅ Client-side authentication
│   ├── utils/client/         # ✅ Client-safe utilities
│   └── types/                # ✅ Shared TypeScript types
```

### **Development URLs**
- **Inventory**: http://localhost:3001
- **Handouts**: http://localhost:3002  
- **Check-in Kiosk**: http://localhost:3003
- **EOS L10**: http://localhost:3004
- **Medication Auth**: http://localhost:3005
- **Pharma Scheduling**: http://localhost:3006

## Development Environment Setup

### **Frontend-Specific Prerequisites**
- **Node.js**: 18+ (required for Next.js 14)
- **VS Code**: With React/TypeScript extensions
- **Browser DevTools**: Chrome DevTools for React profiling

### **Frontend Development Commands**

```bash
# Start all frontend applications
npm run dev

# Start specific applications  
npm run dev:inventory
npm run dev:handouts
npm run dev:checkin-kiosk
npm run dev:eos-l10
npm run dev:medication-auth
npm run dev:pharma-scheduling

# Frontend-specific type checking
npm run type-check:apps

# UI component development
npm run storybook:ui  # Component library development
npm run test:ui       # UI component testing
```

### **Essential Frontend Environment Variables**

```bash
# Client-side environment variables (public)
NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App-specific public config
NEXT_PUBLIC_APP_URL=https://inventory.gangerdermatology.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...

# Performance monitoring
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ERROR_REPORTING=true
```

---

# Frontend Quality Gates

## Frontend-Specific Quality Enforcement

### **Required Frontend Quality Checks**

```bash
# 1. TypeScript Compilation - Zero Errors Tolerance
npm run type-check
# Expected output: "Found 0 errors"

# 2. Component Library Compliance - No Custom Components
npm run audit:ui-compliance  
# Expected output: "✅ UI component compliance verified"

# 3. Client Directive Validation - Proper 'use client' Usage
npm run audit:use-client-directive
# Expected output: "✅ All interactive components properly use 'use client' directive"

# 4. Server Import Prevention - No Server Code in Client
npm run audit:server-imports
# Expected output: "✅ No server imports found in client code"

# 5. Performance Budget Compliance - Bundle Size Limits
npm run audit:performance-budget
# Expected output: "✅ Performance budget compliance verified"

# 6. Build Verification - Production Build Success
npm run build
# Expected output: Build completed successfully
```

### **Frontend-Specific Prohibited Patterns**

**❌ Custom UI Component Creation:**
```typescript
// PROHIBITED - Custom button implementation
const MyButton = ({ children, onClick }) => (
  <button className="bg-blue-500 px-4 py-2" onClick={onClick}>
    {children}
  </button>
);

// ✅ REQUIRED - Use @ganger/ui
import { Button } from '@ganger/ui';
<Button variant="primary" onClick={onClick}>{children}</Button>
```

**❌ Server Imports in Client Components:**
```typescript
// PROHIBITED - Server imports in client components
'use client'
import { db } from '@ganger/db'; // ❌ Server-only package
import { ServerCommunicationService } from '@ganger/integrations/server'; // ❌ Server-only

// ✅ REQUIRED - Client-safe imports only
'use client'
import { ClientCommunicationService } from '@ganger/integrations/client';
import { validateForm } from '@ganger/utils/client';
```

**❌ Missing 'use client' for Interactive Components:**
```typescript
// PROHIBITED - Interactive component without 'use client'
import { useState } from 'react'; // ❌ Requires 'use client'

export default function InteractiveForm() {
  const [value, setValue] = useState(''); // ❌ Will cause hydration errors
  // ...
}

// ✅ REQUIRED - 'use client' for interactive components
'use client'
import { useState } from 'react';

export default function InteractiveForm() {
  const [value, setValue] = useState('');
  // ...
}
```

### **Frontend Performance Budgets**

```typescript
// Enforced frontend performance limits
const FRONTEND_PERFORMANCE_BUDGETS = {
  // Bundle sizes (gzipped)
  javascript: {
    'pages/_app.js': 120000,     // 120KB max app shell
    'pages/index.js': 200000,    // 200KB max home page
    'pages/dashboard.js': 250000, // 250KB max dashboard
  },
  
  // Page load performance
  fcp: 1200,  // First Contentful Paint: 1.2s max
  lcp: 2000,  // Largest Contentful Paint: 2.0s max
  cls: 0.1,   // Cumulative Layout Shift: 0.1 max
  
  // Component performance
  componentRender: 2,     // Max 2ms per component re-render
  initialLoad: 100,       // Max 100ms component initial load
  interactionDelay: 50    // Max 50ms interaction response
};
```

## Testing and Debugging

### **Frontend Testing Requirements**

**Component Testing Pattern:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppointmentForm } from './AppointmentForm';

expect.extend(toHaveNoViolations);

describe('AppointmentForm', () => {
  // ✅ REQUIRED - Component renders correctly
  it('renders form fields correctly', () => {
    render(<AppointmentForm />);
    expect(screen.getByLabelText('Patient Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book Appointment' })).toBeInTheDocument();
  });
  
  // ✅ REQUIRED - Accessibility compliance
  it('meets WCAG 2.1 AA accessibility standards', async () => {
    const { container } = render(<AppointmentForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  // ✅ REQUIRED - User interaction testing
  it('handles form submission correctly', async () => {
    const onSubmit = jest.fn();
    render(<AppointmentForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Patient Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        patientName: 'John Doe'
      });
    });
  });
  
  // ✅ REQUIRED - Error handling
  it('displays validation errors correctly', async () => {
    render(<AppointmentForm />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
    
    await waitFor(() => {
      expect(screen.getByText('Patient name is required')).toBeInTheDocument();
    });
  });
});
```

### **Frontend Debugging Tools**

**React DevTools Setup:**
```typescript
// Development-only performance monitoring
if (process.env.NODE_ENV === 'development') {
  import('@react-devtools/profiler').then(({ Profiler }) => {
    // Enable React DevTools Profiler
  });
}

// Component performance monitoring
export function withPerformanceMonitoring(Component) {
  return function PerformanceMonitoredComponent(props) {
    const startTime = performance.now();
    
    useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 2) { // 2ms budget
        console.warn(`Slow component render: ${Component.name} took ${renderTime}ms`);
      }
    });
    
    return <Component {...props} />;
  };
}
```

**Bundle Analysis:**
```bash
# Analyze bundle size and dependencies
npm run analyze:bundle

# Check for duplicate dependencies  
npm run analyze:duplicates

# Verify tree-shaking effectiveness
npm run analyze:tree-shaking
```

### **Common Frontend Issues and Solutions**

**Hydration Mismatches:**
```typescript
// ❌ PROBLEM - Server/client content mismatch
export default function ClientTime() {
  return <div>{new Date().toLocaleString()}</div>; // Different on server vs client
}

// ✅ SOLUTION - Use useEffect for client-only content
'use client'
import { useState, useEffect } from 'react';

export default function ClientTime() {
  const [time, setTime] = useState<string>('');
  
  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);
  
  return <div>{time || 'Loading...'}</div>;
}
```

**Client-Server Import Conflicts:**
```typescript
// ❌ PROBLEM - Server import in client component
'use client'
import { db } from '@ganger/db'; // Server-only import

// ✅ SOLUTION - Use API routes for server operations
'use client'
export default function DataComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return <div>{/* Render data */}</div>;
}
```

---

*This frontend development guide provides complete guidance for building React/Next.js applications on the Ganger Platform. For backend development and platform infrastructure, see:*

- 🔧 **[Backend Development Guide](./BACKEND_DEVELOPMENT_GUIDE.md)** - APIs, database, server-side development
- 🏗️ **[Shared Infrastructure Guide](./SHARED_INFRASTRUCTURE_GUIDE.md)** - Platform setup, quality gates, deployment

---