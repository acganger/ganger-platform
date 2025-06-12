# BEAST MODE MODIFICATION - PHARMA SCHEDULING GOOGLE CALENDAR INTEGRATION
# FROM: Desktop Coordination (Requirements Clarification)
# TO: Terminal 2 (BACKEND-TERMINAL) ⚙️

## PROJECT STATUS: Pharmaceutical Scheduling - Add Calendar Integration
## TERMINAL ROLE: Backend Development - Google Calendar Integration & Config

## MISSION CRITICAL CONTEXT:
🎯 MODIFICATION: Add Google Calendar integration for 3-office lunch scheduling
📅 CALENDAR IDS: Specific Google Calendar IDs for each location provided
⚙️ CONFIG SYSTEM: Internal admin page for availability management
Timeline: Modify pharmaceutical scheduling backend for calendar integration

## CRITICAL CALENDAR INFORMATION PROVIDED BY USER:

### **Google Calendar IDs for Each Location:**
```typescript
const LUNCH_CALENDARS = {
  'Ann Arbor': 'gangerdermatology.com_b4jajesjfje9qfko0gn3kp9jtk@group.calendar.google.com',
  'Wixom': 'gangerdermatology.com_fsdmtevbhp32gmletbpb000q20@group.calendar.google.com',
  'Plymouth': 'gangerdermatology.com_3cc4gomltg8f4kh9mc2o10gi6o@group.calendar.google.com'
};
```

### **Example Calendar Event Format (From User):**
```
Title: Cartessa Aesthetics - Payton Micthell - Pharma Lunch Ann Arbor
Time: Tuesday, June 10 ⋅ 12:00 – 12:45pm
Location: 1979 Huron Pkwy, Ann Arbor
Description: Location : 1979 Huron Pkwy, Ann Arbor Lunch with Partners 
Invitee Details 
Name : Payton Micthell 
Company : Cartessa Aesthetics 
Email : pmitchell@cartessaaesthetics.com 
Phone : 4084306832 
Timezone : America/New_York 
Organizer Details 
Name : Ganger Dermatology 
Company : Ganger Dermatology 
Timezone : US/Eastern 
Confirmation # : 16613042
```

## YOUR MODIFICATION RESPONSIBILITIES:

### **1. INTERNAL CONFIGURATION SYSTEM (HIGH PRIORITY)**

**Admin Config Interface Backend:**
```sql
-- Add configuration table for lunch availability settings
CREATE TABLE lunch_availability_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_name TEXT NOT NULL, -- 'Ann Arbor', 'Wixom', 'Plymouth'
  google_calendar_id TEXT NOT NULL,
  
  -- Weekly availability settings
  available_days INTEGER[] NOT NULL, -- [1,2,3,4,5] for Mon-Fri
  start_time TIME NOT NULL, -- e.g., '12:00:00'
  end_time TIME NOT NULL, -- e.g., '12:45:00'
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  
  -- Booking window settings
  booking_window_weeks INTEGER NOT NULL DEFAULT 12, -- How far in advance
  min_advance_hours INTEGER DEFAULT 24, -- Minimum booking notice
  
  -- Location details
  location_address TEXT NOT NULL,
  special_instructions TEXT,
  max_attendees INTEGER DEFAULT 15,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(location_name)
);

-- Insert default configurations
INSERT INTO lunch_availability_config 
(location_name, google_calendar_id, available_days, start_time, end_time, duration_minutes, booking_window_weeks, location_address)
VALUES 
('Ann Arbor', 'gangerdermatology.com_b4jajesjfje9qfko0gn3kp9jtk@group.calendar.google.com', 
 '{1,2,3,4,5}', '12:00:00', '12:45:00', 45, 12, '1979 Huron Pkwy, Ann Arbor'),
('Wixom', 'gangerdermatology.com_fsdmtevbhp32gmletbpb000q20@group.calendar.google.com', 
 '{1,2,3,4,5}', '12:00:00', '12:45:00', 45, 12, 'Wixom Office Address'),
('Plymouth', 'gangerdermatology.com_3cc4gomltg8f4kh9mc2o10gi6o@group.calendar.google.com', 
 '{1,2,3,4,5}', '12:00:00', '12:45:00', 45, 12, 'Plymouth Office Address');
```

**Config Management API:**
```typescript
// API endpoints for lunch availability configuration
interface LunchConfigAPI {
  // Admin-only endpoints for managers/superadmin
  GET    /api/admin/lunch-config          // Get all location configs
  GET    /api/admin/lunch-config/[location] // Get specific location config
  PUT    /api/admin/lunch-config/[location] // Update location config
  POST   /api/admin/lunch-config/test     // Test calendar connectivity
  
  // Public endpoints for pharma reps
  GET    /api/public/locations            // Get available locations
  GET    /api/public/availability/[location] // Get available time slots
}
```

### **2. GOOGLE CALENDAR INTEGRATION SERVICE (HIGH PRIORITY)**

**Calendar Service Implementation:**
```typescript
// Google Calendar integration service
import { GoogleCalendarService } from '@ganger/integrations/google';

class PharmaLunchCalendarService {
  private calendarService: GoogleCalendarService;
  
  constructor() {
    this.calendarService = new GoogleCalendarService({
      credentials: process.env.GOOGLE_CALENDAR_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
  }

  async getAvailableSlots(location: string, startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    // Get configuration for location
    const config = await this.getLunchConfig(location);
    
    // Get busy times from Google Calendar
    const busyTimes = await this.calendarService.freebusy.query({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: config.google_calendar_id }]
    });
    
    // Generate available slots based on config and busy times
    return this.calculateAvailableSlots(config, busyTimes.data.calendars[config.google_calendar_id].busy);
  }

  async createLunchAppointment(appointment: PharmaAppointment): Promise<string> {
    const config = await this.getLunchConfig(appointment.location);
    
    // Create calendar event with specific format from user example
    const event = {
      summary: `${appointment.company_name} - ${appointment.rep_name} - Pharma Lunch ${appointment.location}`,
      start: {
        dateTime: `${appointment.appointment_date}T${appointment.start_time}`,
        timeZone: 'America/Detroit'
      },
      end: {
        dateTime: `${appointment.appointment_date}T${appointment.end_time}`,
        timeZone: 'America/Detroit'
      },
      location: config.location_address,
      description: this.buildEventDescription(appointment),
      status: 'confirmed',
      visibility: 'private' // Mark as busy
    };

    const result = await this.calendarService.events.insert({
      calendarId: config.google_calendar_id,
      resource: event
    });

    return result.data.id;
  }

  private buildEventDescription(appointment: PharmaAppointment): string {
    return `Location : ${appointment.location_address} Lunch with Partners 
Invitee Details 
Name : ${appointment.rep_name} 
Company : ${appointment.company_name} 
Email : ${appointment.rep_email} 
Phone : ${appointment.rep_phone} 
Timezone : America/New_York 
Organizer Details 
Name : Ganger Dermatology 
Company : Ganger Dermatology 
Timezone : US/Eastern 
Confirmation # : ${appointment.confirmation_number}`;
  }

  private async getLunchConfig(location: string): Promise<LunchConfig> {
    const { data, error } = await supabase
      .from('lunch_availability_config')
      .select('*')
      .eq('location_name', location)
      .eq('is_active', true)
      .single();
    
    if (error) throw new Error(`Configuration not found for location: ${location}`);
    return data;
  }

  private calculateAvailableSlots(config: LunchConfig, busyTimes: any[]): TimeSlot[] {
    // Calculate available time slots based on:
    // 1. Config available_days and times
    // 2. Existing busy times from calendar
    // 3. Booking window weeks limit
    // 4. Minimum advance hours requirement
    
    const slots: TimeSlot[] = [];
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (config.booking_window_weeks * 7));
    
    for (let date = new Date(now); date <= maxDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Sunday = 7
      
      if (config.available_days.includes(dayOfWeek)) {
        const slotDateTime = new Date(date);
        const [hours, minutes] = config.start_time.split(':');
        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Check minimum advance notice
        const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilSlot < config.min_advance_hours) continue;
        
        // Check if slot conflicts with busy times
        const slotEnd = new Date(slotDateTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + config.duration_minutes);
        
        const hasConflict = busyTimes.some(busy => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return (slotDateTime < busyEnd && slotEnd > busyStart);
        });
        
        if (!hasConflict) {
          slots.push({
            date: slotDateTime.toISOString().split('T')[0],
            startTime: config.start_time,
            endTime: config.end_time,
            available: true
          });
        }
      }
    }
    
    return slots;
  }
}
```

### **3. PUBLIC BOOKING FLOW BACKEND (HIGH PRIORITY)**

**Public Booking API Implementation:**
```typescript
// Public booking endpoints for pharma reps
class PublicBookingController {
  
  async getLocations(req: Request, res: Response): Promise<void> {
    // Get all active locations with basic info
    const { data: locations } = await supabase
      .from('lunch_availability_config')
      .select('location_name, location_address, duration_minutes, booking_window_weeks')
      .eq('is_active', true)
      .order('location_name');
    
    res.json({ locations });
  }

  async getAvailability(req: Request, res: Response): Promise<void> {
    const { location } = req.params;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84); // 12 weeks default
    
    try {
      const calendarService = new PharmaLunchCalendarService();
      const availableSlots = await calendarService.getAvailableSlots(location, startDate, endDate);
      
      res.json({ 
        location,
        available_slots: availableSlots,
        booking_instructions: `Select an available time slot for your lunch presentation in ${location}`
      });
    } catch (error) {
      res.status(500).json({ error: 'Unable to fetch availability' });
    }
  }

  async submitBooking(req: Request, res: Response): Promise<void> {
    const bookingData = req.body;
    
    try {
      // Validate booking request
      await this.validateBookingRequest(bookingData);
      
      // Create appointment record
      const { data: appointment } = await supabase
        .from('pharma_appointments')
        .insert({
          rep_name: bookingData.rep_name,
          company_name: bookingData.company_name,
          rep_email: bookingData.rep_email,
          rep_phone: bookingData.rep_phone,
          location: bookingData.location,
          appointment_date: bookingData.appointment_date,
          start_time: bookingData.start_time,
          end_time: bookingData.end_time,
          special_requests: bookingData.special_requests,
          status: 'pending_approval',
          confirmation_number: this.generateConfirmationNumber()
        })
        .select()
        .single();

      // Create Google Calendar event
      const calendarService = new PharmaLunchCalendarService();
      const calendarEventId = await calendarService.createLunchAppointment(appointment);
      
      // Update appointment with calendar event ID
      await supabase
        .from('pharma_appointments')
        .update({ google_calendar_event_id: calendarEventId })
        .eq('id', appointment.id);

      // Send confirmation email
      await this.sendBookingConfirmation(appointment);
      
      res.json({ 
        success: true,
        confirmation_number: appointment.confirmation_number,
        message: 'Your lunch appointment has been requested and is pending approval.'
      });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private generateConfirmationNumber(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  private async validateBookingRequest(data: any): Promise<void> {
    // Validate required fields
    const required = ['rep_name', 'company_name', 'rep_email', 'location', 'appointment_date', 'start_time'];
    for (const field of required) {
      if (!data[field]) throw new Error(`Missing required field: ${field}`);
    }

    // Check if slot is still available
    const calendarService = new PharmaLunchCalendarService();
    const slotDate = new Date(data.appointment_date);
    const daySlots = await calendarService.getAvailableSlots(
      data.location, 
      slotDate, 
      new Date(slotDate.getTime() + 24 * 60 * 60 * 1000)
    );
    
    const isSlotAvailable = daySlots.some(slot => 
      slot.date === data.appointment_date && slot.startTime === data.start_time
    );
    
    if (!isSlotAvailable) {
      throw new Error('Selected time slot is no longer available');
    }
  }
}
```

### **4. ADMIN CONFIGURATION ENDPOINTS (MEDIUM PRIORITY)**

**Admin Config API:**
```typescript
// Admin endpoints for managing lunch availability
class AdminLunchConfigController {
  
  @requireRole(['manager', 'superadmin'])
  async getLunchConfigs(req: Request, res: Response): Promise<void> {
    const { data: configs } = await supabase
      .from('lunch_availability_config')
      .select('*')
      .order('location_name');
    
    res.json({ configs });
  }

  @requireRole(['manager', 'superadmin'])
  async updateLunchConfig(req: Request, res: Response): Promise<void> {
    const { location } = req.params;
    const updateData = req.body;
    
    const { data, error } = await supabase
      .from('lunch_availability_config')
      .update({
        ...updateData,
        last_updated_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('location_name', location)
      .select()
      .single();
    
    if (error) {
      res.status(400).json({ error: error.message });
    } else {
      res.json({ success: true, config: data });
    }
  }

  @requireRole(['manager', 'superadmin'])
  async testCalendarConnection(req: Request, res: Response): Promise<void> {
    const { location } = req.body;
    
    try {
      const calendarService = new PharmaLunchCalendarService();
      const testDate = new Date();
      const slots = await calendarService.getAvailableSlots(location, testDate, testDate);
      
      res.json({ 
        success: true, 
        message: 'Calendar connection successful',
        test_slots_found: slots.length 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Calendar connection failed: ' + error.message 
      });
    }
  }
}
```

## INTEGRATION REQUIREMENTS:

### **Google Calendar API Setup:**
```typescript
// Environment variables needed
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALENDAR_REFRESH_TOKEN=your_refresh_token
GOOGLE_CALENDAR_REDIRECT_URI=your_redirect_uri

// Service account for calendar access (preferred)
GOOGLE_SERVICE_ACCOUNT_EMAIL=calendar-service@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### **Calendar Permissions Required:**
- Read/write access to the 3 specific lunch calendars
- Service account must be added as editor to each calendar
- Proper OAuth scopes: `https://www.googleapis.com/auth/calendar`

## PERFORMANCE TARGETS:
- < 2 seconds for availability calendar loading
- < 1 second for booking submission
- < 500ms for configuration updates
- Real-time calendar sync within 30 seconds
- 99.9% calendar API reliability

## QUALITY GATES:
- All calendar operations must handle API failures gracefully
- Booking confirmations must be reliable
- Configuration changes must be audited
- Time zone handling must be accurate (America/Detroit)
- Integration with existing pharmaceutical rep system

## SUCCESS CRITERIA:
- Google Calendar integration working for all 3 locations
- Admin configuration system operational
- Public booking flow functional
- Calendar events created in exact format specified
- Availability calculation accurate and real-time
- Ready for frontend booking interface development

This modification integrates the pharmaceutical scheduling system with Google Calendar for seamless lunch appointment management across all three practice locations.

INTEGRATE THE GOOGLE CALENDAR LUNCH SCHEDULING SYSTEM! 📅🏥🚀