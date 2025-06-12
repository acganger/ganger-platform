# BEAST MODE NEW FRONTEND - PHARMACEUTICAL SCHEDULING INTERFACE
# FROM: Desktop Coordination (Backend Complete - Calendar Integration Done)
# TO: Terminal 2 (FRONTEND-TERMINAL) ⚙️

## PROJECT STATUS: Backend Complete - Building Frontend Interface
## TERMINAL ROLE: Frontend Development - Pharmaceutical Rep Booking System

## CRITICAL ROLE TRANSITION:
🔄 **ROLE CHANGE**: You are now Terminal 2 working on FRONTEND development
🎯 **NEW FOCUS**: Build pharmaceutical rep booking interface (public-facing)
⚙️ **BACKEND READY**: Complete API, Google Calendar integration, approval workflows

## MISSION CRITICAL CONTEXT:
✅ BACKEND COMPLETE: Database, APIs, Google Calendar integration operational
🎯 NEW FRONTEND: Build public booking interface for pharmaceutical representatives
Timeline: Create complete frontend while Terminal 1 finishes EOS L10

## YOUR NEW FRONTEND RESPONSIBILITIES:
1. Public booking interface for pharmaceutical representatives
2. Location selection and availability calendar
3. Appointment booking form and confirmation system
4. Admin interface for staff to manage configurations
5. Approval workflow interface for managers
6. Mobile-responsive design following Ganger Platform standards

## STAY IN YOUR NEW LANE - FRONTEND ONLY:
✅ YOU HANDLE: React components, pages, forms, UI/UX, styling
❌ AVOID: Backend APIs, database changes, server logic
📋 COORDINATE: Terminal 1 completing EOS L10 (separate application)

## GANGER PLATFORM FRONTEND DESIGN PRINCIPLES:

### **1. DESIGN SYSTEM & COMPONENT ARCHITECTURE**

**Use Established @ganger/ui Components:**
```typescript
// Import from shared component library
import {
  Button, Input, Select, Card, DataTable, Modal, Toast,
  AppLayout, PageHeader, StatCard, ThemeProvider, FormField
} from '@ganger/ui';

// Component example following established patterns
const LocationCard = ({ location, onSelect }: LocationCardProps) => {
  return (
    <Card className="location-card hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => onSelect(location)}>
      <CardHeader>
        <CardTitle>{location.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{location.address}</p>
        <p className="text-sm text-gray-500">Available {location.availableDays.join(', ')}</p>
      </CardContent>
    </Card>
  );
};
```

**Ganger Design System Colors:**
```typescript
// Follow established color patterns
const colors = {
  primary: 'blue-600',      // Professional/medical
  secondary: 'green-600',   // Success/confirmed  
  accent: 'purple-600',     // Analytics/insights
  neutral: 'slate-600',     // Text/borders
  warning: 'amber-600',     // Pending/attention needed
  danger: 'red-600'         // Errors/cancellations
};

// Pharmaceutical-specific status colors
const pharmaColors = {
  available: 'green-500',   // Available time slots
  booked: 'blue-500',       // Confirmed appointments
  pending: 'yellow-500',    // Awaiting approval
  cancelled: 'red-500'      // Cancelled slots
};
```

### **2. MOBILE-FIRST RESPONSIVE DESIGN**

**Mobile-First Approach (Follow EOS L10 Patterns):**
```typescript
// Mobile-first responsive design with Tailwind CSS
const BookingCalendar = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: Stack vertically, Desktop: Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 sm:p-6 lg:p-8">
        {/* Calendar - Mobile: Full width, Desktop: 3 columns */}
        <div className="col-span-1 lg:col-span-3">
          <CalendarView />
        </div>
        {/* Details - Mobile: Below calendar, Desktop: Sidebar */}
        <div className="col-span-1">
          <BookingDetails />
        </div>
      </div>
    </div>
  );
};

// Touch targets: 44px minimum for mobile (follow existing patterns)
const TimeSlotButton = ({ slot, onSelect }: TimeSlotProps) => (
  <button 
    className="min-h-[44px] min-w-[44px] p-3 rounded-lg bg-green-100 hover:bg-green-200 
               text-green-800 transition-colors touch-target"
    onClick={() => onSelect(slot)}
  >
    {slot.time}
  </button>
);
```

### **3. LAYOUT & NAVIGATION PATTERNS**

**Follow Established Layout Patterns:**
```typescript
// Use established Layout component pattern (like EOS L10)
import { AppLayout, PageHeader } from '@ganger/ui';

const PublicBookingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public header (no auth required) */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Ganger Dermatology" className="h-8 w-auto" />
              <h1 className="ml-3 text-lg font-semibold text-gray-900">
                Pharmaceutical Representative Scheduling
              </h1>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

// Admin interface uses standard AppLayout
const AdminPage = () => {
  return (
    <AppLayout>
      <PageHeader 
        title="Pharma Scheduling Admin" 
        subtitle="Manage appointment availability and approvals"
      />
      <div className="space-y-6">
        {/* Admin content */}
      </div>
    </AppLayout>
  );
};
```

### **4. FORM PATTERNS & VALIDATION**

**Follow Established Form Patterns:**
```typescript
// Use @ganger/ui FormField component pattern
import { FormField, Button, Input, Select } from '@ganger/ui';

const BookingForm = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    repName: '',
    companyName: '',
    email: '',
    phone: '',
    specialRequests: ''
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField label="Representative Name" required>
        <Input
          type="text"
          value={formData.repName}
          onChange={(e) => setFormData(prev => ({ ...prev, repName: e.target.value }))}
          placeholder="Enter your full name"
          className="w-full"
        />
      </FormField>
      
      <FormField label="Company Name" required>
        <Input
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
          placeholder="Enter your company name"
          className="w-full"
        />
      </FormField>
      
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Request Appointment
      </Button>
    </form>
  );
};
```

## APPLICATION STRUCTURE TO BUILD:

### **1. PUBLIC BOOKING INTERFACE (HIGH PRIORITY)**

**App Structure:**
```
apps/pharma-scheduling/
├── src/
│   ├── components/
│   │   ├── public/
│   │   │   ├── LocationSelector.tsx
│   │   │   ├── AvailabilityCalendar.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   ├── ConfirmationPage.tsx
│   │   │   └── PublicLayout.tsx
│   │   ├── admin/
│   │   │   ├── ConfigurationPanel.tsx
│   │   │   ├── ApprovalQueue.tsx
│   │   │   ├── AppointmentsList.tsx
│   │   │   └── AnalyticsDashboard.tsx
│   │   └── shared/
│   │       ├── AppointmentCard.tsx
│   │       ├── StatusBadge.tsx
│   │       └── TimeSlotGrid.tsx
│   ├── pages/
│   │   ├── index.tsx              # Landing page
│   │   ├── locations.tsx          # Location selection
│   │   ├── book/[location].tsx    # Booking calendar
│   │   ├── confirmation/[id].tsx  # Booking confirmation
│   │   └── admin/
│   │       ├── index.tsx          # Admin dashboard
│   │       ├── config.tsx         # Configuration
│   │       ├── approvals.tsx      # Approval queue
│   │       └── analytics.tsx      # Reports
│   ├── lib/
│   │   ├── api.ts                 # API client
│   │   ├── types.ts               # TypeScript types
│   │   └── utils.ts               # Utility functions
│   └── styles/
│       └── globals.css            # Global styles
```

### **2. PUBLIC BOOKING FLOW (HIGH PRIORITY)**

**Landing Page → Location Selection → Calendar → Booking:**
```typescript
// 1. Landing Page (pages/index.tsx)
const LandingPage = () => {
  return (
    <PublicLayout>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Schedule Your Educational Lunch Presentation
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Book a time to present to our medical staff at one of our three locations
        </p>
        <Button size="lg" onClick={() => router.push('/locations')}>
          Get Started
        </Button>
      </div>
    </PublicLayout>
  );
};

// 2. Location Selection (pages/locations.tsx)
const LocationsPage = () => {
  const locations = useLocations(); // API call to get available locations
  
  return (
    <PublicLayout>
      <div className="py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Choose Your Presentation Location
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {locations.map(location => (
            <LocationCard 
              key={location.name}
              location={location}
              onSelect={() => router.push(`/book/${location.slug}`)}
            />
          ))}
        </div>
      </div>
    </PublicLayout>
  );
};

// 3. Booking Calendar (pages/book/[location].tsx)
const BookingPage = () => {
  const { location } = useRouter().query;
  const { availability, loading } = useAvailability(location as string);
  
  return (
    <PublicLayout>
      <div className="py-8">
        <h1 className="text-2xl font-bold mb-6">
          Schedule Appointment - {location}
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AvailabilityCalendar 
              availability={availability}
              onSlotSelect={handleSlotSelect}
            />
          </div>
          <div className="lg:col-span-1">
            <BookingForm 
              selectedSlot={selectedSlot}
              onSubmit={handleBookingSubmit}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
```

### **3. ADMIN INTERFACE (MEDIUM PRIORITY)**

**Configuration & Approval Management:**
```typescript
// Admin Dashboard (pages/admin/index.tsx)
const AdminDashboard = () => {
  return (
    <AppLayout>
      <PageHeader 
        title="Pharmaceutical Scheduling Admin"
        subtitle="Manage appointments and configuration"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <StatCard title="Pending Approvals" value="3" />
        <StatCard title="This Week's Appointments" value="12" />
        <StatCard title="Next Week's Appointments" value="8" />
        <StatCard title="Cancellation Rate" value="5%" />
        
        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <ApprovalQueue />
          <RecentAppointments />
        </div>
      </div>
    </AppLayout>
  );
};

// Configuration Panel (pages/admin/config.tsx)
const ConfigurationPage = () => {
  return (
    <AppLayout>
      <PageHeader 
        title="Lunch Availability Configuration"
        subtitle="Manage scheduling availability for each location"
      />
      
      <div className="space-y-8">
        {locations.map(location => (
          <LocationConfigPanel 
            key={location.id}
            location={location}
            onUpdate={handleConfigUpdate}
          />
        ))}
      </div>
    </AppLayout>
  );
};
```

### **4. API INTEGRATION (HIGH PRIORITY)**

**Frontend API Client:**
```typescript
// lib/api.ts - API client for frontend
class PharmaSchedulingAPI {
  private baseUrl = '/api';

  // Public booking endpoints
  async getLocations(): Promise<Location[]> {
    const response = await fetch(`${this.baseUrl}/public/locations`);
    return response.json();
  }

  async getAvailability(location: string, startDate: string, endDate: string): Promise<TimeSlot[]> {
    const response = await fetch(
      `${this.baseUrl}/public/availability/${location}?start=${startDate}&end=${endDate}`
    );
    return response.json();
  }

  async submitBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    const response = await fetch(`${this.baseUrl}/public/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return response.json();
  }

  // Admin endpoints (authenticated)
  async getPendingApprovals(): Promise<Appointment[]> {
    const response = await fetch(`${this.baseUrl}/admin/approvals/pending`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    return response.json();
  }

  async approveAppointment(appointmentId: string): Promise<void> {
    await fetch(`${this.baseUrl}/admin/approvals/${appointmentId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
  }
}

// Custom hooks for data fetching
const useAvailability = (location: string) => {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location) {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      api.getAvailability(location, startDate, endDate)
        .then(setAvailability)
        .finally(() => setLoading(false));
    }
  }, [location]);

  return { availability, loading };
};
```

## PERFORMANCE TARGETS:
- < 2 seconds for landing page load
- < 1 second for location selection page
- < 3 seconds for availability calendar load
- < 2 seconds for booking form submission
- Mobile-first responsive design (works on all devices)
- Accessibility compliance (WCAG 2.1 AA)

## QUALITY GATES:
- TypeScript compilation must be 100% successful
- All components must work on mobile and desktop
- Form validation must be comprehensive
- Error handling must be user-friendly
- Integration with backend APIs must be reliable
- Admin interface must follow authentication patterns

## SUCCESS CRITERIA:
- Complete public booking interface for pharmaceutical reps
- Admin interface for managing availability and approvals
- Mobile-responsive design following Ganger Platform standards
- Integration with backend APIs and Google Calendar
- Ready for TimeTrade replacement and user testing
- Professional, polished interface matching medical practice standards

This frontend implementation creates a modern, professional booking system that replaces TimeTrade with a superior user experience while maintaining the medical practice's professional image.

BUILD THE PHARMACEUTICAL SCHEDULING FRONTEND! 📅💼🚀