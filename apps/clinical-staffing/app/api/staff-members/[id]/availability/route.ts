/**
 * Staff Member Availability API Route
 * Clinical Staffing App - Migration-Aware Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrationAdapter, MigrationHelpers } from '@ganger/db';
import { withStandardErrorHandling } from '@ganger/utils';
import { withAuth } from '@ganger/auth/middleware';

// Configure migration adapter
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

/**
 * GET /api/staff-members/[id]/availability
 * Get staff member availability
 */
export async function GET(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { pathname, searchParams } = new URL(request.url);
    const pathParts = pathname.split('/');
    const memberId = pathParts[pathParts.length - 2]; // staff-members/[id]/availability
    
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Staff member ID is required' }, { status: 400 });
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build filters for availability query
    const filters: Record<string, any> = {
      staff_member_id: memberId
    };

    if (startDate && endDate) {
      // Query for specific date range
      filters.date_range_start = { lte: endDate };
      filters.date_range_end = { gte: startDate };
    }

    // Query availability using migration adapter
    const availability = await migrationAdapter.select(
      'staff_availability',
      '*',
      filters,
      {
        orderBy: 'date_range_start',
        limit: 100
      }
    );

    // Transform data for consistent API response
    const transformedAvailability = availability.map(avail => ({
      id: avail.id,
      staff_member_id: avail.staff_member_id,
      availability_type: avail.availability_type,
      day_of_week: avail.day_of_week,
      start_time: avail.start_time,
      end_time: avail.end_time,
      specific_date: avail.specific_date,
      date_range_start: avail.date_range_start,
      date_range_end: avail.date_range_end,
      location_id: avail.location_id,
      priority: avail.priority,
      notes: avail.notes,
      is_recurring: avail.is_recurring,
      created_at: avail.created_at,
      updated_at: avail.updated_at
    }));

    return NextResponse.json({ success: true, data: transformedAvailability });
  });
}

/**
 * PUT /api/staff-members/[id]/availability
 * Update staff member availability
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { pathname } = new URL(request.url);
    const pathParts = pathname.split('/');
    const memberId = pathParts[pathParts.length - 2]; // staff-members/[id]/availability
    
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Staff member ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Check if staff member exists
    const existingMembers = await migrationAdapter.select(
      'staff_members',
      '*',
      { id: memberId }
    );

    if (existingMembers.length === 0) {
      return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
    }

    // Update staff member availability preferences
    const updateData = {
      availability_start_time: body.available_start_time || '08:00:00',
      availability_end_time: body.available_end_time || '17:00:00',
      available_locations: body.location_preferences || [],
      unavailable_dates: body.unavailable_dates || [],
      notes: body.notes,
      updated_at: new Date().toISOString()
    };

    // Update staff member using migration adapter
    const updatedMembers = await migrationAdapter.update(
      'staff_members',
      updateData,
      { id: memberId }
    );

    if (updatedMembers.length === 0) {
      return NextResponse.json({ success: false, error: 'Failed to update availability' }, { status: 500 });
    }

    // If specific availability records are provided, update them
    if (body.availability_records && Array.isArray(body.availability_records)) {
      // Delete existing availability records for this staff member
      await migrationAdapter.delete('staff_availability', { staff_member_id: memberId });

      // Create new availability records
      for (const record of body.availability_records) {
        const availabilityData = {
          staff_member_id: memberId,
          availability_type: MigrationHelpers.convertAvailabilityType(record.availability_type || 'available'),
          day_of_week: record.day_of_week,
          start_time: record.start_time,
          end_time: record.end_time,
          specific_date: record.specific_date,
          date_range_start: record.date_range_start,
          date_range_end: record.date_range_end,
          location_id: record.location_id,
          priority: record.priority || 3,
          notes: record.notes,
          is_recurring: record.is_recurring || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await migrationAdapter.insert('staff_availability', availabilityData);
      }
    }

    return NextResponse.json({ success: true, data: updatedMembers[0] });
  });
}

/**
 * POST /api/staff-members/[id]/availability
 * Add new availability record for staff member
 */
export async function POST(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { pathname } = new URL(request.url);
    const pathParts = pathname.split('/');
    const memberId = pathParts[pathParts.length - 2]; // staff-members/[id]/availability
    
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Staff member ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Check if staff member exists
    const existingMembers = await migrationAdapter.select(
      'staff_members',
      '*',
      { id: memberId }
    );

    if (existingMembers.length === 0) {
      return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
    }

    // Validate required fields
    const required = ['availability_type'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `${field} is required` }, { status: 400 });
      }
    }

    // Create availability record
    const availabilityData = {
      staff_member_id: memberId,
      availability_type: MigrationHelpers.convertAvailabilityType(body.availability_type),
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      specific_date: body.specific_date,
      date_range_start: body.date_range_start,
      date_range_end: body.date_range_end,
      location_id: body.location_id,
      priority: body.priority || 3,
      notes: body.notes,
      is_recurring: body.is_recurring || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert availability using migration adapter
    const [newAvailability] = await migrationAdapter.insert('staff_availability', availabilityData);

    return NextResponse.json({ success: true, data: newAvailability }, { status: 201 });
  });
}