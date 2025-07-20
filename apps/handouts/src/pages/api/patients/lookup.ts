import { createApiHandler, ApiErrors, successResponse } from '@ganger/utils/server';
import { createSupabaseServerClient } from '@ganger/auth/server';

export default createApiHandler(
  async (req, res) => {
    const supabase = createSupabaseServerClient();
    
    if (req.method === 'GET') {
      const { mrn } = req.query;
      
      if (!mrn || typeof mrn !== 'string') {
        throw ApiErrors.badRequest('MRN is required');
      }
      
      // Look up patient by MRN
      const { data: patient, error } = await supabase
        .from('patients')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          medical_record_number,
          phone,
          email
        `)
        .eq('medical_record_number', mrn)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiErrors.notFound('Patient not found');
        }
        throw ApiErrors.internal(error.message);
      }
      
      // Format patient data
      const patientData = {
        id: patient.id,
        mrn: patient.medical_record_number,
        name: `${patient.first_name} ${patient.last_name}`,
        dateOfBirth: patient.date_of_birth,
        phone: patient.phone,
        email: patient.email
      };
      
      return successResponse(res, patientData);
    }
    
    throw ApiErrors.methodNotAllowed(req.method || 'UNKNOWN');
  },
  {
    requireAuth: true,
    allowedMethods: ['GET']
  }
);