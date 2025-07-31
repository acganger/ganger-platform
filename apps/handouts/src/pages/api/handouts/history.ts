import { createApiHandler, ApiErrors, successResponse } from '@ganger/utils/server';
import { createSupabaseServerClient } from '@ganger/auth/server';

export default createApiHandler(
  async (req, res) => {
    const supabase = createSupabaseServerClient();
    
    if (req.method === 'GET') {
      const { search, dateRange = '7d', status } = req.query;
      
      // Calculate date filter
      let startDate = new Date();
      switch (dateRange) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }
      
      // Build query
      let query = supabase
        .from('handout_generations')
        .select(`
          id,
          patient_id,
          generated_by,
          delivery_method,
          status,
          pdf_url,
          created_at,
          handout_templates!inner (
            id,
            name
          ),
          patients!inner (
            id,
            first_name,
            last_name,
            medical_record_number
          ),
          users!generated_by (
            id,
            full_name
          ),
          handout_delivery_logs (
            delivery_status,
            delivered_at
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      
      if (search) {
        query = query.or(`
          patients.first_name.ilike.%${search}%,
          patients.last_name.ilike.%${search}%,
          patients.medical_record_number.ilike.%${search}%
        `);
      }
      
      const { data: generations, error } = await query;
      
      if (error) {
        throw ApiErrors.internal(error.message);
      }
      
      // Transform data to match frontend format
      const handouts = (generations || []).map((gen: any) => ({
        id: gen.id,
        patientName: `${gen.patients?.first_name || ''} ${gen.patients?.last_name || ''}`.trim(),
        patientMRN: gen.patients?.medical_record_number || 'Unknown',
        templates: [gen.handout_templates?.name || 'Unknown Template'],
        generatedAt: gen.created_at,
        generatedBy: gen.users?.full_name || 'Unknown',
        deliveryMethods: [gen.delivery_method],
        status: gen.status === 'delivered' ? 'completed' : gen.status,
        emailStatus: gen.delivery_method === 'email' ? 
          gen.handout_delivery_logs?.[0]?.delivery_status || 'sent' : undefined,
        smsStatus: gen.delivery_method === 'sms' ? 
          gen.handout_delivery_logs?.[0]?.delivery_status || 'sent' : undefined,
        downloadCount: gen.pdf_url ? 1 : 0, // Simplified for now
        lastDownloaded: gen.handout_delivery_logs?.[0]?.delivered_at
      }));
      
      return successResponse(res, handouts);
    }
    
    throw ApiErrors.methodNotAllowed(req.method || 'UNKNOWN');
  },
  {
    requireAuth: true,
    allowedMethods: ['GET']
  }
);