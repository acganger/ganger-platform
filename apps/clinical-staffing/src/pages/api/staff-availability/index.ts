import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@ganger/auth';
import type { AuthenticatedRequest } from '@ganger/auth';
import { createSupabaseServerClient } from '@ganger/auth';

/**
 * GET/POST /api/staff-availability
 * Handle staff availability operations
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
 * GET /api/staff-availability
 * Fetch staff availability with filtering and pagination
 */
async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { 
      staffMemberId, 
      locationId, 
      startDate, 
      endDate, 
      dayOfWeek,
      page = '1',
      limit = '25'
    } = req.query;
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('read_staff_availability')) {
      return res.status(403).json({
        error: 'Insufficient permissions to read staff availability'
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, provide mock availability data since tables aren't set up
    const mockAvailability = [
      {
        id: 'avail_1',
        staff_member_id: staffMemberId || 'staff_1',
        date_range_start: new Date('2025-01-13'),
        date_range_end: new Date('2025-01-19'),
        days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
        available_start_time: '08:00:00',
        available_end_time: '17:00:00',
        location_preferences: locationId ? [locationId] : ['northfield'],
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
          employment_status: 'full_time'
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'avail_2',
        staff_member_id: 'staff_2',
        date_range_start: new Date('2025-01-13'),
        date_range_end: new Date('2025-01-19'),
        days_of_week: [0, 6], // Weekends
        available_start_time: '09:00:00',
        available_end_time: '15:00:00',
        location_preferences: ['northfield', 'plymouth'],
        unavailable_dates: [],
        preferred_providers: [],
        max_consecutive_days: 2,
        min_hours_between_shifts: 16,
        overtime_willing: false,
        cross_location_willing: true,
        notes: 'Weekend coverage specialist',
        staff_member: {
          id: 'staff_2',
          first_name: 'Mike',
          last_name: 'Chen',
          email: 'mike.chen@gangerdermatology.com',
          role_type: 'nurse',
          skill_level: 'intermediate',
          employment_status: 'part_time'
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Filter data based on query parameters
    let filteredData = mockAvailability;
    
    if (staffMemberId) {
      filteredData = filteredData.filter(a => a.staff_member_id === staffMemberId);
    }
    
    if (dayOfWeek !== undefined) {
      const dayNum = parseInt(dayOfWeek as string);
      if (!isNaN(dayNum)) {
        filteredData = filteredData.filter(a => a.days_of_week.includes(dayNum));
      }
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
      error: 'Failed to fetch staff availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/staff-availability
 * Create new staff availability record
 */
async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const data = req.body;
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('write_staff_availability')) {
      return res.status(403).json({
        error: 'Insufficient permissions to create staff availability'
      });
    }

    // Basic validation
    if (!data.staff_member_id || !data.date_range_start || !data.date_range_end) {
      return res.status(400).json({
        error: 'Missing required fields: staff_member_id, date_range_start, date_range_end'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, create mock availability record
    const mockAvailability = {
      id: `avail_${Date.now()}`,
      staff_member_id: data.staff_member_id,
      date_range_start: new Date(data.date_range_start),
      date_range_end: new Date(data.date_range_end),
      days_of_week: data.days_of_week || [1, 2, 3, 4, 5],
      available_start_time: data.available_start_time || '08:00:00',
      available_end_time: data.available_end_time || '17:00:00',
      location_preferences: data.location_preferences || [],
      unavailable_dates: data.unavailable_dates || [],
      preferred_providers: data.preferred_providers || [],
      max_consecutive_days: data.max_consecutive_days || 5,
      min_hours_between_shifts: data.min_hours_between_shifts || 12,
      overtime_willing: data.overtime_willing || false,
      cross_location_willing: data.cross_location_willing || false,
      notes: data.notes || null,
      staff_member: {
        id: data.staff_member_id,
        first_name: 'New',
        last_name: 'Staff',
        email: 'new.staff@gangerdermatology.com',
        role_type: 'medical_assistant',
        skill_level: 'junior'
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    return res.status(201).json({
      success: true,
      data: mockAvailability
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}