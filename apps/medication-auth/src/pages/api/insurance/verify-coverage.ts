import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { migrationAdapter } from '@ganger/db';
import { cacheManager } from '@ganger/cache';
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
  if (req.method !== 'POST') {
    throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }

  // Use @ganger/auth for authentication
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const { patient_id, medication_id, plan_id } = req.body;
  
  if (!patient_id || !medication_id || !plan_id) {
    throw ApiErrors.validation('Patient ID, Medication ID, and Plan ID are required');
  }

  try {
    // Check cache first
    const cacheKey = `coverage:${plan_id}:${medication_id}`;
    const cachedCoverage = await cacheManager.get(cacheKey);
    
    if (cachedCoverage) {
      return sendSuccess(res, { coverage: cachedCoverage });
    }

    // Check formulary coverage
    const formularyData = await migrationAdapter.select(
      'insurance_formulary',
      '*',
      {
        plan_id: plan_id,
        medication_id: medication_id
      },
      {
        limit: 1
      }
    );

    let coverageInfo;
    
    if (formularyData && formularyData.length > 0) {
      const formulary = formularyData[0];
      
      coverageInfo = {
        isCovered: formulary.is_covered || false,
        requiresPA: formulary.requires_prior_auth || false,
        copayAmount: formulary.copay_amount || null,
        coinsurancePercent: formulary.coinsurance_percent || null,
        deductibleApplies: formulary.deductible_applies || false,
        priorAuthStatus: 'not_required',
        limitations: formulary.limitations ? JSON.parse(formulary.limitations) : [],
        alternatives: formulary.alternatives ? JSON.parse(formulary.alternatives) : []
      };
    } else {
      // Default coverage info if not in formulary
      coverageInfo = {
        isCovered: false,
        requiresPA: true,
        copayAmount: null,
        coinsurancePercent: null,
        deductibleApplies: true,
        priorAuthStatus: 'not_required',
        limitations: ['Medication not on formulary'],
        alternatives: []
      };
    }

    // Check if there's an existing prior auth for this patient/medication
    if (coverageInfo.requiresPA) {
      const priorAuthData = await migrationAdapter.select(
        'prior_authorizations',
        '*',
        {
          patient_id: patient_id,
          medication_id: medication_id,
          status: ['approved', 'pending']
        },
        {
          orderBy: '-created_at',
          limit: 1
        }
      );

      if (priorAuthData && priorAuthData.length > 0) {
        coverageInfo.priorAuthStatus = priorAuthData[0].status;
      }
    }

    // Cache for 24 hours
    await cacheManager.set(cacheKey, coverageInfo, 86400);

    sendSuccess(res, {
      coverage: coverageInfo
    });
  } catch (error) {
    throw error; // Re-throw to be handled by withErrorHandler
  }
});