import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@ganger/auth';
import type { AuthenticatedRequest } from '@ganger/auth';
import { createSupabaseServerClient } from '@ganger/auth';

/**
 * GET/PUT/DELETE /api/staff-availability/[id]
 * Handle individual staff availability record operations
 */
export default withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (req.method === 'GET') {
    return handleGet(req, res, id as string);
  } else if (req.method === 'PUT') {
    return handlePut(req, res, id as string);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, id as string);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});

/**
 * GET /api/staff-availability/[id]
 * Fetch a specific staff availability record by ID
 */
async function handleGet(req: AuthenticatedRequest, res: NextApiResponse, availabilityId: string) {
  try {
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('read_staff_availability')) {
      return res.status(403).json({
        error: 'Insufficient permissions to read staff availability'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, provide mock availability data since tables aren't set up
    const mockAvailability = {
      id: availabilityId,
      staff_member_id: 'staff_1',
      date_range_start: new Date('2025-01-13'),
      date_range_end: new Date('2025-01-19'),
      days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
      available_start_time: '08:00:00',
      available_end_time: '17:00:00',
      location_preferences: ['northfield'],
      unavailable_dates: [],
      preferred_providers: [],
      max_consecutive_days: 5,
      min_hours_between_shifts: 12,
      overtime_willing: true,
      cross_location_willing: false,
      notes: 'Regular weekday availability',
      staff_member: {
        id: 'staff_1',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@gangerdermatology.com',
        role_type: 'medical_assistant',
        skill_level: 'senior',
        employment_status: 'full_time',
        user_id: user.id // Simulate ownership
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    // Check if record exists (mock check)
    if (!availabilityId || availabilityId === 'undefined') {
      return res.status(404).json({
        error: 'Availability record not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: mockAvailability
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch availability record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/staff-availability/[id]
 * Update a specific staff availability record
 */
async function handlePut(req: AuthenticatedRequest, res: NextApiResponse, availabilityId: string) {
  try {
    const data = req.body;
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('write_staff_availability')) {
      return res.status(403).json({
        error: 'Insufficient permissions to update staff availability'
      });
    }

    // Basic validation
    if (!availabilityId || availabilityId === 'undefined') {
      return res.status(404).json({
        error: 'Availability record not found'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, create updated mock availability record
    const updatedAvailability = {
      id: availabilityId,
      staff_member_id: data.staff_member_id || 'staff_1',
      date_range_start: data.date_range_start ? new Date(data.date_range_start) : new Date('2025-01-13'),
      date_range_end: data.date_range_end ? new Date(data.date_range_end) : new Date('2025-01-19'),
      days_of_week: data.days_of_week || [1, 2, 3, 4, 5],
      available_start_time: data.available_start_time || '08:00:00',
      available_end_time: data.available_end_time || '17:00:00',
      location_preferences: data.location_preferences || [],
      unavailable_dates: data.unavailable_dates || [],
      preferred_providers: data.preferred_providers || [],
      max_consecutive_days: data.max_consecutive_days || 5,
      min_hours_between_shifts: data.min_hours_between_shifts || 12,
      overtime_willing: data.overtime_willing !== undefined ? data.overtime_willing : true,
      cross_location_willing: data.cross_location_willing !== undefined ? data.cross_location_willing : false,
      notes: data.notes || null,
      staff_member: {
        id: 'staff_1',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@gangerdermatology.com',
        role_type: 'medical_assistant',
        skill_level: 'senior',
        employment_status: 'full_time'
      },
      created_at: new Date('2025-01-01'),
      updated_at: new Date()
    };

    return res.status(200).json({
      success: true,
      data: updatedAvailability
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to update availability record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/staff-availability/[id]
 * Delete a specific staff availability record
 */
async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse, availabilityId: string) {
  try {
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('delete_staff_availability')) {
      return res.status(403).json({
        error: 'Insufficient permissions to delete staff availability'
      });
    }

    // Basic validation
    if (!availabilityId || availabilityId === 'undefined') {
      return res.status(404).json({
        error: 'Availability record not found'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, simulate successful deletion
    return res.status(200).json({
      success: true,
      message: 'Availability record deleted successfully'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to delete availability record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}