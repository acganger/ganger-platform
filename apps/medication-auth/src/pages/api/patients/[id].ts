import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/database/supabase-client';
import { IntegrationsManager } from '../../../lib/integrations/mock-integrations-manager';
import { withAuth } from '../../../lib/auth/middleware';
import { auditLog } from '../../../lib/security/audit-logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;
  const userId = (req as any).user?.id;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGetPatient(req, res, id, userId);
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    
    await auditLog({
      action: 'api_error',
      userId,
      resource: 'patient',
      resourceId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      phiAccessed: true
    });

    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : 'An unexpected error occurred'
    });
  }
}

async function handleGetPatient(req: NextApiRequest, res: NextApiResponse, id: string, userId: string) {
  try {
    // Initialize integrations manager
    const integrations = new IntegrationsManager({
      modmed: {
        baseUrl: process.env.MODMED_BASE_URL!,
        clientId: process.env.MODMED_CLIENT_ID!,
        clientSecret: process.env.MODMED_CLIENT_SECRET!,
        scope: ['patient.read', 'medication.read'],
        tokenUrl: process.env.MODMED_TOKEN_URL!
      },
      insuranceProviders: [],
      medicationDatabases: {
        primary: process.env.PRIMARY_DRUG_DB!,
        secondary: process.env.SECONDARY_DRUG_DB!,
        pricingAPI: process.env.PRICING_API!,
        interactionAPI: process.env.INTERACTION_API!
      },
      enabledFeatures: {
        realTimeEligibility: true,
        electronicSubmission: true,
        drugInteractionChecking: true,
        costTransparency: true,
        alternativeRecommendations: true
      }
    });

    // First check local database
    let { data: localPatient, error: localError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    let patientData;

    if (localError && localError.code === 'PGRST116') {
      // Patient not in local database, fetch from ModMed
      try {
        patientData = await integrations.getPatientData(id);
        
        // Store in local database for caching
        const { data: insertedPatient, error: insertError } = await supabase
          .from('patients')
          .insert({
            id,
            modmed_patient_id: patientData.modmedId,
            first_name: patientData.demographics.firstName,
            last_name: patientData.demographics.lastName,
            date_of_birth: patientData.demographics.dateOfBirth,
            gender: patientData.demographics.gender,
            phone: patientData.demographics.phone,
            email: patientData.demographics.email,
            address: patientData.demographics.address,
            insurance_member_id: patientData.insurance.memberId,
            insurance_group_number: patientData.insurance.groupNumber,
            insurance_plan_name: patientData.insurance.planName,
            active_medications: patientData.medications,
            allergies: patientData.allergies,
            diagnosis_history: patientData.diagnoses,
            last_sync_at: new Date().toISOString(),
            sync_status: 'synced'
          })
          .select()
          .single();

        if (insertError) {
        } else {
          localPatient = insertedPatient;
        }
      } catch (modmedError) {
        return res.status(404).json({ 
          error: 'Patient not found',
          message: 'Patient not found in local database or ModMed system'
        });
      }
    } else if (localError) {
      throw localError;
    }

    // Check if we need to sync with ModMed (if data is stale)
    const needsSync = localPatient && shouldSyncPatient(localPatient);
    
    if (needsSync) {
      try {
        // Fetch updated data from ModMed
        const updatedData = await integrations.getPatientData(localPatient.modmed_patient_id);
        
        // Update local database
        const { data: syncedPatient, error: syncError } = await supabase
          .from('patients')
          .update({
            first_name: updatedData.demographics.firstName,
            last_name: updatedData.demographics.lastName,
            date_of_birth: updatedData.demographics.dateOfBirth,
            gender: updatedData.demographics.gender,
            phone: updatedData.demographics.phone,
            email: updatedData.demographics.email,
            address: updatedData.demographics.address,
            insurance_member_id: updatedData.insurance.memberId,
            insurance_group_number: updatedData.insurance.groupNumber,
            insurance_plan_name: updatedData.insurance.planName,
            active_medications: updatedData.medications,
            allergies: updatedData.allergies,
            diagnosis_history: updatedData.diagnoses,
            last_sync_at: new Date().toISOString(),
            sync_status: 'synced'
          })
          .eq('id', id)
          .select()
          .single();

        if (syncError) {
        } else {
          patientData = {
            ...updatedData,
            syncedAt: new Date(),
            fromCache: false
          };
        }
      } catch (syncError) {
        // Continue with cached data
        patientData = transformLocalPatientData(localPatient);
        patientData.syncWarning = 'Data may be stale - failed to sync with ModMed';
      }
    } else {
      // Use local data
      patientData = transformLocalPatientData(localPatient);
      patientData.fromCache = true;
    }

    // Get insurance eligibility if enabled
    let eligibilityData = null;
    try {
      eligibilityData = await integrations.checkInsuranceEligibility(localPatient?.modmed_patient_id || id);
    } catch (eligibilityError) {
    }

    // Get recent authorizations for this patient
    const { data: recentAuthorizations } = await supabase
      .from('medication_authorizations')
      .select(`
        id, status, priority_level, created_at, submitted_at,
        medications(brand_name, generic_name),
        ai_confidence_score, estimated_approval_probability
      `)
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate patient risk score based on medication history and allergies
    const riskScore = calculatePatientRiskScore(patientData);

    // Log patient access for HIPAA compliance
    await auditLog({
      action: 'view_patient',
      userId,
      resource: 'patient',
      resourceId: id,
      phiAccessed: true,
      accessReason: 'Authorization processing',
      details: {
        patientName: `${patientData.demographics?.firstName} ${patientData.demographics?.lastName}`,
        syncStatus: patientData.fromCache ? 'cached' : 'live',
        eligibilityChecked: !!eligibilityData
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        patient: patientData,
        insurance: {
          eligibility: eligibilityData,
          lastChecked: eligibilityData ? new Date() : null
        },
        authorizations: {
          recent: recentAuthorizations || [],
          totalCount: recentAuthorizations?.length || 0
        },
        analytics: {
          riskScore,
          lastSync: localPatient?.last_sync_at,
          syncStatus: localPatient?.sync_status || 'unknown'
        }
      }
    });
  } catch (error) {
    throw error;
  }
}

function shouldSyncPatient(patient: any): boolean {
  if (!patient.last_sync_at) return true;
  
  const lastSync = new Date(patient.last_sync_at);
  const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
  
  // Sync if data is older than 24 hours
  return hoursSinceSync > 24;
}

function transformLocalPatientData(localPatient: any): any {
  return {
    modmedId: localPatient.modmed_patient_id,
    demographics: {
      firstName: localPatient.first_name,
      lastName: localPatient.last_name,
      dateOfBirth: localPatient.date_of_birth,
      gender: localPatient.gender,
      phone: localPatient.phone,
      email: localPatient.email,
      address: localPatient.address
    },
    insurance: {
      memberId: localPatient.insurance_member_id,
      groupNumber: localPatient.insurance_group_number,
      planName: localPatient.insurance_plan_name,
      eligibilityStatus: 'unknown' // Would need real-time check
    },
    medications: localPatient.active_medications || [],
    allergies: localPatient.allergies || [],
    diagnoses: localPatient.diagnosis_history || [],
    lastSync: localPatient.last_sync_at,
    syncStatus: localPatient.sync_status
  };
}

function calculatePatientRiskScore(patientData: any): number {
  let riskScore = 0;
  
  // Age-based risk
  const age = calculateAge(patientData.demographics?.dateOfBirth);
  if (age > 65) riskScore += 2;
  if (age < 18) riskScore += 1;
  
  // Allergy count
  const allergyCount = patientData.allergies?.length || 0;
  if (allergyCount > 5) riskScore += 3;
  else if (allergyCount > 2) riskScore += 1;
  
  // Active medication count (polypharmacy risk)
  const medicationCount = patientData.medications?.length || 0;
  if (medicationCount > 10) riskScore += 3;
  else if (medicationCount > 5) riskScore += 2;
  else if (medicationCount > 3) riskScore += 1;
  
  // Chronic conditions
  const chronicConditions = patientData.diagnoses?.filter((dx: any) => 
    dx.status === 'active' && isChronicCondition(dx.code)
  ).length || 0;
  
  if (chronicConditions > 3) riskScore += 3;
  else if (chronicConditions > 1) riskScore += 2;
  else if (chronicConditions > 0) riskScore += 1;
  
  // Cap at 10
  return Math.min(10, riskScore);
}

function calculateAge(birthDate: string | Date): number {
  if (!birthDate) return 0;
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function isChronicCondition(icdCode: string): boolean {
  // Simplified chronic condition detection
  const chronicPrefixes = [
    'E10', 'E11', // Diabetes
    'I10', 'I11', 'I12', 'I13', 'I15', // Hypertension
    'J44', // COPD
    'N18', // CKD
    'I25', // CAD
    'F20', 'F25', 'F31', 'F32', 'F33' // Mental health
  ];
  
  return chronicPrefixes.some(prefix => icdCode?.startsWith(prefix));
}

export default withAuth(handler);
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
