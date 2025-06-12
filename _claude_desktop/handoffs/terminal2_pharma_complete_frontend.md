# BEAST MODE FINAL SPRINT - PHARMACEUTICAL SCHEDULING FRONTEND COMPLETE
# FROM: Desktop Coordination (Backend 100% Complete - Calendar Integration Operational)
# TO: Terminal 2 (FRONTEND-TERMINAL) ⚙️

## PROJECT STATUS: Backend Complete - Building Professional Frontend Interface
## TERMINAL ROLE: Frontend Development - Public Booking & Admin Management System

## CRITICAL ROLE TRANSITION CONTEXT:
🔄 **ROLE CHANGE**: You are now Terminal 2 working on FRONTEND development
🎯 **MISSION**: Build professional pharmaceutical rep booking interface to replace TimeTrade
⚙️ **BACKEND 100% READY**: Complete API, Google Calendar integration, approval workflows operational

## MISSION CRITICAL CONTEXT:
✅ **BACKEND INFRASTRUCTURE COMPLETE**: Database schema, APIs, Google Calendar integration, approval workflows
🎯 **FRONTEND IMPLEMENTATION NEEDED**: Professional public booking interface + comprehensive admin system
Timeline: Complete TimeTrade replacement with superior functionality (1-2 weeks)

## YOUR FINAL SPRINT RESPONSIBILITIES:
1. **Public Booking Interface** (HIGH PRIORITY) - Professional pharma rep booking experience
2. **Admin Management Dashboard** (HIGH PRIORITY) - Staff configuration and approval system
3. **Mobile-Responsive Design** (HIGH PRIORITY) - Ganger Platform design standards compliance
4. **Production Deployment Integration** (MEDIUM PRIORITY) - TimeTrade replacement ready

## STAY IN YOUR NEW LANE - FRONTEND ONLY:
✅ **YOU HANDLE**: React components, pages, forms, UI/UX, styling, API integration
❌ **AVOID**: Backend APIs, database changes, server logic, calendar service modifications
📋 **COORDINATE**: Terminal 1 completing EOS L10 meeting preparation (separate application)

## BACKEND FOUNDATION - EXCEPTIONAL WORK COMPLETED:
✅ **Database Schema**: 9 comprehensive tables with PostgreSQL constraints and sample data
✅ **Google Calendar Integration**: Real-time sync with Ann Arbor, Wixom, Plymouth calendars
✅ **Availability Engine**: 100-point scoring system with intelligent conflict detection
✅ **Approval Workflow**: Multi-stage approval process with automated escalation
✅ **Public Booking API**: RESTful endpoints for pharmaceutical reps (no authentication required)
✅ **Admin Configuration API**: Role-based management interface (manager/superadmin access)
✅ **Performance Targets Met**: < 500ms availability queries, < 2s booking processing
✅ **Google Calendar Event Creation**: Exact TimeTrade format with proper timezone handling
✅ **Location Configuration**: Ann Arbor, Wixom, Plymouth with specific calendar IDs configured

## GANGER PLATFORM FRONTEND DESIGN PRINCIPLES:

### **1. COMPONENT ARCHITECTURE & DESIGN SYSTEM**

**Use Established @ganger/ui Components Throughout:**
```typescript
// Import from shared component library - maintain consistency
import {
  Button, Input, Select, Card, DataTable, Modal, Toast,
  AppLayout, PageHeader, StatCard, ThemeProvider, FormField
} from '@ganger/ui';

// Follow established component patterns from EOS L10 and other apps
const LocationCard = ({ location, onSelect }: LocationCardProps) => {
  return (
    <Card className="location-card hover:shadow-lg transition-all duration-200 cursor-pointer group
                   border border-gray-200 hover:border-blue-300 hover:shadow-xl" 
          onClick={() => onSelect(location)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 
                            transition-colors duration-200">
          {location.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm">{location.address}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-xs">Available {location.availableDays.join(', ')}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-xs">{location.timeRange}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Professional Medical Practice Color Scheme:**
```typescript
// Follow established Ganger Platform color patterns
const pharmaDesignTokens = {
  primary: 'blue-600',        // Professional/medical trust
  secondary: 'green-600',     // Success/confirmed appointments
  accent: 'purple-600',       // Admin/management features
  neutral: 'slate-600',       // Text and borders
  warning: 'amber-600',       // Pending/attention needed
  danger: 'red-600',          // Cancellations/errors
  
  // Pharmaceutical-specific status colors
  available: 'green-500',     // Available time slots
  booked: 'blue-500',         // Confirmed appointments
  pending: 'yellow-500',      // Awaiting approval
  cancelled: 'red-500'        // Cancelled slots
};
```

### **2. MOBILE-FIRST RESPONSIVE DESIGN**

**Mobile-First Approach (Follow EOS L10 Established Patterns):**
```typescript
const BookingCalendar = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 sm:p-6 lg:p-8">
        {/* Calendar - Mobile: Full width, Desktop: 3 columns */}
        <div className="col-span-1 lg:col-span-3">
          <CalendarView />
        </div>
        {/* Booking Form - Mobile: Below calendar, Desktop: Sidebar */}
        <div className="col-span-1">
          <BookingFormCard />
        </div>
      </div>
    </div>
  );
};

// Touch targets: 44px minimum for mobile
const TimeSlotButton = ({ slot, onSelect, isSelected }: TimeSlotProps) => (
  <button 
    className={`min-h-[44px] min-w-[44px] p-3 rounded-lg transition-all 
                ${isSelected 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-green-100 hover:bg-green-200 text-green-800'
                }`}
    onClick={() => onSelect(slot)}
  >
    <div className="text-center">
      <div className="font-semibold">{slot.time}</div>
      <div className="text-xs">{slot.duration}</div>
    </div>
  </button>
);
```

### **3. LAYOUT & NAVIGATION PATTERNS**

**Follow Established Layout Patterns:**
```typescript
// Public-facing layout (no authentication required)
const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/ganger-logo.png" alt="Ganger Dermatology" className="h-8 w-auto" />
              <h1 className="ml-3 text-lg font-semibold text-gray-900">
                Pharmaceutical Representative Scheduling
              </h1>
            </div>
          </div>
        </div>
      </header>
      
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
  const locations = useLocations();
  
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
