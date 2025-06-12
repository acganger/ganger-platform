import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@ganger/auth';
import type { AuthenticatedRequest } from '@ganger/auth';
import { createSupabaseServerClient } from '@ganger/auth';

/**
 * GET/POST /api/staff-schedules
 * Handle staff schedules operations
 */
export default withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});

/**
 * GET /api/staff-schedules
 * Fetch staff schedules with filtering and pagination
 */
async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { 
      date, 
      locationId, 
      staffMemberId, 
      status,
      page = '1',
      limit = '25'
    } = req.query;
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('read_staff_schedules')) {
      return res.status(403).json({
        error: 'Insufficient permissions to read staff schedules'
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string)), 100);

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, provide mock schedule data since tables aren't set up
    const mockSchedules = [
      {
        id: 'sched_1',
        staff_member_id: staffMemberId || 'staff_1',
        schedule_date: new Date(date as string || '2025-01-13'),
        location_id: locationId || 'northfield',
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
        status: status || 'scheduled',
        staff_member: {
          id: 'staff_1',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.johnson@gangerdermatology.com',
          role_type: 'medical_assistant',
          skill_level: 'senior'
        },
        location: {
          id: 'northfield',
          name: 'Northfield Office',
          address: '123 Main St, Northfield, MN'
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'sched_2',
        staff_member_id: 'staff_2',
        schedule_date: new Date(date as string || '2025-01-13'),
        location_id: 'plymouth',
        shift_start_time: '12:00:00',
        shift_end_time: '20:00:00',
        break_start_time: '16:00:00',
        break_end_time: '17:00:00',
        assigned_providers: ['dr_clark'],
        schedule_type: 'afternoon',
        assignment_method: 'automated',
        coverage_priority: 75,
        special_assignments: ['urgent_care_support'],
        notes: 'Afternoon coverage with urgent care support',
        status: 'confirmed',
        staff_member: {
          id: 'staff_2',
          first_name: 'Mike',
          last_name: 'Chen',
          email: 'mike.chen@gangerdermatology.com',
          role_type: 'nurse',
          skill_level: 'intermediate'
        },
        location: {
          id: 'plymouth',
          name: 'Plymouth Office',
          address: '456 Oak Ave, Plymouth, MN'
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Filter data based on query parameters
    let filteredData = mockSchedules;
    
    if (staffMemberId) {
      filteredData = filteredData.filter(s => s.staff_member_id === staffMemberId);
    }
    
    if (locationId) {
      filteredData = filteredData.filter(s => s.location_id === locationId);
    }
    
    if (status) {
      filteredData = filteredData.filter(s => s.status === status);
    }

    const total = filteredData.length;
    const paginatedData = filteredData.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      success: true,
      data: paginatedData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch staff schedules',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/staff-schedules
 * Create a new staff schedule
 */
async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const data = req.body;
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('write_staff_schedules')) {
      return res.status(403).json({
        error: 'Insufficient permissions to create staff schedules'
      });
    }

    // Basic validation
    if (!data.staff_member_id || !data.schedule_date || !data.location_id) {
      return res.status(400).json({
        error: 'Missing required fields: staff_member_id, schedule_date, location_id'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, create mock schedule record
    const mockSchedule = {
      id: `sched_${Date.now()}`,
      staff_member_id: data.staff_member_id,
      schedule_date: new Date(data.schedule_date),
      location_id: data.location_id,
      shift_start_time: data.shift_start_time || '08:00:00',
      shift_end_time: data.shift_end_time || '16:00:00',
      break_start_time: data.break_start_time || null,
      break_end_time: data.break_end_time || null,
      assigned_providers: data.assigned_providers || [],
      schedule_type: data.schedule_type || 'regular',
      assignment_method: data.assignment_method || 'manual',
      coverage_priority: data.coverage_priority || 50,
      special_assignments: data.special_assignments || [],
      notes: data.notes || null,
      status: 'scheduled',
      staff_member: {
        id: data.staff_member_id,
        first_name: 'New',
        last_name: 'Staff',
        email: 'new.staff@gangerdermatology.com',
        role_type: 'medical_assistant',
        skill_level: 'junior'
      },
      location: {
        id: data.location_id,
        name: 'Office Location',
        address: 'Office Address'
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    return res.status(201).json({
      success: true,
      data: mockSchedule
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}