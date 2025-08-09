import type { NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { withStaffAuth, AuthenticatedRequest } from '../../../lib/auth-middleware'

// Create server-side Supabase client
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req

  try {
    const supabase = createSupabaseClient()
    const user = req.user

    switch (method) {
      case 'GET': {
        const { scorecard_id, week_ending } = req.query

        if (!scorecard_id || !week_ending) {
          return res.status(400).json({ 
            error: 'Missing required parameters: scorecard_id and week_ending' 
          })
        }

        const { data, error } = await supabase
          .from('scorecard_entries')
          .select('*')
          .eq('scorecard_id', scorecard_id)
          .eq('week_ending', week_ending)

        if (error) {
          console.error('Database error:', error)
          return res.status(500).json({ error: 'Failed to fetch entries' })
        }

        return res.status(200).json({ entries: data || [] })
      }

      case 'POST': {
        const { updates, inserts } = req.body

        if (!updates && !inserts) {
          return res.status(400).json({ 
            error: 'No data provided for update or insert' 
          })
        }

        const results = {
          updates: { success: 0, errors: [] as any[] },
          inserts: { success: 0, errors: [] as any[] }
        }

        // Perform updates
        if (updates && updates.length > 0) {
          for (const update of updates) {
            const { id, ...updateData } = update
            
            // Add audit fields
            updateData.updated_at = new Date().toISOString()
            updateData.entered_by = user?.id || 'system'
            updateData.entered_at = new Date().toISOString()

            const { error } = await supabase
              .from('scorecard_entries')
              .update(updateData)
              .eq('id', id)

            if (error) {
              results.updates.errors.push({ id, error: error.message })
            } else {
              results.updates.success++
            }
          }
        }

        // Perform inserts
        if (inserts && inserts.length > 0) {
          const insertsWithAudit = inserts.map((insert: any) => ({
            ...insert,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            entered_by: user?.id || 'system',
            entered_at: new Date().toISOString()
          }))

          const { error } = await supabase
            .from('scorecard_entries')
            .insert(insertsWithAudit)

          if (error) {
            results.inserts.errors.push({ error: error.message })
          } else {
            results.inserts.success = inserts.length
          }
        }

        // Check if there were any errors
        const hasErrors = results.updates.errors.length > 0 || results.inserts.errors.length > 0

        return res.status(hasErrors ? 207 : 200).json({
          success: !hasErrors,
          results,
          message: hasErrors 
            ? 'Some entries failed to save' 
            : 'All entries saved successfully'
        })
      }

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Apply auth middleware
export default withStaffAuth(handler)