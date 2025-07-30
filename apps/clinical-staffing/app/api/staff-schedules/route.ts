/**
 * Staff Schedules API Route
 * Clinical Staffing App - Migration-Aware Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrationAdapter, MigrationHelpers } from '@ganger/db';
import { withStandardErrorHandling, respondWithSuccess, respondWithError } from '@ganger/utils';
import { withAuth } from '@ganger/auth/middleware';

// Configure migration adapter for new schema
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

/**
 * GET /api/staff-schedules
 * Retrieve staff schedules with optional filtering
 */
export async function GET(request: NextRequest) {
  return withAuth(async (request, { user }) => {
      const { searchParams } = new URL(request.url);
      const date = searchParams.get('date');
      const locationId = searchParams.get('locationId');
      const staffMemberId = searchParams.get('staffMemberId');
      const status = searchParams.get('status');

      if (!date) {
        return respondWithError('Date parameter is required', 400);
      }

      // Build filters for migration-aware query
      const filters: Record<string, any> = {
        schedule_date: date
      };

      if (locationId) filters.location_id = locationId;
      if (staffMemberId) filters.staff_member_id = staffMemberId;
      if (status) {
        // Convert status using migration helper if needed
        filters.status = MigrationHelpers.convertScheduleStatus(status);
      }

      // Query using migration adapter
      const schedules = await migrationAdapter.select(
        'staff_schedules',
        `
          *,
          staff_member:staff_members!inner(
            id, first_name, last_name, email, role, 
            employee_status, certifications, skills
          ),
          location:locations!inner(
            id, name, address, timezone
          )
        `,
        filters,
        {
          orderBy: 'start_time',
          limit: 100
        }
      );

      // Transform data for consistent API response
      const transformedSchedules = schedules.map(schedule => ({
        id: schedule.id,
        staff_member_id: schedule.staff_member_id,
        location_id: schedule.location_id,
        schedule_date: schedule.schedule_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status,
        role: schedule.role || schedule.staff_member?.role,
        notes: schedule.notes,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at,
        
        // Populated relationships
        staff_member: schedule.staff_member ? {
          id: schedule.staff_member.id,
          name: `${schedule.staff_member.first_name} ${schedule.staff_member.last_name}`,
          email: schedule.staff_member.email,
          role: schedule.staff_member.role,
          employee_status: schedule.staff_member.employee_status,
          certifications: schedule.staff_member.certifications || [],
          skills: schedule.staff_member.skills || []
        } : undefined,
        
        location: schedule.location ? {
          id: schedule.location.id,
          name: schedule.location.name,
          address: schedule.location.address,
          timezone: schedule.location.timezone
        } : undefined
      }));

      return respondWithSuccess(transformedSchedules);
    });
}

/**
 * POST /api/staff-schedules
 * Create new staff schedule
 */
export async function POST(request: NextRequest) {
  return withAuth(async (request, { user }) => {
      const body = await request.json();
      
      // Validate required fields
      const required = ['staff_member_id', 'location_id', 'schedule_date', 'start_time', 'end_time'];
      for (const field of required) {
        if (!body[field]) {
          return respondWithError(`${field} is required`, 400);
        }
      }

      // Check for schedule conflicts using migration adapter
      const existingSchedules = await migrationAdapter.select(
        'staff_schedules',
        '*',
        {
          staff_member_id: body.staff_member_id,
          schedule_date: body.schedule_date,
          status: ['scheduled', 'confirmed', 'in_progress']
        }
      );

      // Check for time conflicts
      const hasConflict = existingSchedules.some(schedule => {
        const existingStart = new Date(`2000-01-01T${schedule.start_time}`);
        const existingEnd = new Date(`2000-01-01T${schedule.end_time}`);
        const newStart = new Date(`2000-01-01T${body.start_time}`);
        const newEnd = new Date(`2000-01-01T${body.end_time}`);
        
        return (newStart < existingEnd && newEnd > existingStart);
      });

      if (hasConflict) {
        return respondWithError('Schedule conflicts with existing assignment', 409);
      }

      // Convert status if needed for migration compatibility
      const scheduleData = {
        ...body,
        status: MigrationHelpers.convertScheduleStatus(body.status || 'scheduled'),
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create schedule using migration adapter
      const [newSchedule] = await migrationAdapter.insert('staff_schedules', scheduleData);

      return respondWithSuccess(newSchedule, 201);
    });
}

/**
 * PUT /api/staff-schedules/[id]
 * Update existing staff schedule
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (request, { user }) => {
      const { pathname } = new URL(request.url);
      const scheduleId = pathname.split('/').pop();
      
      if (!scheduleId) {
        return respondWithError('Schedule ID is required', 400);
      }

      const body = await request.json();
      
      // Check if schedule exists
      const existingSchedules = await migrationAdapter.select(
        'staff_schedules',
        '*',
        { id: scheduleId }
      );

      if (existingSchedules.length === 0) {
        return respondWithError('Schedule not found', 404);
      }

      // Convert status if provided
      const updateData = {
        ...body,
        updated_at: new Date().toISOString(),
        last_modified_by: user.id
      };

      if (body.status) {
        updateData.status = MigrationHelpers.convertScheduleStatus(body.status);
      }

      // Update schedule using migration adapter
      const updatedSchedules = await migrationAdapter.update(
        'staff_schedules',
        updateData,
        { id: scheduleId }
      );

      if (updatedSchedules.length === 0) {
        return respondWithError('Failed to update schedule', 500);
      }

      return respondWithSuccess(updatedSchedules[0]);
    });
}

/**
 * DELETE /api/staff-schedules/[id]
 * Delete staff schedule
 */
export async function DELETE(request: NextRequest) {
  return withAuth(async (request, { user }) => {
      const { pathname } = new URL(request.url);
      const scheduleId = pathname.split('/').pop();
      
      if (!scheduleId) {
        return respondWithError('Schedule ID is required', 400);
      }

      // Check if schedule exists
      const existingSchedules = await migrationAdapter.select(
        'staff_schedules',
        '*',
        { id: scheduleId }
      );

      if (existingSchedules.length === 0) {
        return respondWithError('Schedule not found', 404);
      }

      // Soft delete by updating status to cancelled
      await migrationAdapter.update(
        'staff_schedules',
        { 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
          last_modified_by: user.id
        },
        { id: scheduleId }
      );

      return respondWithSuccess({ message: 'Schedule deleted successfully' });
    });
}