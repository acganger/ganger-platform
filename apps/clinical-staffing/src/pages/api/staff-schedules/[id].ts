import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@ganger/auth';
import type { AuthenticatedRequest } from '@ganger/auth';
import { createSupabaseServerClient } from '@ganger/auth';

/**
 * GET/PUT/DELETE /api/staff-schedules/[id]
 * Handle individual staff schedule record operations
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
 * GET /api/staff-schedules/[id]
 * Fetch a specific staff schedule by ID
 */
async function handleGet(req: AuthenticatedRequest, res: NextApiResponse, scheduleId: string) {
  try {
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('read_staff_schedules')) {
      return res.status(403).json({
        error: 'Insufficient permissions to read staff schedule'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, provide mock schedule data since tables aren't set up
    const mockSchedule = {
      id: scheduleId,
      staff_member_id: 'staff_1',
      schedule_date: new Date('2025-01-13'),
      location_id: 'northfield',
      shift_start_time: '08:00:00',
      shift_end_time: '16:00:00',
      break_start_time: '12:00:00',
      break_end_time: '13:00:00',
      assigned_providers: ['dr_smith', 'dr_jones'],
      schedule_type: 'regular',
      assignment_method: 'manual',
      coverage_priority: 50,
      special_assignments: [],
      notes: 'Regular morning shift',
      status: 'scheduled',
      staff_member: {
        id: 'staff_1',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@gangerdermatology.com',
        role_type: 'medical_assistant',
        skill_level: 'senior',
        user_id: user.id // Simulate ownership
      },
      location: {
        id: 'northfield',
        name: 'Northfield Office',
        address: '123 Main St, Northfield, MN'
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    // Check if record exists (mock check)
    if (!scheduleId || scheduleId === 'undefined') {
      return res.status(404).json({
        error: 'Schedule not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: mockSchedule
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/staff-schedules/[id]
 * Update a specific staff schedule
 */
async function handlePut(req: AuthenticatedRequest, res: NextApiResponse, scheduleId: string) {
  try {
    const data = req.body;
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('write_staff_schedules')) {
      return res.status(403).json({
        error: 'Insufficient permissions to update staff schedule'
      });
    }

    // Basic validation
    if (!scheduleId || scheduleId === 'undefined') {
      return res.status(404).json({
        error: 'Schedule not found'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, create updated mock schedule record
    const updatedSchedule = {
      id: scheduleId,
      staff_member_id: data.staff_member_id || 'staff_1',
      schedule_date: data.schedule_date ? new Date(data.schedule_date) : new Date('2025-01-13'),
      location_id: data.location_id || 'northfield',
      shift_start_time: data.shift_start_time || '08:00:00',
      shift_end_time: data.shift_end_time || '16:00:00',
      break_start_time: data.break_start_time || '12:00:00',
      break_end_time: data.break_end_time || '13:00:00',
      assigned_providers: data.assigned_providers || [],
      schedule_type: data.schedule_type || 'regular',
      assignment_method: data.assignment_method || 'manual',
      coverage_priority: data.coverage_priority || 50,
      special_assignments: data.special_assignments || [],
      notes: data.notes || null,
      status: data.status || 'scheduled',
      staff_member: {
        id: 'staff_1',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@gangerdermatology.com',
        role_type: 'medical_assistant',
        skill_level: 'senior'
      },
      location: {
        id: data.location_id || 'northfield',
        name: 'Northfield Office',
        address: '123 Main St, Northfield, MN'
      },
      created_at: new Date('2025-01-01'),
      updated_at: new Date()
    };

    return res.status(200).json({
      success: true,
      data: updatedSchedule
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to update schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/staff-schedules/[id]
 * Delete a specific staff schedule
 */
async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse, scheduleId: string) {
  try {
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('delete_staff_schedules')) {
      return res.status(403).json({
        error: 'Insufficient permissions to delete staff schedule'
      });
    }

    // Basic validation
    if (!scheduleId || scheduleId === 'undefined') {
      return res.status(404).json({
        error: 'Schedule not found'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, simulate successful deletion
    return res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to delete schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}