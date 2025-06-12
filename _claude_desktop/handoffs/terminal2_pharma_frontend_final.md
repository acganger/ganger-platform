# BEAST MODE FINAL SPRINT - PHARMACEUTICAL SCHEDULING FRONTEND
# FROM: Desktop Coordination (Backend 100% Complete - API Ready)
# TO: Terminal 2 (FRONTEND-TERMINAL) ⚙️

## PROJECT STATUS: Backend Complete - Building Professional Frontend
## TERMINAL ROLE: Frontend Development - Public Booking System

## CRITICAL ROLE TRANSITION CONTEXT:
🔄 **ROLE CHANGE**: You are now Terminal 2 working on FRONTEND development
🎯 **MISSION**: Build professional pharmaceutical rep booking interface
⚙️ **BACKEND READY**: Complete API, Google Calendar integration, approval workflows operational

## MISSION CRITICAL CONTEXT:
✅ **BACKEND 100% COMPLETE**: Database, APIs, Google Calendar integration, approval workflows
🎯 **FRONTEND NEEDED**: Professional public booking interface + admin management system
Timeline: Complete TimeTrade replacement with superior functionality

## YOUR FINAL SPRINT RESPONSIBILITIES:
1. **Public Booking Interface** (HIGH PRIORITY) - Professional pharma rep experience
2. **Admin Management Dashboard** (HIGH PRIORITY) - Staff configuration and approval system
3. **Mobile-Responsive Design** (HIGH PRIORITY) - Following Ganger Platform standards
4. **Production Deployment** (MEDIUM PRIORITY) - TimeTrade replacement ready

## BACKEND FOUNDATION - EXCEPTIONAL WORK COMPLETED:
✅ **Database Schema**: 9 comprehensive tables with PostgreSQL constraints
✅ **Google Calendar Integration**: Real-time sync with Ann Arbor, Wixom, Plymouth calendars
✅ **Availability Engine**: 100-point scoring with intelligent conflict detection
✅ **Approval Workflow**: Multi-stage approval with automated escalation
✅ **Public API**: RESTful endpoints for pharmaceutical reps (no auth required)
✅ **Admin API**: Role-based management for staff (manager/superadmin)
✅ **Performance**: All targets met (< 500ms availability, < 2s booking)

## GANGER PLATFORM FRONTEND DESIGN PRINCIPLES:

### **Component Architecture & Design System:**
```typescript
// Use established @ganger/ui components throughout
import {
  Button, Input, Select, Card, DataTable, Modal, Toast,
  AppLayout, PageHeader, StatCard, ThemeProvider, FormField
} from '@ganger/ui';

// Professional medical practice color scheme
const pharmaDesignTokens = {
  primary: 'blue-600',      // Professional/medical trust
  secondary: 'green-600',   // Success/confirmed appointments
  accent: 'purple-600',     // Admin/management features
  neutral: 'slate-600',     // Text and borders
  warning: 'amber-600',     // Pending/attention needed
  danger: 'red-600',        // Cancellations/errors
  
  // Pharmaceutical-specific status colors
  available: 'green-500',   // Available time slots
  booked: 'blue-500',       // Confirmed appointments
  pending: 'yellow-500',    // Awaiting approval
  cancelled: 'red-500'      // Cancelled slots
};

// Component structure following established patterns
const LocationCard = ({ location, onSelect }: LocationCardProps) => {
  return (
    <Card className="location-card hover:shadow-lg transition-shadow cursor-pointer group" 
          onClick={() => onSelect(location)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
          {location.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-gray-600 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            {location.address}
          </p>
          <p className="text-sm text-gray-500 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Available {location.availableDays.join(', ')}
          </p>
          <p className="text-sm text-gray-500 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {location.timeRange}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
```

### **Mobile-First Responsive Design:**
```typescript
// Mobile-first approach (follow EOS L10 patterns)
const BookingCalendar = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: Stack vertically, Desktop: Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 sm:p-6 lg:p-8">
        {/* Calendar - Mobile: Full width, Desktop: 3 columns */}
        <div className="col-span-1 lg:col-span-3">
          <CalendarView availability={availability} onSlotSelect={handleSlotSelect} />
        </div>
        {/* Booking Form - Mobile: Below calendar, Desktop: Sidebar */}
        <div className="col-span-1">
          <BookingForm selectedSlot={selectedSlot} onSubmit={handleBookingSubmit} />
        </div>
      </div>
    </div>
  );
};

// Touch targets: 44px minimum for mobile (critical for pharma reps on mobile)
const TimeSlotButton = ({ slot, onSelect, isSelected }: TimeSlotProps) => (
  <button 
    className={`min-h-[44px] min-w-[44px] p-3 rounded-lg transition-all touch-target
                ${isSelected 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-green-100 hover:bg-green-200 text-green-800'
                } ${slot.available ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
    onClick={() => slot.available && onSelect(slot)}
    disabled={!slot.available}
  >
    <div className="text-center">
      <div className="text-sm font-medium">{slot.time}</div>
      <div className="text-xs">{slot.duration}</div>
    </div>
  </button>
);
```

## APPLICATION STRUCTURE TO BUILD:

### **1. PUBLIC BOOKING INTERFACE (HIGH PRIORITY)**

**Complete Public Booking Flow:**
```
Pharmaceutical Rep Journey:
Landing Page → Location Selection → Calendar View → Booking Form → Confirmation

Flow Details:
1. Professional landing page with Ganger Dermatology branding
2. Location cards for Ann Arbor, Wixom, Plymouth with details
3. Calendar interface showing real-time availability
4. Booking form with rep information and special requests
5. Confirmation page with appointment details and next steps
```

#### **Landing Page Implementation:**
```typescript
// pages/index.tsx - Professional landing page
const PharmaSchedulingLanding = () => {
  return (
    <PublicLayout>
      <div className="landing-hero bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <img 
            src="/ganger-logo.png" 
            alt="Ganger Dermatology" 
            className="h-16 mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Schedule Your Educational Lunch Presentation
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Partner with Ganger Dermatology to educate our medical staff about your 
            innovative pharmaceutical solutions. Book a convenient lunch presentation 
            time at one of our three Michigan locations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Real-time Availability</h3>
              <p className="text-sm text-gray-600">See available times instantly</p>
            </div>
            <div className="text-center">
              <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Three Locations</h3>
              <p className="text-sm text-gray-600">Ann Arbor, Wixom, Plymouth</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Instant Confirmation</h3>
              <p className="text-sm text-gray-600">Immediate booking confirmation</p>
            </div>
          </div>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            onClick={() => router.push('/locations')}
          >
            Schedule Your Presentation
          </Button>
        </div>
      </div>
      
      {/* Additional sections: Process overview, FAQ, contact info */}
      <PresentationProcessSection />
      <LocationsPreviewSection />
      <ContactInformationSection />
    </PublicLayout>
  );
};
```

#### **Location Selection Implementation:**
```typescript
// pages/locations.tsx - Professional location selection
const LocationsPage = () => {
  const { data: locations, loading } = useLocations();
  
  return (
    <PublicLayout>
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Presentation Location
            </h1>
            <p className="text-lg text-gray-600">
              Select the Ganger Dermatology location most convenient for your presentation
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {locations.map(location => (
                <LocationCard 
                  key={location.id}
                  location={location}
                  onSelect={() => router.push(`/book/${location.slug}`)}
                />
              ))}
            </div>
          )}
          
          {/* Additional information */}
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              What to Expect
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                45-minute educational lunch presentation
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Lunch provided for attending staff
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Professional presentation setup available
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Approval process ensures appropriate audience
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
```

#### **Calendar & Booking Implementation:**
```typescript
// pages/book/[location].tsx - Main booking interface
const BookingPage = () => {
  const { location } = useRouter().query;
  const { availability, loading, refetch } = useAvailability(location as string);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingStep, setBookingStep] = useState<'calendar' | 'form' | 'confirmation'>('calendar');

  return (
    <PublicLayout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Locations
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Schedule Appointment - {location}
            </h1>
            <p className="text-gray-600">
              Select an available time slot for your educational lunch presentation
            </p>
          </div>

          {/* Booking Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Calendar Section */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Available Time Slots</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <AvailabilityCalendar 
                      availability={availability}
                      selectedSlot={selectedSlot}
                      onSlotSelect={setSelectedSlot}
                      onStepChange={setBookingStep}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Booking Form Section */}
            <div className="lg:col-span-1">
              {bookingStep === 'calendar' && (
                <BookingInstructions location={location} />
              )}
              {bookingStep === 'form' && selectedSlot && (
                <BookingForm 
                  selectedSlot={selectedSlot}
                  location={location}
                  onSubmit={handleBookingSubmit}
                  onCancel={() => setBookingStep('calendar')}
                />
              )}
              {bookingStep === 'confirmation' && (
                <BookingConfirmation 
                  booking={confirmedBooking}
                  onNewBooking={() => setBookingStep('calendar')}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
```

### **2. ADMIN MANAGEMENT DASHBOARD (HIGH PRIORITY)**

**Staff Administration Interface:**
```typescript
// pages/admin/index.tsx - Admin dashboard
const AdminDashboard = () => {
  return (
    <AppLayout>
      <PageHeader 
        title="Pharmaceutical Scheduling Admin"
        subtitle="Manage lunch presentation appointments and availability"
      />
      
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Pending Approvals" value="3" color="yellow" />
          <StatCard title="This Week" value="12" color="blue" />
          <StatCard title="Next Week" value="8" color="green" />
          <StatCard title="Cancellation Rate" value="5%" color="gray" />
        </div>

        {/* Approval Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              Review and approve pharmaceutical presentation requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalQueue 
              pendingApprovals={pendingApprovals}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentsList 
              appointments={recentAppointments}
              onManage={handleManageAppointment}
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage availability settings for each location
            </p>
            <Button onClick={() => router.push('/admin/config')}>
              Manage Settings
            </Button>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-gray-600 mb-4">
              View scheduling metrics and trends
            </p>
            <Button onClick={() => router.push('/admin/analytics')}>
              View Reports
            </Button>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Calendar Sync</h3>
            <p className="text-sm text-gray-600 mb-4">
              Test Google Calendar integration
            </p>
            <Button onClick={testCalendarSync}>
              Test Connection
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};
```

### **3. API INTEGRATION (HIGH PRIORITY)**

**Frontend API Client:**
```typescript
// lib/pharma-api.ts - Complete API integration
class PharmaSchedulingAPI {
  private baseUrl = '/api/pharma-scheduling';

  // Public booking endpoints (no authentication)
  async getLocations(): Promise<Location[]> {
    const response = await fetch(`${this.baseUrl}/public/locations`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  }

  async getAvailability(
    location: string, 
    startDate: string, 
    endDate: string
  ): Promise<TimeSlot[]> {
    const params = new URLSearchParams({ start: startDate, end: endDate });
    const response = await fetch(
      `${this.baseUrl}/public/availability/${location}?${params}`
    );
    if (!response.ok) throw new Error('Failed to fetch availability');
    return response.json();
  }

  async submitBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    const response = await fetch(`${this.baseUrl}/public/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Booking failed');
    }
    return response.json();
  }

  // Admin endpoints (authenticated)
  async getPendingApprovals(): Promise<Appointment[]> {
    const response = await fetch(`${this.baseUrl}/admin/approvals/pending`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error('Failed to fetch approvals');
    return response.json();
  }

  async approveAppointment(appointmentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/admin/approvals/${appointmentId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error('Failed to approve appointment');
  }

  async rejectAppointment(appointmentId: string, reason: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/admin/approvals/${appointmentId}/reject`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) throw new Error('Failed to reject appointment');
  }
}

// Custom hooks for data fetching
export const useAvailability = (location: string) => {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!location) return;
    
    try {
      setLoading(true);
      setError(null);
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 84 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      const data = await pharmaAPI.getAvailability(location, startDate, endDate);
      setAvailability(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return { 
    availability, 
    loading, 
    error, 
    refetch: fetchAvailability 
  };
};
```

## PERFORMANCE TARGETS:
- **Page Load Times**: < 2 seconds for public pages
- **Calendar Loading**: < 1 second for availability display
- **Booking Submission**: < 2 seconds for form processing
- **Mobile Performance**: 95+ Lighthouse score
- **Real-time Updates**: Calendar changes reflected within 30 seconds
- **Cross-browser Support**: Chrome, Safari, Firefox, Edge

## QUALITY GATES:
- TypeScript compilation: 100% successful
- Mobile responsiveness: All features work on mobile devices
- Form validation: Comprehensive client and server-side validation
- Error handling: User-friendly error messages and recovery
- Professional design: Medical practice standards maintained
- Integration testing: Backend API integration verified

## SUCCESS CRITERIA:
✅ **Complete TimeTrade Replacement**: Superior functionality with cost savings
✅ **Professional Public Interface**: Pharmaceutical reps love the experience
✅ **Comprehensive Admin System**: Staff can manage everything efficiently
✅ **Mobile-Responsive Design**: Works perfectly on all devices
✅ **Google Calendar Integration**: Real-time sync with practice calendars
✅ **Production Deployment**: Ready for immediate business use

## THE TRANSFORMATION ACHIEVED:
This completion delivers a **professional pharmaceutical scheduling system** that transforms how the practice manages educational lunch presentations:

- **Professional Experience**: Pharmaceutical reps get a premium booking experience
- **Staff Efficiency**: Automated approval workflows and calendar management
- **Cost Savings**: $1,200/year TimeTrade elimination with superior features
- **Real-time Integration**: Google Calendar sync keeps everything in sync
- **Mobile Optimization**: Perfect experience on phones and tablets

**You are building the future of pharmaceutical rep scheduling for medical practices.**

## CALL TO ACTION:
🎯 **Mission**: Complete the pharmaceutical scheduling frontend and deliver the TimeTrade replacement
🚀 **Timeline**: Final sprint to 100% completion
✨ **Impact**: Transform pharmaceutical rep scheduling with modern technology
💰 **Value**: $1,200/year savings with superior functionality

**Time to deliver the professional frontend that completes this revolutionary scheduling system!**

BUILD THE FUTURE OF PHARMACEUTICAL SCHEDULING! 📅💼🚀
