# 🏥 Clinical Support Staffing Optimization - Backend Development PRD
*Server-side API and Database Implementation for Ganger Platform*

## 📋 Document Information
- **Application Name**: Clinical Support Staffing Optimization System (Backend)
- **Terminal Assignment**: TERMINAL 2 - BACKEND
- **Priority**: Medium
- **Development Timeline**: 4-5 weeks
- **Dependencies**: @ganger/db, @ganger/auth/server, @ganger/integrations/server, @ganger/utils/server
- **Integration Requirements**: ModMed FHIR API, Deputy API, Zenefits API

---

## 🎯 Backend Scope

### **Terminal 2 Responsibilities**
- Database schema and migrations
- API route implementations
- External service integrations (ModMed, Deputy, Zenefits)
- Server-side authentication and authorization
- AI optimization algorithms
- Background processing and scheduling
- Data validation and business logic

### **Excluded from Backend Terminal**
- React components and UI (Terminal 1)
- Client-side state management (Terminal 1)
- Frontend form handling (Terminal 1)
- Drag & drop interfaces (Terminal 1)

---

## 🏗️ Backend Technology Stack

### **Required Server-Side Packages**
```typescript
// Server-only imports
import { withAuth, getUserFromToken, verifyPermissions } from '@ganger/auth/server';
import { db, DatabaseService } from '@ganger/db';
import { 
  ModMedClient, DeputyClient, ZenefitsClient,
  ServerCommunicationService, ServerCacheService 
} from '@ganger/integrations/server';
import { auditLog, validateStaffingData } from '@ganger/utils/server';
import type { 
  User, Provider, Location, StaffMember, StaffSchedule,
  StaffingOptimizationRule, StaffingAnalytics
} from '@ganger/types';
```

### **Backend-Specific Technology**
- **ModMed FHIR**: Provider schedule sync and appointment data
- **Deputy API**: Staff availability and time tracking
- **Zenefits API**: Employee status and HR data
- **AI Optimization**: Intelligent staffing recommendation engine
- **Background Jobs**: Automated sync and optimization tasks
- **Caching Layer**: Redis for performance optimization

---

## 🗄️ Database Implementation

### **Migration Files**
```sql
-- Migration: 2025_01_11_create_clinical_staffing_tables.sql

-- Staff members table
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_type TEXT NOT NULL CHECK (role_type IN ('medical_assistant', 'scribe', 'nurse', 'technician')),
  primary_location_id UUID REFERENCES locations(id),
  secondary_locations UUID[] REFERENCES locations(id),
  skill_level TEXT DEFAULT 'intermediate' CHECK (skill_level IN ('junior', 'intermediate', 'senior', 'specialist')),
  certifications TEXT[],
  max_hours_per_week INTEGER DEFAULT 40,
  preferred_schedule_type TEXT CHECK (preferred_schedule_type IN ('full_time', 'part_time', 'per_diem', 'flexible')),
  hire_date DATE,
  employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
  deputy_user_id TEXT,
  zenefits_employee_id TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Physician support requirements
CREATE TABLE physician_support_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  appointment_type TEXT,
  required_medical_assistants INTEGER DEFAULT 1,
  required_scribes INTEGER DEFAULT 0,
  required_skill_level TEXT DEFAULT 'intermediate' CHECK (required_skill_level IN ('junior', 'intermediate', 'senior', 'specialist')),
  special_requirements TEXT[],
  buffer_time_minutes INTEGER DEFAULT 15,
  notes TEXT,
  effective_start_date DATE,
  effective_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(provider_id, location_id, appointment_type)
);

-- Staff schedules
CREATE TABLE staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id),
  schedule_date DATE NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  break_start_time TIME,
  break_end_time TIME,
  assigned_providers TEXT[],
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('regular', 'overtime', 'on_call', 'substitute', 'training')),
  assignment_method TEXT DEFAULT 'manual' CHECK (assignment_method IN ('manual', 'ai_suggested', 'auto_optimized')),
  coverage_priority INTEGER DEFAULT 50 CHECK (coverage_priority BETWEEN 1 AND 100),
  special_assignments TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  deputy_schedule_id TEXT,
  last_modified_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(staff_member_id, schedule_date, shift_start_time)
);

-- Provider schedules cache
CREATE TABLE provider_schedules_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  appointment_type TEXT,
  patient_count INTEGER DEFAULT 0,
  estimated_support_need DECIMAL(3,1),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  modmed_appointment_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, schedule_date, start_time, location_id)
);

-- Staff availability
CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  available_start_time TIME NOT NULL,
  available_end_time TIME NOT NULL,
  location_preferences UUID[] REFERENCES locations(id),
  unavailable_dates DATE[],
  preferred_providers TEXT[],
  max_consecutive_days INTEGER DEFAULT 5,
  min_hours_between_shifts INTEGER DEFAULT 12,
  overtime_willing BOOLEAN DEFAULT FALSE,
  cross_location_willing BOOLEAN DEFAULT FALSE,
  notes TEXT,
  deputy_availability_id TEXT,
  last_updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staffing optimization rules
CREATE TABLE staffing_optimization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('ratio_requirement', 'skill_matching', 'location_preference', 'workload_balance')),
  location_id UUID REFERENCES locations(id),
  provider_id TEXT,
  rule_parameters JSONB NOT NULL,
  priority_weight INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  enforcement_level TEXT DEFAULT 'warning' CHECK (enforcement_level IN ('strict', 'warning', 'suggestion')),
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staffing analytics
CREATE TABLE staffing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analytics_date DATE NOT NULL,
  location_id UUID REFERENCES locations(id),
  total_provider_hours DECIMAL(6,2),
  total_support_hours DECIMAL(6,2),
  optimal_support_hours DECIMAL(6,2),
  coverage_percentage DECIMAL(5,2),
  understaffed_periods INTEGER DEFAULT 0,
  overstaffed_periods INTEGER DEFAULT 0,
  cross_location_assignments INTEGER DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  staff_utilization_rate DECIMAL(5,2),
  patient_satisfaction_impact DECIMAL(3,2),
  cost_efficiency_score DECIMAL(5,2),
  optimization_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(analytics_date, location_id)
);

-- Performance indexes
CREATE INDEX idx_staff_members_location ON staff_members(primary_location_id);
CREATE INDEX idx_staff_members_role ON staff_members(role_type);
CREATE INDEX idx_staff_members_status ON staff_members(employment_status);
CREATE INDEX idx_staff_schedules_date ON staff_schedules(schedule_date);
CREATE INDEX idx_staff_schedules_staff ON staff_schedules(staff_member_id, schedule_date);
CREATE INDEX idx_staff_schedules_location ON staff_schedules(location_id, schedule_date);
CREATE INDEX idx_provider_schedules_date ON provider_schedules_cache(schedule_date);
CREATE INDEX idx_provider_schedules_provider ON provider_schedules_cache(provider_id, schedule_date);
CREATE INDEX idx_staff_availability_member ON staff_availability(staff_member_id);
CREATE INDEX idx_staff_availability_dates ON staff_availability(date_range_start, date_range_end);
CREATE INDEX idx_staffing_analytics_date ON staffing_analytics(analytics_date);

-- Row Level Security policies
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE physician_support_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_schedules_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_optimization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_analytics ENABLE ROW LEVEL SECURITY;

-- Location-based access policies
CREATE POLICY "Staff can view own schedules and profiles" ON staff_schedules
  FOR SELECT USING (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );

CREATE POLICY "Managers can manage all staffing data" ON staff_schedules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler'));

CREATE POLICY "Staff can view own availability" ON staff_availability
  FOR SELECT USING (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );

CREATE POLICY "Staff can update own availability" ON staff_availability
  FOR UPDATE USING (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );
```

---

## 🔌 API Route Implementation

### **Staff Schedule Management**
```typescript
// pages/api/staff-schedules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@ganger/auth/server';
import { db } from '@ganger/db';
import { auditLog } from '@ganger/utils/server';

export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const locationId = searchParams.get('locationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    // Verify permissions
    if (!verifyPermissions(user, ['read_staff_schedules'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Build query with filters
    let query = db.staff_schedules.findMany({
      include: {
        staff_member: true,
        location: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { schedule_date: 'asc' },
        { shift_start_time: 'asc' }
      ]
    });

    // Apply filters
    const where: any = {};
    if (date) {
      where.schedule_date = new Date(date);
    }
    if (locationId) {
      where.location_id = locationId;
    }

    // Apply user-based access control
    if (user.role === 'staff') {
      where.staff_member = {
        user_id: user.id
      };
    }

    query = query.where(where);

    const [schedules, total] = await Promise.all([
      query,
      db.staff_schedules.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: schedules,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Staff schedules fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin', 'scheduler'] });

export const POST = withAuth(async (request: NextRequest, user: User) => {
  try {
    const data = await request.json();

    // Verify permissions
    if (!verifyPermissions(user, ['write_staff_schedules'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate schedule data
    const validation = await validateStaffingData(data, 'staff_schedule');
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const conflicts = await checkSchedulingConflicts(data);
    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Scheduling conflicts detected', conflicts },
        { status: 409 }
      );
    }

    // Create schedule
    const schedule = await db.staff_schedules.create({
      data: {
        ...data,
        last_modified_by: user.id,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        staff_member: true,
        location: true
      }
    });

    // Audit logging
    await auditLog({
      action: 'staff_schedule_created',
      userId: user.id,
      resourceType: 'staff_schedule',
      resourceId: schedule.id,
      metadata: {
        schedule_date: schedule.schedule_date,
        staff_member_id: schedule.staff_member_id,
        location_id: schedule.location_id
      }
    });

    // Sync to Deputy if enabled
    if (process.env.DEPUTY_SYNC_ENABLED === 'true') {
      await syncScheduleToDeputy(schedule);
    }

    return NextResponse.json({
      success: true,
      data: schedule
    }, { status: 201 });
  } catch (error) {
    console.error('Schedule creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['manager', 'superadmin', 'scheduler'] });
```

### **Schedule Optimization Engine**
```typescript
// pages/api/staffing/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@ganger/auth/server';
import { StaffingOptimizationEngine } from '@ganger/integrations/server';

export const POST = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { date, locationId, optimizationType } = await request.json();

    // Verify permissions
    if (!verifyPermissions(user, ['optimize_staffing'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const optimizationEngine = new StaffingOptimizationEngine();

    // Get current schedules and requirements
    const [providerSchedules, staffAvailability, currentSchedules, optimizationRules] = await Promise.all([
      getProviderSchedules(date, locationId),
      getStaffAvailability(date, locationId),
      getCurrentStaffSchedules(date, locationId),
      getOptimizationRules(locationId)
    ]);

    // Run optimization algorithm
    const optimization = await optimizationEngine.optimize({
      date,
      locationId,
      providerSchedules,
      staffAvailability,
      currentSchedules,
      optimizationRules,
      optimizationType
    });

    // Calculate improvement metrics
    const metrics = await calculateOptimizationMetrics(
      currentSchedules,
      optimization.suggestedSchedules
    );

    return NextResponse.json({
      success: true,
      data: {
        optimization,
        metrics,
        confidence: optimization.confidence,
        warnings: optimization.warnings
      }
    });
  } catch (error) {
    console.error('Optimization error:', error);
    return NextResponse.json(
      { error: 'Optimization failed' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['manager', 'superadmin'] });

async function getProviderSchedules(date: string, locationId?: string) {
  return db.provider_schedules_cache.findMany({
    where: {
      schedule_date: new Date(date),
      ...(locationId && { location_id: locationId })
    },
    orderBy: { start_time: 'asc' }
  });
}

async function getStaffAvailability(date: string, locationId?: string) {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();

  return db.staff_availability.findMany({
    where: {
      date_range_start: { lte: targetDate },
      date_range_end: { gte: targetDate },
      days_of_week: { has: dayOfWeek },
      ...(locationId && {
        OR: [
          { location_preferences: { has: locationId } },
          { location_preferences: { isEmpty: true } }
        ]
      })
    },
    include: {
      staff_member: {
        include: {
          location: true
        }
      }
    }
  });
}

class StaffingOptimizationEngine {
  async optimize(params: OptimizationParams): Promise<OptimizationResult> {
    const {
      date,
      locationId,
      providerSchedules,
      staffAvailability,
      currentSchedules,
      optimizationRules
    } = params;

    // Initialize optimization context
    const context = new OptimizationContext(params);

    // Apply optimization algorithms
    const suggestions = [];

    // 1. Coverage gap analysis
    const coverageGaps = await this.identifyCoverageGaps(context);
    suggestions.push(...await this.generateCoverageSuggestions(coverageGaps, context));

    // 2. Skill matching optimization
    const skillMismatches = await this.identifySkillMismatches(context);
    suggestions.push(...await this.generateSkillMatchSuggestions(skillMismatches, context));

    // 3. Location preference optimization
    const locationOptimizations = await this.optimizeLocationAssignments(context);
    suggestions.push(...locationOptimizations);

    // 4. Workload balance optimization
    const workloadOptimizations = await this.optimizeWorkloadBalance(context);
    suggestions.push(...workloadOptimizations);

    // Score and rank suggestions
    const rankedSuggestions = await this.rankSuggestions(suggestions, optimizationRules);

    // Calculate confidence score
    const confidence = await this.calculateConfidence(rankedSuggestions, context);

    return {
      suggestedSchedules: rankedSuggestions,
      confidence,
      warnings: context.warnings,
      metrics: context.metrics
    };
  }

  private async identifyCoverageGaps(context: OptimizationContext): Promise<CoverageGap[]> {
    const gaps: CoverageGap[] = [];

    for (const providerSchedule of context.providerSchedules) {
      const requiredSupport = await this.getRequiredSupport(providerSchedule);
      const currentSupport = await this.getCurrentSupport(providerSchedule, context.currentSchedules);

      if (currentSupport.medical_assistants < requiredSupport.medical_assistants) {
        gaps.push({
          type: 'medical_assistant_shortage',
          provider_id: providerSchedule.provider_id,
          location_id: providerSchedule.location_id,
          time_start: providerSchedule.start_time,
          time_end: providerSchedule.end_time,
          shortage: requiredSupport.medical_assistants - currentSupport.medical_assistants,
          priority: this.calculateGapPriority(providerSchedule, requiredSupport)
        });
      }

      if (currentSupport.scribes < requiredSupport.scribes) {
        gaps.push({
          type: 'scribe_shortage',
          provider_id: providerSchedule.provider_id,
          location_id: providerSchedule.location_id,
          time_start: providerSchedule.start_time,
          time_end: providerSchedule.end_time,
          shortage: requiredSupport.scribes - currentSupport.scribes,
          priority: this.calculateGapPriority(providerSchedule, requiredSupport)
        });
      }
    }

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  private async generateCoverageSuggestions(
    gaps: CoverageGap[],
    context: OptimizationContext
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    for (const gap of gaps) {
      const availableStaff = context.staffAvailability.filter(availability => {
        const staff = availability.staff_member;
        
        // Check role type matches gap
        if (gap.type === 'medical_assistant_shortage' && staff.role_type !== 'medical_assistant') {
          return false;
        }
        if (gap.type === 'scribe_shortage' && staff.role_type !== 'scribe') {
          return false;
        }

        // Check availability time overlap
        if (availability.available_start_time > gap.time_start ||
            availability.available_end_time < gap.time_end) {
          return false;
        }

        // Check location preference
        if (availability.location_preferences.length > 0 &&
            !availability.location_preferences.includes(gap.location_id)) {
          return false;
        }

        // Check existing schedule conflicts
        const hasConflict = context.currentSchedules.some(schedule =>
          schedule.staff_member_id === staff.id &&
          this.timeOverlaps(
            schedule.shift_start_time,
            schedule.shift_end_time,
            gap.time_start,
            gap.time_end
          )
        );

        return !hasConflict;
      });

      // Generate suggestions for each available staff member
      for (const staffAvailability of availableStaff.slice(0, gap.shortage)) {
        suggestions.push({
          type: 'assign_staff',
          staff_member_id: staffAvailability.staff_member.id,
          provider_id: gap.provider_id,
          location_id: gap.location_id,
          shift_start_time: gap.time_start,
          shift_end_time: gap.time_end,
          assignment_method: 'ai_suggested',
          confidence: this.calculateAssignmentConfidence(staffAvailability, gap),
          benefits: this.calculateAssignmentBenefits(staffAvailability, gap),
          tradeoffs: this.calculateAssignmentTradeoffs(staffAvailability, gap)
        });
      }
    }

    return suggestions;
  }
}
```

### **External Service Integration**
```typescript
// packages/integrations/server/modmed-client.ts
import { ModMedFHIRClient } from './fhir-client';

export class ModMedClient {
  private fhirClient: ModMedFHIRClient;

  constructor() {
    this.fhirClient = new ModMedFHIRClient({
      baseUrl: process.env.MODMED_FHIR_URL,
      clientId: process.env.MODMED_CLIENT_ID,
      clientSecret: process.env.MODMED_CLIENT_SECRET
    });
  }

  async syncProviderSchedules(date: Date, locationId?: string): Promise<ProviderSchedule[]> {
    try {
      // Get provider list
      const providers = await this.fhirClient.getProviders(locationId);

      const schedules: ProviderSchedule[] = [];

      for (const provider of providers) {
        // Get appointments for provider on date
        const appointments = await this.fhirClient.getAppointments({
          practitioner: provider.id,
          date: date.toISOString().split('T')[0],
          status: ['booked', 'arrived', 'fulfilled']
        });

        // Process appointments into schedule blocks
        const schedule = this.processAppointmentsToSchedule(provider, appointments);
        schedules.push(...schedule);
      }

      // Cache schedules in database
      await this.cacheProviderSchedules(schedules);

      return schedules;
    } catch (error) {
      console.error('ModMed sync error:', error);
      throw new Error(`Failed to sync provider schedules: ${error.message}`);
    }
  }

  private processAppointmentsToSchedule(
    provider: Provider,
    appointments: Appointment[]
  ): ProviderSchedule[] {
    // Group appointments by time blocks
    const timeBlocks = this.groupAppointmentsByTimeBlocks(appointments);

    return timeBlocks.map(block => ({
      provider_id: provider.id,
      provider_name: provider.name,
      schedule_date: new Date(block.date),
      location_id: this.mapModMedLocationToGanger(block.location),
      start_time: block.start_time,
      end_time: block.end_time,
      appointment_type: block.type,
      patient_count: block.appointments.length,
      estimated_support_need: this.calculateSupportNeed(block),
      modmed_appointment_ids: block.appointments.map(a => a.id),
      last_synced_at: new Date()
    }));
  }

  private calculateSupportNeed(timeBlock: TimeBlock): number {
    // AI-based calculation of required support staff hours
    const baseNeed = timeBlock.appointments.length * 0.5; // 30 minutes per appointment
    const complexityMultiplier = this.calculateComplexityMultiplier(timeBlock);
    
    return Math.round((baseNeed * complexityMultiplier) * 10) / 10;
  }

  private async cacheProviderSchedules(schedules: ProviderSchedule[]): Promise<void> {
    // Upsert schedules into cache table
    for (const schedule of schedules) {
      await db.provider_schedules_cache.upsert({
        where: {
          provider_id_schedule_date_start_time_location_id: {
            provider_id: schedule.provider_id,
            schedule_date: schedule.schedule_date,
            start_time: schedule.start_time,
            location_id: schedule.location_id
          }
        },
        update: {
          ...schedule,
          last_synced_at: new Date()
        },
        create: schedule
      });
    }
  }
}

// packages/integrations/server/deputy-client.ts
export class DeputyClient {
  private apiClient: DeputyAPIClient;

  constructor() {
    this.apiClient = new DeputyAPIClient({
      baseUrl: process.env.DEPUTY_API_URL,
      apiKey: process.env.DEPUTY_API_KEY
    });
  }

  async syncStaffAvailability(): Promise<StaffAvailability[]> {
    try {
      // Get all employees from Deputy
      const employees = await this.apiClient.getEmployees({
        active: true
      });

      const availabilityRecords: StaffAvailability[] = [];

      for (const employee of employees) {
        // Get availability for employee
        const availability = await this.apiClient.getEmployeeAvailability(employee.id);

        // Map to our staff availability format
        const staffAvailability = this.mapDeputyAvailability(employee, availability);
        availabilityRecords.push(...staffAvailability);
      }

      // Update database with synced availability
      await this.updateStaffAvailability(availabilityRecords);

      return availabilityRecords;
    } catch (error) {
      console.error('Deputy sync error:', error);
      throw new Error(`Failed to sync staff availability: ${error.message}`);
    }
  }

  async pushSchedulesToDeputy(schedules: StaffSchedule[]): Promise<void> {
    try {
      for (const schedule of schedules) {
        // Create or update Deputy roster entry
        const deputyRoster = {
          Employee: schedule.staff_member.deputy_user_id,
          StartTime: this.formatDeputyDateTime(schedule.schedule_date, schedule.shift_start_time),
          EndTime: this.formatDeputyDateTime(schedule.schedule_date, schedule.shift_end_time),
          Memo: `Provider: ${schedule.assigned_providers.join(', ')}`,
          OperationalUnit: this.mapLocationToDeputyOU(schedule.location_id)
        };

        if (schedule.deputy_schedule_id) {
          // Update existing roster
          await this.apiClient.updateRoster(schedule.deputy_schedule_id, deputyRoster);
        } else {
          // Create new roster
          const response = await this.apiClient.createRoster(deputyRoster);
          
          // Update our schedule with Deputy ID
          await db.staff_schedules.update({
            where: { id: schedule.id },
            data: { deputy_schedule_id: response.Id }
          });
        }
      }
    } catch (error) {
      console.error('Deputy push error:', error);
      throw new Error(`Failed to push schedules to Deputy: ${error.message}`);
    }
  }
}

// packages/integrations/server/zenefits-client.ts
export class ZenefitsClient {
  private apiClient: ZenefitsAPIClient;

  constructor() {
    this.apiClient = new ZenefitsAPIClient({
      baseUrl: process.env.ZENEFITS_API_URL,
      apiKey: process.env.ZENEFITS_API_KEY
    });
  }

  async syncEmployeeStatus(): Promise<void> {
    try {
      // Get all employees from Zenefits
      const employees = await this.apiClient.getEmployees();

      for (const employee of employees) {
        // Get time off information
        const timeOff = await this.apiClient.getTimeOffRequests(employee.id, {
          status: 'approved',
          start_date: new Date().toISOString().split('T')[0]
        });

        // Update staff member status
        await this.updateStaffMemberFromZenefits(employee, timeOff);
      }
    } catch (error) {
      console.error('Zenefits sync error:', error);
      throw new Error(`Failed to sync employee status: ${error.message}`);
    }
  }

  private async updateStaffMemberFromZenefits(
    employee: ZenefitsEmployee,
    timeOff: TimeOffRequest[]
  ): Promise<void> {
    const staffMember = await db.staff_members.findFirst({
      where: { zenefits_employee_id: employee.id }
    });

    if (!staffMember) {
      console.warn(`Staff member not found for Zenefits employee ${employee.id}`);
      return;
    }

    // Update employment status based on Zenefits data
    const employmentStatus = this.mapZenefitsStatus(employee.employment_status);
    
    // Check for active time off
    const hasActiveTimeOff = timeOff.some(to => 
      new Date(to.start_date) <= new Date() && 
      new Date(to.end_date) >= new Date()
    );

    await db.staff_members.update({
      where: { id: staffMember.id },
      data: {
        employment_status: hasActiveTimeOff ? 'on_leave' : employmentStatus,
        last_sync_at: new Date()
      }
    });

    // Update availability if on leave
    if (hasActiveTimeOff) {
      await this.updateAvailabilityForTimeOff(staffMember.id, timeOff);
    }
  }
}
```

---

## 🔄 Background Processing

### **Automated Sync Jobs**
```typescript
// packages/integrations/server/background-jobs.ts
import { CronJob } from 'cron';
import { ModMedClient, DeputyClient, ZenefitsClient } from './index';

export class StaffingBackgroundJobs {
  private modmedClient: ModMedClient;
  private deputyClient: DeputyClient;
  private zenefitsClient: ZenefitsClient;

  constructor() {
    this.modmedClient = new ModMedClient();
    this.deputyClient = new DeputyClient();
    this.zenefitsClient = new ZenefitsClient();
  }

  startJobs(): void {
    // Sync provider schedules every 30 minutes
    new CronJob('0 */30 * * * *', async () => {
      try {
        console.log('Starting ModMed provider schedule sync...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        await this.modmedClient.syncProviderSchedules(tomorrow);
        console.log('ModMed sync completed successfully');
      } catch (error) {
        console.error('ModMed sync failed:', error);
      }
    }, null, true);

    // Sync staff availability from Deputy every hour
    new CronJob('0 0 * * * *', async () => {
      try {
        console.log('Starting Deputy staff availability sync...');
        await this.deputyClient.syncStaffAvailability();
        console.log('Deputy sync completed successfully');
      } catch (error) {
        console.error('Deputy sync failed:', error);
      }
    }, null, true);

    // Sync employee status from Zenefits daily at 6 AM
    new CronJob('0 0 6 * * *', async () => {
      try {
        console.log('Starting Zenefits employee status sync...');
        await this.zenefitsClient.syncEmployeeStatus();
        console.log('Zenefits sync completed successfully');
      } catch (error) {
        console.error('Zenefits sync failed:', error);
      }
    }, null, true);

    // Generate daily analytics at 11 PM
    new CronJob('0 0 23 * * *', async () => {
      try {
        console.log('Generating daily staffing analytics...');
        await this.generateDailyAnalytics();
        console.log('Analytics generation completed');
      } catch (error) {
        console.error('Analytics generation failed:', error);
      }
    }, null, true);

    console.log('Staffing background jobs started successfully');
  }

  private async generateDailyAnalytics(): Promise<void> {
    const today = new Date();
    const locations = await db.locations.findMany({ where: { is_active: true } });

    for (const location of locations) {
      const analytics = await this.calculateDailyAnalytics(today, location.id);
      
      await db.staffing_analytics.upsert({
        where: {
          analytics_date_location_id: {
            analytics_date: today,
            location_id: location.id
          }
        },
        update: analytics,
        create: {
          ...analytics,
          analytics_date: today,
          location_id: location.id
        }
      });
    }
  }

  private async calculateDailyAnalytics(date: Date, locationId: string): Promise<Partial<StaffingAnalytics>> {
    // Get provider schedules for the day
    const providerSchedules = await db.provider_schedules_cache.findMany({
      where: {
        schedule_date: date,
        location_id: locationId
      }
    });

    // Get staff schedules for the day
    const staffSchedules = await db.staff_schedules.findMany({
      where: {
        schedule_date: date,
        location_id: locationId
      },
      include: {
        staff_member: true
      }
    });

    // Calculate metrics
    const totalProviderHours = providerSchedules.reduce((sum, schedule) => {
      const hours = this.calculateHoursBetween(schedule.start_time, schedule.end_time);
      return sum + hours;
    }, 0);

    const totalSupportHours = staffSchedules.reduce((sum, schedule) => {
      const hours = this.calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
      return sum + hours;
    }, 0);

    const optimalSupportHours = providerSchedules.reduce((sum, schedule) => {
      return sum + (schedule.estimated_support_need || 0);
    }, 0);

    const coveragePercentage = optimalSupportHours > 0 
      ? (totalSupportHours / optimalSupportHours) * 100 
      : 100;

    const crossLocationAssignments = staffSchedules.filter(schedule =>
      schedule.staff_member.primary_location_id !== locationId
    ).length;

    const overtimeHours = staffSchedules.reduce((sum, schedule) => {
      const regularHours = 8; // Standard shift
      const actualHours = this.calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
      return sum + Math.max(0, actualHours - regularHours);
    }, 0);

    return {
      total_provider_hours: totalProviderHours,
      total_support_hours: totalSupportHours,
      optimal_support_hours: optimalSupportHours,
      coverage_percentage: Math.round(coveragePercentage * 100) / 100,
      cross_location_assignments: crossLocationAssignments,
      overtime_hours: overtimeHours,
      staff_utilization_rate: this.calculateUtilizationRate(staffSchedules),
      optimization_suggestions: await this.generateOptimizationSuggestions(date, locationId)
    };
  }
}
```

---

## 🧪 Backend Testing

### **API Endpoint Testing**
```typescript
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '../../../pages/api/staff-schedules';

describe('/api/staff-schedules', () => {
  it('requires authentication', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      }
    });
  });

  it('enforces role-based access', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + await getTestToken('staff')
          },
          body: JSON.stringify(scheduleData)
        });
        expect(res.status).toBe(403);
      }
    });
  });

  it('creates schedule successfully', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + await getTestToken('manager')
          },
          body: JSON.stringify(validScheduleData)
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.id).toBeDefined();
      }
    });
  });
});

describe('Optimization Engine', () => {
  it('generates valid optimization suggestions', async () => {
    const engine = new StaffingOptimizationEngine();
    const result = await engine.optimize(testOptimizationParams);
    
    expect(result.suggestedSchedules).toBeInstanceOf(Array);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('respects optimization rules', async () => {
    const engine = new StaffingOptimizationEngine();
    const result = await engine.optimize({
      ...testOptimizationParams,
      optimizationRules: [strictCoverageRule]
    });
    
    // Verify suggestions comply with rules
    result.suggestedSchedules.forEach(schedule => {
      expect(validateScheduleAgainstRules(schedule, [strictCoverageRule])).toBe(true);
    });
  });
});

describe('External Integrations', () => {
  it('syncs ModMed provider schedules', async () => {
    const modmedClient = new ModMedClient();
    const schedules = await modmedClient.syncProviderSchedules(new Date());
    
    expect(schedules).toBeInstanceOf(Array);
    schedules.forEach(schedule => {
      expect(schedule.provider_id).toBeDefined();
      expect(schedule.schedule_date).toBeInstanceOf(Date);
    });
  });

  it('handles Deputy API failures gracefully', async () => {
    const deputyClient = new DeputyClient();
    
    // Mock API failure
    jest.spyOn(deputyClient, 'apiClient').mockImplementation(() => {
      throw new Error('API unavailable');
    });
    
    await expect(deputyClient.syncStaffAvailability()).rejects.toThrow('Failed to sync staff availability');
  });
});
```

---

## 📈 Success Criteria

### **Backend Launch Criteria**
- [ ] Database migrations executed successfully
- [ ] All API endpoints respond with correct status codes
- [ ] ModMed integration syncs provider schedules
- [ ] Deputy integration syncs staff availability
- [ ] Zenefits integration syncs employee status
- [ ] Optimization engine generates valid suggestions
- [ ] Background jobs execute on schedule
- [ ] Row Level Security policies working correctly

### **Backend Success Metrics**
- API response times <500ms for standard queries
- External service sync success rate >95%
- Optimization algorithm accuracy >80%
- Database query performance optimized
- Zero security vulnerabilities in production
- 100% test coverage for critical business logic

---

*This backend PRD provides comprehensive guidance for Terminal 2 to build all server-side functionality for the Clinical Staffing application, with clear separation from Terminal 1's frontend responsibilities.*