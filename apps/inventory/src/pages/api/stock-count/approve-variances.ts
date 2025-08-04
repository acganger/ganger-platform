import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@ganger/db';
import { withAuth, AuthenticatedRequest } from '@ganger/auth/api';
import { analytics } from '@ganger/monitoring';

interface VarianceApproval {
  stock_count_id: string;
  approved_by: string;
  adjustment_notes?: string;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify supervisor access
  if (req.user?.role !== 'admin' && req.user?.role !== 'supervisor') {
    return res.status(403).json({ error: 'Supervisor access required' });
  }

  const { approvals } = req.body;

  if (!approvals || !Array.isArray(approvals) || approvals.length === 0) {
    return res.status(400).json({ error: 'Approvals array is required' });
  }

  try {
    const supabase = createClient();
    const timestamp = new Date().toISOString();
    const results = [];

    for (const approval of approvals as VarianceApproval[]) {
      // Update stock count record
      const { data: stockCount, error: updateError } = await supabase
        .from('stock_counts')
        .update({
          is_variance_approved: true,
          approved_by: approval.approved_by,
          approved_at: timestamp,
          adjustment_made: true,
          notes: approval.adjustment_notes 
            ? `${approval.adjustment_notes} | Approved by ${approval.approved_by}`
            : `Approved by ${approval.approved_by}`,
          updated_at: timestamp
        })
        .eq('id', approval.stock_count_id)
        .select()
        .single();

      if (updateError || !stockCount) {
        console.error('Error updating stock count:', updateError);
        results.push({
          stock_count_id: approval.stock_count_id,
          success: false,
          error: updateError?.message
        });
        continue;
      }

      // Create audit log entry
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'stock_count',
          entity_id: approval.stock_count_id,
          action: 'variance_approved',
          user_id: approval.approved_by,
          details: {
            variance: stockCount.variance,
            variance_value: stockCount.variance_value,
            adjustment_notes: approval.adjustment_notes
          },
          created_at: timestamp
        });

      if (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      results.push({
        stock_count_id: approval.stock_count_id,
        success: true
      });
    }

    // Update session statistics if applicable
    const sessionIds = new Set<string>();
    for (const approval of approvals) {
      const { data: stockCount } = await supabase
        .from('stock_counts')
        .select('session_id')
        .eq('id', approval.stock_count_id)
        .single();
      
      if (stockCount?.session_id) {
        sessionIds.add(stockCount.session_id);
      }
    }

    // Update session discrepancy counts
    for (const sessionId of sessionIds) {
      const { count: discrepancyCount } = await supabase
        .from('stock_counts')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .neq('variance', 0);

      await supabase
        .from('stock_count_sessions')
        .update({
          discrepancies_found: discrepancyCount || 0,
          updated_at: timestamp
        })
        .eq('id', sessionId);
    }

    analytics.track('variances_approved', 'api', {
      approval_count: approvals.length,
      success_count: results.filter(r => r.success).length,
      approved_by: req.user?.email
    });

    return res.status(200).json({
      success: true,
      results,
      approved: results.filter(r => r.success).length,
      total: approvals.length
    });
  } catch (error) {
    console.error('Error approving variances:', error);
    analytics.track('variance_approval_error', 'api', {
      error: error instanceof Error ? error.message : 'Unknown error',
      approved_by: req.user?.email
    });
    return res.status(500).json({ error: 'Failed to approve variances' });
  }
}

export default withAuth(handler, { requiredLevel: 'staff' });