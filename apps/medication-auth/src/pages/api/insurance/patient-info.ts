import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { migrationAdapter } from '@ganger/db';
import { 
  ApiErrors, 
  sendError, 
  sendSuccess, 
  withErrorHandler 
} from '@/lib/api/errors';

export default withErrorHandler(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }

  // Use @ganger/auth for authentication
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const { patient_id } = req.query;
  
  if (!patient_id) {
    throw ApiErrors.validation('Patient ID is required');
  }

  try {
    // Fetch patient insurance information
    const insuranceData = await migrationAdapter.select(
      'patient_insurance',
      `
        *,
        insurance_plan:insurance_plans!patient_insurance_plan_id_fkey(
          plan_name,
          plan_type,
          carrier_name
        )
      `,
      {
        patient_id: patient_id,
        status: 'active'
      },
      {
        orderBy: '-effective_date',
        limit: 1
      }
    );

    if (!insuranceData || insuranceData.length === 0) {
      return sendSuccess(res, { insurance: null });
    }

    const insurance = insuranceData[0];
    
    // Transform data to match frontend interface
    const transformedInsurance = {
      planName: insurance.insurance_plan?.plan_name || 'Unknown Plan',
      planType: insurance.insurance_plan?.plan_type || 'PPO',
      memberId: insurance.member_id,
      groupNumber: insurance.group_number,
      effectiveDate: insurance.effective_date,
      status: insurance.status,
      copayAmount: insurance.copay_amount || 0,
      deductible: insurance.deductible || 0,
      outOfPocketMax: insurance.out_of_pocket_max || 0
    };

    sendSuccess(res, {
      insurance: transformedInsurance
    });
  } catch (error) {
    throw error; // Re-throw to be handled by withErrorHandler
  }
});