# 🏥 Clinical Support Staffing Optimization - Frontend Development PRD
*React/Next.js Frontend Implementation for Ganger Platform*

## 📋 Document Information
- **Application Name**: Clinical Support Staffing Optimization System (Frontend)
- **Terminal Assignment**: TERMINAL 1 - FRONTEND  
- **Priority**: P1 - High Priority
- **Development Timeline**: 4-5 weeks
- **Dependencies**: @ganger/ui (mandatory), @ganger/auth/client, @ganger/utils/client, @ganger/types
- **Integration Requirements**: Backend API endpoints, Real-time subscriptions
- **Quality Standards**: Zero TypeScript errors, 100% @ganger/ui compliance, WCAG 2.1 AA accessibility
- **Performance Budgets**: <2s load time, <100ms interactions, Bundle size <250KB

---

## 🎯 Frontend Scope

### **Terminal 1 Responsibilities**
- React components for staffing interfaces
- Interactive schedule builder with drag & drop
- Real-time UI updates and subscriptions
- Form handling and validation
- Client-side state management
- Mobile-responsive design implementation

### **Excluded from Frontend Terminal**
- API route implementations (Terminal 2)
- Database operations and migrations (Terminal 2)
- External service integrations (Terminal 2)
- Server-side authentication logic (Terminal 2)

---

## 🏗️ Frontend Technology Stack

### **Required Client-Side Packages (MANDATORY USAGE)**

```typescript
'use client'

// ✅ MANDATORY: @ganger/ui components - NO CUSTOM IMPLEMENTATIONS
import { 
  AppLayout, PageHeader, Card, Button, Input, Modal, Chart, 
  LoadingSpinner, DataTable, FormField, Select, StatCard,
  DatePicker, MultiSelect, PersonCard
} from '@ganger/ui';

// ✅ MANDATORY: @ganger/auth client-side only
import { useAuth, AuthProvider } from '@ganger/auth/client';

// ✅ MANDATORY: @ganger/utils client-safe utilities
import { validateForm, formatDate, formatTime } from '@ganger/utils/client';

// ✅ SHARED TYPES: Framework-agnostic types
import { 
  User, Provider, Location, StaffMember, StaffSchedule,
  StaffingOptimizationRule, StaffingAnalytics
} from '@ganger/types';

// ❌ PROHIBITED: No server imports in client components
// import { db } from '@ganger/db'; // Server-only
// import { ServerCommunicationService } from '@ganger/integrations/server'; // Server-only
// import puppeteer from 'puppeteer'; // Server-only
```

### **Frontend-Specific Technology Standards**
- **Drag & Drop**: React DnD for interactive schedule modification (must use @ganger/ui DragDropCalendar)
- **Real-time UI**: Supabase subscriptions for live updates (client-side only)
- **Calendar Components**: Use @ganger/ui calendar components - NO custom implementations
- **Touch Interface**: Mobile-optimized using design tokens from @ganger/ui
- **State Management**: React hooks and context patterns (no external state libraries)

### **Design System Integration (MANDATORY)**
```typescript
// ✅ REQUIRED: Use design tokens exclusively
const designTokens = {
  colors: {
    primary: 'primary-600',      // Primary blue
    secondary: 'secondary-500',   // Success green  
    neutral: 'neutral-600',       // Text gray
    warning: 'warning-500',       // Warning amber
    danger: 'danger-500'          // Error red
  },
  spacing: {
    xs: 'p-1',    // 0.25rem
    sm: 'p-2',    // 0.5rem
    md: 'p-4',    // 1rem
    lg: 'p-6',    // 1.5rem
    xl: 'p-8'     // 2rem
  },
  typography: {
    h1: 'text-3xl font-bold text-neutral-900',
    h2: 'text-2xl font-semibold text-neutral-800',
    h3: 'text-xl font-medium text-neutral-700',
    body: 'text-base text-neutral-600'
  }
};

// ❌ PROHIBITED: Custom colors, spacing, or typography
// className="bg-blue-500" // Use bg-primary-600 instead
// style={{ color: 'blue' }} // Use design tokens
```

### **Next.js Client-Server Boundary Rules**
```typescript
// ✅ REQUIRED: 'use client' for interactive components
'use client'
import { useState, useEffect } from 'react';

// ✅ REQUIRED: Server components for data fetching (no 'use client')
// This goes in a separate server component file
async function StaffingServerData() {
  // Server-side data fetching without 'use client'
  const data = await fetch('/api/staff-schedules');
  return <StaffingClient data={data} />;
}
```

---

## 🎨 User Interface Components

### **Layout Components (MANDATORY @ganger/ui Usage)**
```typescript
'use client'

import { AppLayout, PageHeader, Card } from '@ganger/ui';

export default function StaffingDashboard() {
  return (
    <AppLayout>
      <PageHeader 
        title="Clinical Staffing" 
        subtitle="Optimize support staff assignments"
        className="mb-6"
      />
      
      {/* ✅ REQUIRED: Standard grid with design tokens */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-full">
            <ScheduleBuilderPanel />
          </Card>
        </div>
        <div className="lg:col-span-1">
          <StaffingSidebar />
        </div>
      </div>
    </AppLayout>
  );
}

// ❌ PROHIBITED: Custom layout implementations
// const CustomLayout = ({ children }) => <div className="custom-layout">{children}</div>;
```

### **Schedule Builder Component (ENHANCED WITH QUALITY STANDARDS)**
```typescript
'use client'

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, Button, Select, DatePicker } from '@ganger/ui';
import { formatDate } from '@ganger/utils/client';
import { Provider, StaffMember, StaffSchedule } from '@ganger/types';

interface ScheduleBuilderProps {
  providers: Provider[];
  staffMembers: StaffMember[];
  schedules: StaffSchedule[];
  onScheduleUpdate: (schedules: StaffSchedule[]) => void;
}

export function ScheduleBuilder({ 
  providers, 
  staffMembers, 
  schedules, 
  onScheduleUpdate 
}: ScheduleBuilderProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [draggedStaff, setDraggedStaff] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    setIsLoading(true);
    try {
      // Update schedule assignments with proper error handling
      const updatedSchedules = [...schedules];
      // Handle drag and drop logic with validation
      await onScheduleUpdate(updatedSchedules);
    } catch (error) {
      console.error('Failed to update schedule:', error);
      // Show error toast using @ganger/ui Toast component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <div className="p-6">
        {/* ✅ REQUIRED: Use design tokens for spacing and typography */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Select date"
              className="w-48"
            />
            <Select
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'day', label: 'Day View' },
                { value: 'week', label: 'Week View' }
              ]}
              className="w-32"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          {/* ✅ REQUIRED: Responsive grid using design tokens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-medium text-neutral-700 mb-4">
                Provider Schedules
              </h3>
              <ProviderScheduleGrid 
                providers={providers}
                selectedDate={selectedDate}
                viewMode={viewMode}
              />
            </div>

            <div>
              <h3 className="text-xl font-medium text-neutral-700 mb-4">
                Staff Assignments
              </h3>
              <StaffAssignmentGrid
                staffMembers={staffMembers}
                schedules={schedules}
                selectedDate={selectedDate}
                viewMode={viewMode}
              />
            </div>
          </div>
        </DragDropContext>
      </div>
    </Card>
  );
}

// ❌ PROHIBITED: Custom date picker or select components
// const CustomDatePicker = () => <input type="date" />; // Use @ganger/ui DatePicker
```

### **Staff Assignment Component**
```typescript
'use client'

interface StaffAssignmentGridProps {
  staffMembers: StaffMember[];
  schedules: StaffSchedule[];
  selectedDate: Date;
  viewMode: 'day' | 'week';
}

export function StaffAssignmentGrid({ 
  staffMembers, 
  schedules, 
  selectedDate, 
  viewMode 
}: StaffAssignmentGridProps) {
  const getScheduleForStaff = (staffId: string, date: Date) => {
    return schedules.find(s => 
      s.staff_member_id === staffId && 
      s.schedule_date === formatDate(date)
    );
  };

  return (
    <div className="space-y-4">
      {staffMembers.map(staff => {
        const schedule = getScheduleForStaff(staff.id, selectedDate);
        
        return (
          <Draggable 
            key={staff.id} 
            draggableId={staff.id} 
            index={staffMembers.indexOf(staff)}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`
                  p-4 bg-white rounded-lg border-2 cursor-move
                  ${snapshot.isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
                  hover:border-blue-300 transition-colors
                `}
              >
                <StaffCard
                  staff={staff}
                  schedule={schedule}
                  showAssignment={true}
                  compact={true}
                />
              </div>
            )}
          </Draggable>
        );
      })}
    </div>
  );
}
```

### **Provider Schedule Grid**
```typescript
'use client'

interface ProviderScheduleGridProps {
  providers: Provider[];
  selectedDate: Date;
  viewMode: 'day' | 'week';
}

export function ProviderScheduleGrid({ 
  providers, 
  selectedDate, 
  viewMode 
}: ProviderScheduleGridProps) {
  return (
    <div className="space-y-4">
      {providers.map(provider => (
        <Droppable 
          key={provider.id} 
          droppableId={`provider-${provider.id}`}
          direction="horizontal"
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                p-4 bg-gray-50 rounded-lg border-2 border-dashed
                ${snapshot.isDraggingOver ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                min-h-24 transition-colors
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  {provider.name}
                </h4>
                <div className="text-sm text-gray-500">
                  {formatTime(provider.start_time)} - {formatTime(provider.end_time)}
                </div>
              </div>
              
              <div className="flex space-x-2">
                {/* Assigned staff will appear here when dropped */}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      ))}
    </div>
  );
}
```

### **Staff Management Sidebar**
```typescript
'use client'

export function StaffingSidebar() {
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Available Staff</h3>
          <div className="space-y-2">
            {availableStaff.map(staff => (
              <StaffCard 
                key={staff.id}
                staff={staff}
                showAvailability={true}
                compact={true}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">AI Suggestions</h3>
          <div className="space-y-3">
            {optimizationSuggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {suggestion.description}
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="mt-2"
                  onClick={() => applySuggestion(suggestion)}
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Coverage Status</h3>
          <CoverageMetrics />
        </div>
      </Card>
    </div>
  );
}
```

---

## 📱 Interactive Features

### **Real-time Updates**
```typescript
'use client'

import { useEffect, useState } from 'react';

export function useRealtimeStaffing() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('staff-schedules')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'staff_schedules' },
        (payload) => {
          handleScheduleUpdate(payload);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleScheduleUpdate = (payload: any) => {
    setSchedules(prev => {
      // Update schedules based on real-time changes
      return [...prev];
    });
  };

  return { schedules, isConnected };
}
```

### **Form Handling**
```typescript
'use client'

interface StaffAvailabilityFormProps {
  staff: StaffMember;
  onSubmit: (data: any) => void;
}

export function StaffAvailabilityForm({ staff, onSubmit }: StaffAvailabilityFormProps) {
  const [formData, setFormData] = useState({
    available_start_time: '',
    available_end_time: '',
    location_preferences: [],
    unavailable_dates: [],
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateForm(formData, availabilitySchema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Available Start Time" error={errors.available_start_time}>
          <Input
            type="time"
            value={formData.available_start_time}
            onChange={(value) => setFormData(prev => ({ ...prev, available_start_time: value }))}
          />
        </FormField>

        <FormField label="Available End Time" error={errors.available_end_time}>
          <Input
            type="time"
            value={formData.available_end_time}
            onChange={(value) => setFormData(prev => ({ ...prev, available_end_time: value }))}
          />
        </FormField>
      </div>

      <FormField label="Location Preferences" error={errors.location_preferences}>
        <MultiSelect
          options={locationOptions}
          value={formData.location_preferences}
          onChange={(value) => setFormData(prev => ({ ...prev, location_preferences: value }))}
        />
      </FormField>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Saving...' : 'Update Availability'}
      </Button>
    </form>
  );
}
```

---

## 📊 Data Visualization

### **Coverage Analytics Component**
```typescript
'use client'

export function CoverageAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Staffing Analytics</h2>
        <Select
          value={selectedPeriod}
          onChange={setSelectedPeriod}
          options={[
            { value: 'day', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Coverage Rate"
          value="95%"
          change="+2%"
          trend="up"
          icon="users"
        />
        <StatCard
          title="Optimal Assignments"
          value="87%"
          change="+5%"
          trend="up"
          icon="target"
        />
        <StatCard
          title="Cross-Location"
          value="12"
          change="-1"
          trend="down"
          icon="map-pin"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Coverage Trends</h3>
            <Chart
              type="line"
              data={analyticsData?.coverageTrends}
              height={300}
            />
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Staff Utilization</h3>
            <Chart
              type="bar"
              data={analyticsData?.staffUtilization}
              height={300}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🔄 Client-Server Integration (ENHANCED WITH STANDARDS)

### **Client-Side API Integration Pattern**
```typescript
'use client'

import { ApiResponse, StaffSchedule } from '@ganger/types';

// ✅ REQUIRED: Standard API response format compliance
interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: PaginationMeta;
  };
}

// ✅ REQUIRED: Client-safe API service
export const staffingApi = {
  // Get schedule data with error handling
  async getSchedules(date: string, locationId?: string): Promise<StandardApiResponse<StaffSchedule[]>> {
    const params = new URLSearchParams({ date });
    if (locationId) params.append('locationId', locationId);
    
    try {
      const response = await fetch(`/api/staff-schedules?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          // Authentication headers handled by @ganger/auth
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: StandardApiResponse<StaffSchedule[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'API request failed');
      }
      
      return result;
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      throw error;
    }
  },

  // Update schedule with validation
  async updateSchedule(
    scheduleId: string, 
    data: Partial<StaffSchedule>
  ): Promise<StandardApiResponse<StaffSchedule>> {
    try {
      const response = await fetch(`/api/staff-schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update schedule: ${response.statusText}`);
      }
      
      const result: StandardApiResponse<StaffSchedule> = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to update schedule:', error);
      throw error;
    }
  },

  // Get AI optimization suggestions
  async getOptimizationSuggestions(
    date: string, 
    locationId: string
  ): Promise<StandardApiResponse<OptimizationSuggestion[]>> {
    try {
      const response = await fetch('/api/staffing/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, locationId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get suggestions: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get optimization suggestions:', error);
      throw error;
    }
  }
};

// ❌ PROHIBITED: Direct database access in client components
// import { db } from '@ganger/db'; // Server-only
// const schedules = await db.staff_schedules.findMany(); // Server-only
```

### **Real-Time Subscription Pattern (CLIENT-SAFE)**
```typescript
'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ✅ REQUIRED: Client-side Supabase instance only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useRealtimeStaffing() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // ✅ REQUIRED: Client-side subscription pattern
    const subscription = supabase
      .channel('staff-schedules')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'staff_schedules' },
        (payload) => {
          handleScheduleUpdate(payload);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleScheduleUpdate = (payload: any) => {
    setSchedules(prev => {
      // Update schedules based on real-time changes
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      switch (eventType) {
        case 'INSERT':
          return [...prev, newRecord];
        case 'UPDATE':
          return prev.map(s => s.id === newRecord.id ? newRecord : s);
        case 'DELETE':
          return prev.filter(s => s.id !== oldRecord.id);
        default:
          return prev;
      }
    });
  };

  return { schedules, isConnected, setSchedules };
}

// ❌ PROHIBITED: Server-side database subscriptions in client components
// Server subscriptions must be handled in API routes
```

---

## 🧪 Frontend Testing (ENHANCED STANDARDS)

### **MANDATORY Testing Requirements**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StaffingDashboard } from './StaffingDashboard';

expect.extend(toHaveNoViolations);

describe('StaffingDashboard', () => {
  // ✅ REQUIRED: Component renders correctly
  it('renders schedule builder interface', () => {
    render(<StaffingDashboard />);
    expect(screen.getByText('Clinical Staffing')).toBeInTheDocument();
    expect(screen.getByText('Provider Schedules')).toBeInTheDocument();
    expect(screen.getByText('Staff Assignments')).toBeInTheDocument();
  });

  // ✅ REQUIRED: Accessibility compliance
  it('meets WCAG 2.1 AA accessibility standards', async () => {
    const { container } = render(<StaffingDashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // ✅ REQUIRED: User interaction testing
  it('handles drag and drop interactions', async () => {
    const mockOnUpdate = jest.fn();
    render(
      <ScheduleBuilder 
        providers={mockProviders}
        staffMembers={mockStaff}
        schedules={mockSchedules}
        onScheduleUpdate={mockOnUpdate}
      />
    );
    
    // Test drag and drop functionality
    const staffCard = screen.getByTestId('staff-card-1');
    const providerSlot = screen.getByTestId('provider-slot-1');
    
    fireEvent.dragStart(staffCard);
    fireEvent.dragOver(providerSlot);
    fireEvent.drop(providerSlot);
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  // ✅ REQUIRED: Error handling testing
  it('displays error messages correctly', async () => {
    const mockApi = jest.fn().mockRejectedValue(new Error('API Error'));
    render(<StaffingDashboard />);
    
    // Trigger error condition
    fireEvent.click(screen.getByText('Refresh'));
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  // ✅ REQUIRED: Loading states testing
  it('shows loading indicators during API calls', async () => {
    render(<StaffingDashboard />);
    
    fireEvent.click(screen.getByText('Refresh'));
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // ✅ REQUIRED: Real-time updates testing
  it('updates real-time schedule changes', async () => {
    const { rerender } = render(<StaffingDashboard />);
    
    // Mock real-time update
    const newSchedule = { id: '1', staff_member_id: '1', provider_id: '1' };
    
    // Simulate Supabase real-time event
    // Verify UI updates accordingly
    await waitFor(() => {
      expect(screen.getByText(newSchedule.id)).toBeInTheDocument();
    });
  });

  // ✅ REQUIRED: Mobile responsiveness testing
  it('renders correctly on mobile devices', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<StaffingDashboard />);
    
    expect(screen.getByTestId('mobile-schedule-view')).toBeInTheDocument();
  });
});
```

### **Performance Testing Requirements**
```typescript
import { renderHook } from '@testing-library/react';
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  // ✅ REQUIRED: Component render performance
  it('renders within performance budget (<100ms)', () => {
    const start = performance.now();
    render(<StaffingDashboard />);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(100); // 100ms budget
  });

  // ✅ REQUIRED: Bundle size validation
  it('meets bundle size requirements', async () => {
    const bundleSize = await getBundleSize('./StaffingDashboard');
    expect(bundleSize).toBeLessThan(250000); // 250KB limit
  });

  // ✅ REQUIRED: Memory leak prevention
  it('properly cleans up subscriptions', () => {
    const { unmount } = renderHook(() => useRealtimeStaffing());
    
    // Verify subscription cleanup
    unmount();
    
    // Check for memory leaks
    expect(getActiveSubscriptions()).toHaveLength(0);
  });
});
```

---

## 📱 Mobile Responsiveness

### **Touch-Optimized Interface**
```typescript
'use client'

export function MobileScheduleView() {
  const [touchMode, setTouchMode] = useState(true);
  
  return (
    <div className="lg:hidden">
      {/* Mobile-specific layout */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Staff Schedule</h2>
          <Button 
            size="sm"
            onClick={() => setTouchMode(!touchMode)}
          >
            {touchMode ? 'Edit Mode' : 'View Mode'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Touch-friendly cards */}
        <MobileStaffCards touchMode={touchMode} />
        <MobileProviderCards touchMode={touchMode} />
      </div>
    </div>
  );
}
```

---

## 🔧 Quality Gates and Verification

### **Pre-Commit Quality Gates (MANDATORY)**
```bash
# 1. TypeScript Compilation - ZERO ERRORS TOLERANCE
npm run type-check
# Expected output: "Found 0 errors"

# 2. Component Library Compliance - NO CUSTOM COMPONENTS
npm run audit:ui-compliance  
# Expected output: "✅ UI component compliance verified"

# 3. Client Directive Validation - PROPER 'use client' USAGE
npm run audit:use-client-directive
# Expected output: "✅ All interactive components properly use 'use client' directive"

# 4. Server Import Prevention - NO SERVER CODE IN CLIENT
npm run audit:server-imports
# Expected output: "✅ No server imports found in client code"

# 5. Performance Budget Compliance - BUNDLE SIZE LIMITS
npm run audit:performance-budget
# Expected output: "✅ Performance budget compliance verified"

# 6. Build Verification - PRODUCTION BUILD SUCCESS
npm run build
# Expected output: Build completed successfully
```

### **Development Verification Commands**
```bash
# Frontend-specific commands for Clinical Staffing app
cd apps/clinical-staffing

# TypeScript compilation check
npm run type-check

# Component testing
npm run test

# Accessibility testing
npm run test:a11y

# Performance testing  
npm run test:performance

# Build verification
npm run build

# Bundle analysis
npm run analyze:bundle
```

### **Prohibited Patterns Enforcement**
```typescript
// ❌ PROHIBITED: Custom UI component implementations
const CustomButton = ({ children, onClick }) => (
  <button className="bg-blue-500 px-4 py-2" onClick={onClick}>
    {children}
  </button>
);

// ✅ REQUIRED: Use @ganger/ui components exclusively
import { Button } from '@ganger/ui';
<Button variant="primary" onClick={onClick}>{children}</Button>

// ❌ PROHIBITED: Server imports in client components
'use client'
import { db } from '@ganger/db'; // Server-only package

// ✅ REQUIRED: Client-safe imports only
'use client'
import { validateForm } from '@ganger/utils/client';
```

## 📈 Success Criteria and Launch Requirements

### **Frontend Launch Criteria (ALL MUST PASS)**
- [ ] TypeScript compilation: 0 errors across all components
- [ ] Component library compliance: 100% @ganger/ui usage
- [ ] Client-server boundaries: No server imports in client code
- [ ] Drag & drop functionality: Works across all browsers (Chrome, Firefox, Safari, Edge)
- [ ] Real-time updates: Display correctly with <500ms latency
- [ ] Mobile responsive design: Tested on iOS Safari, Android Chrome
- [ ] Form validation: Clear error feedback using @ganger/ui components
- [ ] Authentication integration: Functional with @ganger/auth/client
- [ ] Accessibility compliance: 100% WCAG 2.1 AA compliance verified
- [ ] Performance benchmarks: All budgets met (<2s load, <250KB bundle)
- [ ] Error handling: Graceful degradation for all failure scenarios

### **Performance Budget Compliance**
```typescript
const CLINICAL_STAFFING_PERFORMANCE_BUDGETS = {
  // Bundle sizes (gzipped)
  javascript: {
    'apps/clinical-staffing/pages/_app.js': 120000,    // 120KB max
    'apps/clinical-staffing/pages/index.js': 250000,   // 250KB max
    'components/ScheduleBuilder.js': 50000,            // 50KB max
  },
  
  // Page load performance
  fcp: 1200,  // First Contentful Paint: 1.2s max
  lcp: 2000,  // Largest Contentful Paint: 2.0s max
  cls: 0.1,   // Cumulative Layout Shift: 0.1 max
  tti: 3000,  // Time to Interactive: 3.0s max
  
  // Component performance
  componentRender: 100,     // Max 100ms initial render
  interactionDelay: 50,     // Max 50ms interaction response
  dragDropResponse: 100     // Max 100ms drag & drop feedback
};
```

### **Frontend Success Metrics**
- **Load Performance**: Schedule builder loads in <2 seconds
- **Interaction Performance**: Drag & drop operations respond within 100ms  
- **Real-time Performance**: Live updates appear within 500ms
- **Mobile Performance**: Touch interactions respond within 100ms
- **Accessibility**: 100% WCAG 2.1 AA compliance (verified with axe-core)
- **Quality**: Zero client-side JavaScript errors in production
- **Bundle Efficiency**: Total JavaScript bundle <250KB gzipped
- **Build Success**: 100% TypeScript compilation success rate

### **User Acceptance Criteria**
- **Workflow Efficiency**: Staff assignment tasks 50% faster than manual process
- **User Satisfaction**: >90% approval rating from clinical staff users
- **Error Reduction**: <1% data entry errors with validation system
- **Mobile Adoption**: 70% of staff use mobile interface successfully
- **Real-time Accuracy**: 99.9% real-time update delivery success rate

## 🚀 Development Workflow and Deployment

### **Frontend Development Phases**

**Phase 1: Foundation Setup (Week 1)**
- [ ] Create `apps/clinical-staffing` application structure
- [ ] Configure Next.js 14 with proper client-server boundaries  
- [ ] Set up @ganger/ui component imports and design tokens
- [ ] Implement authentication integration with @ganger/auth/client
- [ ] Configure TypeScript and ensure 0-error compilation

**Phase 2: Core Components (Week 2-3)**
- [ ] Build main StaffingDashboard layout with @ganger/ui AppLayout
- [ ] Implement ScheduleBuilder component with drag & drop functionality
- [ ] Create StaffAssignmentGrid and ProviderScheduleGrid components
- [ ] Add real-time subscription patterns with Supabase client
- [ ] Implement form handling with validation using @ganger/utils/client

**Phase 3: Advanced Features (Week 4)**
- [ ] Build mobile-responsive interface with design tokens
- [ ] Add data visualization components using @ganger/ui Chart
- [ ] Implement optimization suggestions UI
- [ ] Create analytics dashboard with StatCard components
- [ ] Add comprehensive error handling and loading states

**Phase 4: Testing and Optimization (Week 5)**
- [ ] Complete accessibility testing with axe-core
- [ ] Performance optimization to meet bundle size budgets
- [ ] Cross-browser testing for drag & drop functionality
- [ ] Mobile device testing on iOS and Android
- [ ] User acceptance testing with clinical staff

### **Quality Assurance Protocol**

**Daily Quality Checks:**
```bash
# Run these commands every day during development
npm run type-check          # TypeScript compilation
npm run test                # Component tests
npm run audit:ui-compliance # UI component compliance
npm run audit:server-imports # Client-server boundary verification
```

**Weekly Quality Reviews:**
```bash
# Comprehensive quality review every Friday
npm run build               # Production build verification
npm run test:a11y          # Accessibility compliance
npm run audit:performance-budget # Performance budget compliance
npm run test:performance   # Performance benchmark testing
```

### **Deployment Checklist**

**Pre-Deployment Verification:**
- [ ] All TypeScript compilation passes with 0 errors
- [ ] 100% component test coverage achieved
- [ ] Accessibility compliance verified with automated and manual testing
- [ ] Performance budgets met for all critical metrics
- [ ] Cross-browser compatibility confirmed
- [ ] Mobile responsiveness verified on target devices
- [ ] Real-time functionality tested in staging environment
- [ ] Error scenarios tested and graceful degradation confirmed

**Production Deployment Process:**
1. **Build Verification**: `npm run build` succeeds
2. **Bundle Analysis**: Bundle size under 250KB limit  
3. **Static Export**: Next.js static export for Cloudflare Workers
4. **CDN Upload**: Deploy to Cloudflare with global edge distribution
5. **Health Checks**: Verify application loads and functions correctly
6. **Monitoring Setup**: Configure performance and error monitoring

### **Maintenance and Updates**

**Weekly Maintenance Tasks:**
- Dependency updates (with full testing cycle)
- Performance monitoring review
- User feedback analysis and prioritization
- Bundle size optimization opportunities

**Monthly Security Reviews:**
- Client-side security audit
- Authentication flow verification  
- HIPAA compliance validation for UI components
- Accessibility compliance re-verification

### **Documentation Requirements**

**Required Documentation:**
- [ ] Component API documentation for all custom components
- [ ] Integration guide for connecting to backend APIs
- [ ] Accessibility testing procedures and results
- [ ] Performance testing procedures and benchmarks
- [ ] Mobile testing device matrix and procedures
- [ ] User training materials for clinical staff

**Documentation Standards:**
- All public component interfaces must be documented
- API integration patterns must include error handling examples
- Performance requirements must be quantified and verifiable
- Accessibility features must be documented for screen reader users

---

## 📋 Terminal Coordination Protocol

### **Frontend Terminal (Terminal 1) Responsibilities**
- ✅ All React components and UI implementations
- ✅ Client-side state management and hooks
- ✅ Form handling and validation (client-side)
- ✅ Real-time UI updates and subscriptions
- ✅ Mobile responsive design implementation
- ✅ Accessibility compliance and testing
- ✅ Component testing and performance optimization

### **Backend Terminal (Terminal 2) Dependencies**
- ⏳ API endpoints: `/api/staff-schedules/*` 
- ⏳ API endpoints: `/api/staffing/suggestions`
- ⏳ API endpoints: `/api/staffing/auto-assign`
- ⏳ Database schema: `staff_schedules`, `staff_members`, `providers`
- ⏳ Authentication middleware for API routes
- ⏳ Real-time database triggers for Supabase subscriptions

### **Communication Protocol**
- **Daily Standups**: Coordinate on API contracts and data schemas
- **Weekly Integration**: Test client-server integration points  
- **Blocker Resolution**: Immediate escalation for dependency issues
- **Quality Gates**: Both terminals must pass quality checks before merge

---

*This enhanced frontend PRD provides comprehensive guidance for Terminal 1 to build all React components and user interfaces for the Clinical Staffing application, with clear boundaries to prevent conflicts with Terminal 2's backend work. The document now includes complete quality standards, performance budgets, testing requirements, and development workflows aligned with the Ganger Platform's shared infrastructure and best practices.*