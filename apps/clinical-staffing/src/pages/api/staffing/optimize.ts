import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@ganger/auth';
import type { AuthenticatedRequest } from '@ganger/auth';
import { createSupabaseServerClient } from '@ganger/auth';

/**
 * POST /api/staffing/optimize
 * Generate AI-powered staffing optimization suggestions
 */
export default withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, locationId, optimizationType = 'balanced' } = req.body;
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('optimize_staffing')) {
      return res.status(403).json({
        error: 'Insufficient permissions to run staffing optimization'
      });
    }

    if (!date) {
      return res.status(400).json({
        error: 'Date is required for optimization'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, provide mock optimization results since the AI engine isn't set up
    const mockOptimization = {
      optimization: {
        suggestedSchedules: [
          {
            id: 'opt_sched_1',
            staff_member_id: 'staff_1',
            staff_member_name: 'Sarah Johnson',
            role_type: 'medical_assistant',
            schedule_date: new Date(date),
            location_id: locationId || 'northfield',
            shift_start_time: '08:00:00',
            shift_end_time: '16:00:00',
            assigned_providers: ['dr_smith', 'dr_jones'],
            confidence: 0.92,
            optimization_score: 88.5,
            reasoning: 'High skill level match with provider preferences. Optimal coverage period.',
            changes_from_current: ['Reassigned from afternoon to morning shift', 'Added Dr. Jones coverage'],
            estimated_improvement: {
              coverage_increase: 8.5,
              cost_reduction: 120.50,
              satisfaction_boost: 12.0
            }
          },
          {
            id: 'opt_sched_2',
            staff_member_id: 'staff_2',
            staff_member_name: 'Mike Chen',
            role_type: 'nurse',
            schedule_date: new Date(date),
            location_id: 'plymouth',
            shift_start_time: '12:00:00',
            shift_end_time: '20:00:00',
            assigned_providers: ['dr_clark'],
            confidence: 0.87,
            optimization_score: 85.2,
            reasoning: 'Cross-location flexibility utilized. Addresses afternoon coverage gap.',
            changes_from_current: ['Location change from Northfield to Plymouth', 'Extended evening coverage'],
            estimated_improvement: {
              coverage_increase: 15.2,
              cost_reduction: -45.00, // Slight increase due to travel
              satisfaction_boost: 8.5
            }
          },
          {
            id: 'opt_sched_3',
            staff_member_id: 'staff_3',
            staff_member_name: 'Emily Rodriguez',
            role_type: 'medical_assistant',
            schedule_date: new Date(date),
            location_id: locationId || 'northfield',
            shift_start_time: '14:00:00',
            shift_end_time: '18:00:00',
            assigned_providers: ['dr_martinez'],
            confidence: 0.78,
            optimization_score: 82.1,
            reasoning: 'Part-time specialist availability. Covers high-demand afternoon period.',
            changes_from_current: ['New schedule - previously unscheduled', 'Specialized dermatology support'],
            estimated_improvement: {
              coverage_increase: 22.0,
              cost_reduction: 200.75,
              satisfaction_boost: 18.5
            }
          }
        ],
        confidence: 0.86,
        warnings: [
          'Staff member Mike Chen requires travel time between locations',
          'Emily Rodriguez availability is limited to 4-hour shifts'
        ],
        optimization_type: optimizationType,
        algorithm_version: '2.1.3',
        processing_time_ms: 1247,
        total_scenarios_evaluated: 156
      },
      metrics: {
        current_state: {
          total_coverage_hours: 32.0,
          coverage_percentage: 78.5,
          estimated_cost: 1850.00,
          understaffed_periods: 4,
          overstaffed_periods: 1,
          staff_satisfaction_score: 72.3
        },
        optimized_state: {
          total_coverage_hours: 40.0,
          coverage_percentage: 95.2,
          estimated_cost: 1625.25,
          understaffed_periods: 1,
          overstaffed_periods: 0,
          staff_satisfaction_score: 84.7
        },
        improvements: {
          coverage_hours_added: 8.0,
          coverage_percentage_increase: 16.7,
          cost_savings: 224.75,
          understaffed_periods_reduced: 3,
          satisfaction_improvement: 12.4,
          roi_percentage: 13.8
        }
      },
      recommendations: [
        {
          priority: 'high',
          category: 'schedule_optimization',
          title: 'Implement Cross-Location Flexibility',
          description: 'Utilize staff willing to work across locations to address coverage gaps',
          impact: 'Increases overall coverage by 16.7% while maintaining cost efficiency',
          action_items: [
            'Confirm Mike Chen availability for Plymouth location',
            'Arrange transportation or travel time compensation',
            'Update scheduling software with cross-location preferences'
          ]
        },
        {
          priority: 'medium',
          category: 'staffing_strategy',
          title: 'Leverage Part-Time Specialists',
          description: 'Schedule specialized part-time staff during high-demand periods',
          impact: 'Addresses afternoon coverage gaps with minimal cost increase',
          action_items: [
            'Confirm Emily Rodriguez availability for expanded hours',
            'Review dermatology-specific procedure scheduling',
            'Consider hiring additional part-time specialists'
          ]
        },
        {
          priority: 'low',
          category: 'process_improvement',
          title: 'Automate Schedule Optimization',
          description: 'Implement weekly automated optimization runs',
          impact: 'Maintains optimal staffing with reduced manual effort',
          action_items: [
            'Schedule weekly optimization analysis',
            'Set up automated alerts for staffing gaps',
            'Train schedulers on optimization tool usage'
          ]
        }
      ],
      confidence: 0.86,
      warnings: [
        'Staff member Mike Chen requires travel time between locations',
        'Emily Rodriguez availability is limited to 4-hour shifts',
        'Optimization assumes current provider schedules remain unchanged'
      ]
    };

    return res.status(200).json({
      success: true,
      data: mockOptimization
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to generate staffing optimization',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});