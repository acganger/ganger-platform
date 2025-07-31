/**
 * Auto-Assign Staffing API Route
 * Clinical Staffing App - Migration-Aware Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrationAdapter, MigrationHelpers } from '@ganger/db';
import { migrationStaffingBusinessLogic } from '@ganger/utils/server';
import { withStandardErrorHandling } from '@ganger/utils';
import { withAuth } from '@ganger/auth/middleware';

// Configure migration adapters
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

migrationStaffingBusinessLogic.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationOperations: process.env.NODE_ENV === 'development'
});

/**
 * POST /api/staffing/auto-assign
 * Auto-assign staff to optimal schedules
 */
export async function POST(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const body = await request.json();
    
    // Validate required fields
    const required = ['date', 'locationId'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `${field} is required` }, { status: 400 });
      }
    }

    const { date, locationId, preferences = {} } = body;
    const targetDate = new Date(date);

    // Get provider schedules for the date
    const providerSchedules = await migrationAdapter.rawQuery(`
      SELECT * FROM provider_schedules_cache 
      WHERE location_id = $1 AND schedule_date = $2
    `, [locationId, date]);

    if (providerSchedules.length === 0) {
      return NextResponse.json({ success: false, error: 'No provider schedules found for this date' }, { status: 404 });
    }

    // Calculate optimal staffing using migration-aware business logic
    const optimalStaffing = await migrationStaffingBusinessLogic.calculateOptimalStaffingWithMigration(
      locationId,
      targetDate,
      providerSchedules
    );

    // Get available staff members
    const availableStaff = await migrationAdapter.select(
      'staff_members',
      '*',
      {
        employee_status: MigrationHelpers.convertEmployeeStatus('active'),
        is_active: true
      }
    );

    // Filter staff based on location preferences and availability
    const eligibleStaff = availableStaff.filter(staff => {
      // Check location eligibility
      const availableLocations = staff.available_locations || [staff.base_location_id];
      if (!availableLocations.includes(locationId)) {
        return false;
      }

      // Check if staff is available on this day
      const dayOfWeek = targetDate.getDay();
      // This would need to check staff_availability table for detailed availability
      return true; // Simplified for now
    });

    if (eligibleStaff.length === 0) {
      return NextResponse.json({ success: false, error: 'No eligible staff members found for this location and date' }, { status: 404 });
    }

    // Generate optimal assignments
    const assignments = [];
    
    for (const timeSlot of optimalStaffing.timeSlotRequirements) {
      // Sort staff by suitability for this time slot
      const suitableStaff = eligibleStaff
        .map(staff => {
          let score = 0;
          
          // Skills match
          const matchingSkills = (staff.skills || []).filter(skill => 
            timeSlot.requiredSkills.includes(skill)
          );
          score += matchingSkills.length * 10;
          
          // Experience level
          if (staff.performance_score) {
            score += staff.performance_score * 5;
          }
          
          // Availability preference
          const availStart = staff.availability_start_time || '08:00:00';
          const availEnd = staff.availability_end_time || '17:00:00';
          const slotStart = new Date(`2000-01-01T${timeSlot.startTime}`);
          const slotEnd = new Date(`2000-01-01T${timeSlot.endTime}`);
          const availStartTime = new Date(`2000-01-01T${availStart}`);
          const availEndTime = new Date(`2000-01-01T${availEnd}`);
          
          if (slotStart >= availStartTime && slotEnd <= availEndTime) {
            score += 20; // Preferred time slot
          }
          
          return { staff, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, timeSlot.requiredStaff);

      // Create schedule assignments
      for (const { staff } of suitableStaff) {
        const assignment = {
          staff_member_id: staff.id,
          location_id: locationId,
          schedule_date: date,
          start_time: timeSlot.startTime,
          end_time: timeSlot.endTime,
          role: staff.role,
          status: MigrationHelpers.convertScheduleStatus('scheduled'),
          assignment_type: 'auto_assigned',
          ai_confidence_score: Math.min(95, 70 + (suitableStaff.find(s => s.staff.id === staff.id)?.score || 0)),
          optimization_factors: {
            skills_match: timeSlot.requiredSkills.filter(skill => 
              (staff.skills || []).includes(skill)
            ).length,
            time_preference_match: true,
            location_preference_match: true,
            auto_assigned: true,
            assignment_date: new Date().toISOString()
          },
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        assignments.push(assignment);
      }
    }

    // Check for conflicts with existing schedules
    const existingSchedules = await migrationAdapter.select(
      'staff_schedules',
      '*',
      {
        schedule_date: date,
        location_id: locationId,
        status: ['scheduled', 'confirmed', 'in_progress']
      }
    );

    // Filter out conflicting assignments
    const validAssignments = assignments.filter(assignment => {
      return !existingSchedules.some(existing => {
        if (existing.staff_member_id !== assignment.staff_member_id) {
          return false;
        }
        
        const existingStart = new Date(`2000-01-01T${existing.start_time}`);
        const existingEnd = new Date(`2000-01-01T${existing.end_time}`);
        const assignmentStart = new Date(`2000-01-01T${assignment.start_time}`);
        const assignmentEnd = new Date(`2000-01-01T${assignment.end_time}`);
        
        return (assignmentStart < existingEnd && assignmentEnd > existingStart);
      });
    });

    if (validAssignments.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid assignments could be generated without conflicts' }, { status: 409 });
    }

    // Create the schedule assignments
    const createdSchedules = [];
    for (const assignment of validAssignments) {
      const [newSchedule] = await migrationAdapter.insert('staff_schedules', assignment);
      createdSchedules.push(newSchedule);
    }

    // Auto-approve schedules using migration-aware business logic
    const approvalResult = await migrationStaffingBusinessLogic.autoApproveSchedulesWithMigration(
      createdSchedules,
      user.id
    );

    return NextResponse.json({ success: true, data: {
      assignments: createdSchedules,
      optimization_summary: {
        total_assignments: createdSchedules.length,
        coverage_percentage: Math.round((createdSchedules.length / optimalStaffing.optimalStaffCount) * 100),
        average_confidence: Math.round(
          createdSchedules.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / createdSchedules.length
        ),
        auto_approved: approvalResult.approved.length,
        requires_review: approvalResult.rejected.length,
        conflicts_resolved: assignments.length - validAssignments.length
      },
      approval_results: approvalResult
    }});
  });
}