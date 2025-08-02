/**
 * Staff Members API Route
 * Clinical Staffing App - Migration-Aware Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrationAdapter, MigrationHelpers } from '@ganger/db';
import { withStandardErrorHandling } from '@ganger/utils';
import { withAuth } from '@ganger/auth/middleware';

export const dynamic = 'force-dynamic';

// Configure migration adapter
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

/**
 * GET /api/staff-members
 * Retrieve staff members with optional filtering
 */
export async function GET(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const skills = searchParams.get('skills');

    // Build filters for migration-aware query
    const filters: Record<string, any> = {};

    if (locationId) {
      // Handle location filtering based on schema version
      if (process.env.MIGRATION_USE_NEW_SCHEMA === 'true') {
        filters.locations = { contains: [locationId] };
      } else {
        filters.base_location_id = locationId;
      }
    }

    if (role) filters.role = role;
    
    if (isActive !== null) {
      // Convert to employee_status for migration compatibility
      if (isActive === 'true') {
        filters.employee_status = MigrationHelpers.convertEmployeeStatus('active');
      } else {
        filters.employee_status = ['inactive', 'terminated'];
      }
    }

    // Query using migration adapter
    const staffMembers = await migrationAdapter.select(
      'staff_members',
      '*',
      filters,
      {
        orderBy: 'last_name',
        limit: 100
      }
    );

    // Transform data for consistent API response
    const transformedStaffMembers = staffMembers.map(member => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      email: member.email,
      role: member.role,
      employee_status: member.employee_status,
      certifications: member.certifications || [],
      skills: member.skills || [],
      availability_start_time: member.availability_start_time || '08:00:00',
      availability_end_time: member.availability_end_time || '17:00:00',
      location_preferences: member.available_locations || [member.base_location_id],
      hourly_rate: member.hourly_rate,
      max_hours_per_week: member.max_hours_per_week || 40,
      unavailable_dates: member.unavailable_dates || [],
      notes: member.notes,
      is_active: member.employee_status === 'active',
      created_at: member.created_at,
      updated_at: member.updated_at
    }));

    return NextResponse.json({ success: true, data: transformedStaffMembers });
  });
}

/**
 * POST /api/staff-members
 * Create new staff member
 */
export async function POST(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const body = await request.json();
    
    // Validate required fields
    const required = ['first_name', 'last_name', 'email', 'role'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `${field} is required` }, { status: 400 });
      }
    }

    // Check for duplicate email
    const existingMembers = await migrationAdapter.select(
      'staff_members',
      '*',
      { email: body.email }
    );

    if (existingMembers.length > 0) {
      return NextResponse.json({ success: false, error: 'Staff member with this email already exists' }, { status: 409 });
    }

    // Convert data for migration compatibility
    const memberData = {
      employee_id: body.employee_id || `EMP_${Date.now()}`,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      employee_status: MigrationHelpers.convertEmployeeStatus(body.employee_status || 'active'),
      job_title: body.job_title || body.role,
      base_location_id: body.base_location_id,
      available_locations: body.location_preferences || [body.base_location_id],
      hire_date: body.hire_date || new Date().toISOString().split('T')[0],
      skills: body.skills || [],
      certifications: body.certifications || [],
      hourly_rate: body.hourly_rate,
      max_hours_per_week: body.max_hours_per_week || 40,
      availability_start_time: body.availability_start_time || '08:00:00',
      availability_end_time: body.availability_end_time || '17:00:00',
      unavailable_dates: body.unavailable_dates || [],
      notes: body.notes,
      is_active: body.employee_status !== 'inactive' && body.employee_status !== 'terminated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create staff member using migration adapter
    const [newMember] = await migrationAdapter.insert('staff_members', memberData);

    return NextResponse.json({ success: true, data: newMember }, { status: 201 });
  });
}

/**
 * PUT /api/staff-members/[id]
 * Update existing staff member
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { pathname } = new URL(request.url);
    const memberId = pathname.split('/').pop();
    
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

    // Convert data for migration compatibility
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    if (body.employee_status) {
      updateData.employee_status = MigrationHelpers.convertEmployeeStatus(body.employee_status);
      updateData.is_active = body.employee_status === 'active';
    }

    if (body.location_preferences) {
      updateData.available_locations = body.location_preferences;
    }

    // Update staff member using migration adapter
    const updatedMembers = await migrationAdapter.update(
      'staff_members',
      updateData,
      { id: memberId }
    );

    if (updatedMembers.length === 0) {
      return NextResponse.json({ success: false, error: 'Failed to update staff member' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedMembers[0] });
  });
}

/**
 * DELETE /api/staff-members/[id]
 * Deactivate staff member (soft delete)
 */
export async function DELETE(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { pathname } = new URL(request.url);
    const memberId = pathname.split('/').pop();
    
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Staff member ID is required' }, { status: 400 });
    }

    // Check if staff member exists
    const existingMembers = await migrationAdapter.select(
      'staff_members',
      '*',
      { id: memberId }
    );

    if (existingMembers.length === 0) {
      return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
    }

    // Soft delete by updating status to inactive
    await migrationAdapter.update(
      'staff_members',
      { 
        employee_status: MigrationHelpers.convertEmployeeStatus('inactive'),
        is_active: false,
        updated_at: new Date().toISOString()
      },
      { id: memberId }
    );

    return NextResponse.json({ success: true, data: { message: 'Staff member deactivated successfully' } });
  });
}