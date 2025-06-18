import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { supabase } from '../../../lib/database/supabase-client';
import { AuthorizationAIService } from '../../../lib/ai/authorization-ai-service';
import { IntegrationsManager } from '../../../lib/integrations/mock-integrations-manager';
import { withAuth } from '../../../lib/auth/middleware';
import { auditLog } from '../../../lib/security/audit-logger';
import { CreateAuthorizationInput, UpdateAuthorizationInput, AuthorizationFilters } from '../../../types/authorization';

const createAuthorizationSchema = z.object({
  patientId: z.string().uuid(),
  medicationId: z.string().uuid(),
  insuranceProviderId: z.string().uuid(),
  diagnosisCodes: z.array(z.string()).min(1),
  quantityRequested: z.number().positive(),
  daysSupply: z.number().positive(),
  refillsRequested: z.number().int().min(0).optional().default(0),
  priorityLevel: z.enum(['routine', 'urgent', 'emergent', 'stat']).optional().default('routine'),
  clinicalNotes: z.string().optional(),
  previousTherapiesTried: z.array(z.string()).optional().default([]),
  contraindications: z.array(z.string()).optional().default([]),
  supportingDocumentation: z.record(z.any()).optional().default({})
});

const updateAuthorizationSchema = z.object({
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'denied', 'expired', 'cancelled', 'appealed']).optional(),
  diagnosisCodes: z.array(z.string()).optional(),
  quantityRequested: z.number().positive().optional(),
  daysSupply: z.number().positive().optional(),
  refillsRequested: z.number().int().min(0).optional(),
  priorityLevel: z.enum(['routine', 'urgent', 'emergent', 'stat']).optional(),
  clinicalNotes: z.string().optional(),
  previousTherapiesTried: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  supportingDocumentation: z.record(z.any()).optional(),
  insuranceReferenceNumber: z.string().optional(),
  pharmacyReferenceNumber: z.string().optional()
});

const listAuthorizationsSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  providerId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  medicationId: z.string().uuid().optional(),
  insuranceId: z.string().uuid().optional(),
  searchTerm: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'submitted_at', 'priority_level', 'status']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  includeRelated: z.string().optional().default('false').transform(val => val === 'true'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const userId = (req as any).user?.id;

  try {
    switch (method) {
      case 'GET':
        return await handleGetAuthorizations(req, res, userId);
      case 'POST':
        return await handleCreateAuthorization(req, res, userId);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    
    await auditLog({
      action: 'api_error',
      userId,
      resource: 'authorizations',
      error: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : 'An unexpected error occurred'
    });
  }
}

async function handleGetAuthorizations(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const validation = listAuthorizationsSchema.safeParse(req.query);
  
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid request parameters',
      details: validation.error.errors
    });
  }

  const {
    page = 1,
    limit = 20,
    status,
    priority,
    providerId,
    patientId,
    medicationId,
    insuranceId,
    searchTerm,
    sortBy = 'created_at',
    sortOrder = 'desc',
    includeRelated = false,
    startDate,
    endDate
  } = validation.data;

  try {
    // Build query with RLS policies automatically applied
    let query = supabase
      .from('medication_authorizations')
      .select(includeRelated ? `
        *,
        patients(first_name, last_name, date_of_birth),
        medications(brand_name, generic_name, strength, dosage_form),
        insurance_providers(name, plan_type),
        ai_recommendations!left(recommendation_type, confidence_score, reasoning),
        authorization_workflow_steps!left(step_name, status, assigned_to, due_date)
      ` : '*')
      .range((page - 1) * limit, page * limit - 1)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    if (status) {
      const statusArray = status.split(',');
      query = query.in('status', statusArray);
    }

    if (priority) {
      const priorityArray = priority.split(',');
      query = query.in('priority_level', priorityArray);
    }

    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (medicationId) {
      query = query.eq('medication_id', medicationId);
    }

    if (insuranceId) {
      query = query.eq('insurance_provider_id', insuranceId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Text search across multiple fields
    if (searchTerm) {
      // This would need to be implemented with full-text search or multiple OR conditions
      query = query.or(`
        insurance_reference_number.ilike.%${searchTerm}%,
        pharmacy_reference_number.ilike.%${searchTerm}%,
        clinical_notes.ilike.%${searchTerm}%
      `);
    }

    const { data: authorizations, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('medication_authorizations')
      .select('*', { count: 'exact', head: true });

    // Log access for audit
    await auditLog({
      action: 'list_authorizations',
      userId,
      resource: 'authorizations',
      details: {
        page,
        limit,
        filters: { status, priority, providerId, patientId },
        resultCount: authorizations?.length || 0
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        authorizations: authorizations || [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
          hasNext: page * limit < (totalCount || 0),
          hasPrev: page > 1
        },
        filters: {
          status: status?.split(','),
          priority: priority?.split(','),
          providerId,
          patientId,
          medicationId,
          insuranceId,
          searchTerm,
          dateRange: startDate && endDate ? { startDate, endDate } : undefined
        }
      }
    });
  } catch (error) {
    throw error;
  }
}

async function handleCreateAuthorization(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const validation = createAuthorizationSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid request data',
      details: validation.error.errors
    });
  }

  const authData = validation.data;

  try {
    // Initialize AI service and integrations
    const aiService = new AuthorizationAIService();
    const integrations = new IntegrationsManager({
      modmed: {
        baseUrl: process.env.MODMED_BASE_URL!,
        clientId: process.env.MODMED_CLIENT_ID!,
        clientSecret: process.env.MODMED_CLIENT_SECRET!,
        scope: ['patient.read', 'medication.read'],
        tokenUrl: process.env.MODMED_TOKEN_URL!
      },
      insuranceProviders: [], // Would be loaded from config
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

    // Create authorization record
    const { data: authorization, error: insertError } = await supabase
      .from('medication_authorizations')
      .insert({
        ...authData,
        provider_id: userId,
        created_by: userId,
        status: 'draft'
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Get comprehensive patient and medication data for AI analysis
    const [patientData, medicationData] = await Promise.all([
      integrations.getPatientData(authData.patientId),
      supabase
        .from('medications')
        .select('*')
        .eq('id', authData.medicationId)
        .single()
    ]);

    // Prepare authorization request for AI analysis
    const authorizationRequest = {
      id: authorization.id,
      patient: {
        id: patientData.modmedId,
        age: calculateAge(patientData.demographics.dateOfBirth),
        gender: patientData.demographics.gender,
        medicalHistory: patientData.diagnoses.map((d: any) => d.description || ''),
        currentMedications: patientData.medications.map((m: any) => m.medicationCodeableConcept?.text || ''),
        allergies: patientData.allergies
      },
      medication: {
        id: medicationData.data?.id || '',
        name: medicationData.data?.brand_name || '',
        genericName: medicationData.data?.generic_name || '',
        strength: medicationData.data?.strength || '',
        formularyTier: medicationData.data?.typical_copay_tier,
        requiresPriorAuth: medicationData.data?.requires_prior_auth || false,
        requiresStepTherapy: medicationData.data?.step_therapy_required || false
      },
      insurance: {
        id: authData.insuranceProviderId,
        name: '', // Would be fetched from insurance provider table
        planType: ''
      },
      diagnosisCodes: authData.diagnosisCodes,
      quantityRequested: authData.quantityRequested,
      daysSupply: authData.daysSupply,
      refillsRequested: authData.refillsRequested,
      clinicalNotes: authData.clinicalNotes,
      previousTherapies: authData.previousTherapiesTried,
      contraindications: authData.contraindications
    };

    // Run AI analysis
    const aiRecommendation = await aiService.analyzeAuthorizationRequest(authorizationRequest);

    // Store AI recommendation
    const { error: aiError } = await supabase
      .from('ai_recommendations')
      .insert({
        authorization_id: authorization.id,
        recommendation_type: aiRecommendation.recommendationType,
        confidence_score: aiRecommendation.confidenceScore,
        reasoning: aiRecommendation.reasoning,
        suggested_alternatives: aiRecommendation.suggestedAlternatives,
        required_documentation: aiRecommendation.requiredDocumentation,
        estimated_approval_probability: aiRecommendation.estimatedApprovalProbability,
        processing_time_ms: aiRecommendation.processingTimeMs,
        model_version: aiRecommendation.modelVersion
      });

    if (aiError) {
    }

    // Update authorization with AI insights
    const { data: updatedAuth, error: updateError } = await supabase
      .from('medication_authorizations')
      .update({
        ai_confidence_score: aiRecommendation.confidenceScore,
        ai_recommendation: aiRecommendation.recommendationType,
        ai_reasoning: aiRecommendation.reasoning,
        estimated_approval_probability: aiRecommendation.estimatedApprovalProbability
      })
      .eq('id', authorization.id)
      .select()
      .single();

    if (updateError) {
    }

    // Create initial workflow steps
    await createInitialWorkflowSteps(authorization.id, aiRecommendation);

    // Log authorization creation
    await auditLog({
      action: 'create_authorization',
      userId,
      resource: 'authorizations',
      resourceId: authorization.id,
      details: {
        patientId: authData.patientId,
        medicationId: authData.medicationId,
        aiRecommendation: aiRecommendation.recommendationType,
        aiConfidence: aiRecommendation.confidenceScore
      }
    });

    // Return created authorization with AI insights
    return res.status(201).json({
      success: true,
      data: {
        authorization: updatedAuth || authorization,
        aiRecommendation: {
          type: aiRecommendation.recommendationType,
          confidence: aiRecommendation.confidenceScore,
          reasoning: aiRecommendation.reasoning,
          approvalProbability: aiRecommendation.estimatedApprovalProbability,
          suggestedAlternatives: aiRecommendation.suggestedAlternatives,
          requiredDocumentation: aiRecommendation.requiredDocumentation
        }
      },
      message: 'Authorization created successfully with AI analysis'
    });
  } catch (error) {
    throw error;
  }
}

async function createInitialWorkflowSteps(authorizationId: string, aiRecommendation: any) {
  const steps = [
    {
      authorization_id: authorizationId,
      step_name: 'Document Collection',
      step_order: 1,
      status: 'pending',
      description: 'Gather required clinical documentation',
      ai_assisted: true,
      ai_suggestions: {
        requiredDocuments: aiRecommendation.requiredDocumentation,
        priority: aiRecommendation.recommendationType === 'request_more_info' ? 'high' : 'medium'
      }
    },
    {
      authorization_id: authorizationId,
      step_name: 'Clinical Review',
      step_order: 2,
      status: 'pending',
      description: 'Provider review of authorization request',
      ai_assisted: true,
      ai_suggestions: {
        reviewFocus: aiRecommendation.reasoning,
        approvalProbability: aiRecommendation.estimatedApprovalProbability
      }
    },
    {
      authorization_id: authorizationId,
      step_name: 'Insurance Submission',
      step_order: 3,
      status: 'pending',
      description: 'Submit authorization to insurance provider',
      ai_assisted: false
    }
  ];

  const { error } = await supabase
    .from('authorization_workflow_steps')
    .insert(steps);

  if (error) {
  }
}

function calculateAge(birthDate: string | Date): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export default withAuth(handler);
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
