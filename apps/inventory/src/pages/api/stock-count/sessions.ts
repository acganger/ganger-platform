import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@ganger/db';
import { withAuth } from '@ganger/auth/api';
import { analytics } from '@ganger/monitoring';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient();

  if (req.method === 'GET') {
    const { status } = req.query;

    try {
      let query = supabase
        .from('stock_count_sessions')
        .select(`
          *,
          stock_counts(count)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: sessions, error } = await query;

      if (error) {
        throw error;
      }

      // Calculate additional metrics for each session
      const sessionsWithMetrics = await Promise.all(
        (sessions || []).map(async (session) => {
          // Get count of items counted in this session
          const { count: itemsCounted } = await supabase
            .from('stock_counts')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          // Get count of pending submissions (not approved variances)
          const { count: pendingSubmissions } = await supabase
            .from('stock_counts')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('is_variance_approved', false)
            .neq('variance', 0);

          return {
            session,
            itemsCounted: itemsCounted || 0,
            pendingSubmissions: pendingSubmissions || 0
          };
        })
      );

      return res.status(200).json(sessionsWithMetrics);
    } catch (error) {
      console.error('Error fetching stock count sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }

  if (req.method === 'POST') {
    const { session_name, location_id, count_type, category_ids, scheduled_date } = req.body;

    if (!session_name || !location_id || !count_type) {
      return res.status(400).json({ error: 'Session name, location, and count type are required' });
    }

    try {
      const { data: session, error } = await supabase
        .from('stock_count_sessions')
        .insert({
          session_name,
          location_id,
          status: 'planned',
          count_type,
          category_ids,
          scheduled_date: scheduled_date || new Date().toISOString(),
          items_planned: 0, // Will be calculated based on categories/location
          items_counted: 0,
          discrepancies_found: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      analytics.track('stock_count_session_created', 'api', {
        session_id: session.id,
        count_type,
        location_id
      });

      return res.status(201).json(session);
    } catch (error) {
      console.error('Error creating stock count session:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler, { requiredLevel: 'staff' });