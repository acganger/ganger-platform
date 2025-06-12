import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { supabase } from '../../../lib/database/supabase-client';
import { AuthorizationAIService } from '../../../lib/ai/authorization-ai-service';
import { IntegrationsManager } from '../../../lib/integrations/mock-integrations-manager';
import { withAuth } from '../../../lib/auth/middleware';
import { auditLog } from '../../../lib/security/audit-logger';

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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;
  const userId = (req as any).user?.id;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Authorization ID is required' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGetAuthorization(req, res, id, userId);
      case 'PUT':
        return await handleUpdateAuthorization(req, res, id, userId);
      case 'DELETE':
        return await handleDeleteAuthorization(req, res, id, userId);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    
    await auditLog({
      action: 'api_error',
      userId,
      resource: 'authorization',
      resourceId: id,
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

async function handleGetAuthorization(req: NextApiRequest, res: NextApiResponse, id: string, userId: string) {
  const { include } = req.query;
  const includeRelated = include === 'all' || include === 'true';

  try {
    // Fetch authorization with related data if requested
    const query = supabase
      .from('medication_authorizations')
      .select(includeRelated ? `
        *,
        patients(
          id, modmed_patient_id, first_name, last_name, 
          date_of_birth, gender, phone, email,
          insurance_member_id, insurance_group_number,
          active_medications, allergies, diagnosis_history
        ),
        medications(
          id, ndc_number, brand_name, generic_name, strength, 
          dosage_form, manufacturer, therapeutic_class,
          requires_prior_auth, step_therapy_required,
          contraindications, drug_interactions
        ),
        insurance_providers(
          id, name, plan_type, formulary_tier,
          prior_auth_requirements, processing_time_hours
        ),
        ai_recommendations(
          id, recommendation_type, confidence_score, reasoning,
          suggested_alternatives, required_documentation,
          estimated_approval_probability, processing_time_ms,
          model_version, created_at
        ),
        authorization_workflow_steps(
          id, step_name, step_order, status, assigned_to,
          due_date, started_at, completed_at, description,
          notes, ai_assisted, ai_suggestions, created_at, updated_at
        ),
        authorization_communications(
          id, communication_type, direction, subject, content,
          insurance_reference_number, response_required,
          response_due_date, created_at, created_by
        )
      ` : '*')
      .eq('id', id);

    const { data: authorization, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Authorization not found' });
      }
      throw error;
    }

    // Log access for audit
    await auditLog({
      action: 'view_authorization',
      userId,
      resource: 'authorization',
      resourceId: id,
      details: {
        includeRelated,
        patientId: (authorization as any)?.patient_id
      }
    });

    // Calculate additional metrics if this is a detailed view
    let additionalData = {};
    if (includeRelated) {
      additionalData = await calculateAuthorizationMetrics(authorization);
    }

    return res.status(200).json({
      success: true,
      data: {
        authorization,
        ...additionalData
      }
    });
  } catch (error) {
    throw error;
  }
}

async function handleUpdateAuthorization(req: NextApiRequest, res: NextApiResponse, id: string, userId: string) {
  const validation = updateAuthorizationSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid request data',
      details: validation.error.errors
    });
  }

  const updateData = validation.data;

  try {
    // Get current authorization for audit trail
    const { data: currentAuth, error: fetchError } = await supabase
      .from('medication_authorizations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Authorization not found' });
      }
      throw fetchError;
    }

    // Check if status change requires special handling
    const statusChanged = updateData.status && updateData.status !== currentAuth.status;
    let statusChangeData = {};

    if (statusChanged) {
      statusChangeData = await handleStatusChange(id, currentAuth.status, updateData.status!, userId);
    }

    // Prepare update data with timestamps
    const updatePayload = {
      ...updateData,
      updated_by: userId,
      updated_at: new Date().toISOString(),
      ...statusChangeData
    };

    // Update authorization
    const { data: updatedAuth, error: updateError } = await supabase
      .from('medication_authorizations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update workflow steps if status changed
    if (statusChanged) {
      await updateWorkflowProgress(id, updateData.status!);
    }

    // Log the update
    await auditLog({
      action: 'update_authorization',
      userId,
      resource: 'authorization',
      resourceId: id,
      oldValues: currentAuth,
      newValues: updatePayload,
      details: {
        changedFields: Object.keys(updateData),
        statusChanged,
        newStatus: updateData.status
      }
    });

    // Re-analyze with AI if significant changes were made
    if (await shouldTriggerAIReanalysis(updateData)) {
      await triggerAIReanalysis(id, updatedAuth, userId);
    }

    return res.status(200).json({
      success: true,
      data: {
        authorization: updatedAuth,
        statusChanged,
        message: statusChanged ? `Status updated to ${updateData.status}` : 'Authorization updated successfully'
      }
    });
  } catch (error) {
    throw error;
  }
}

async function handleDeleteAuthorization(req: NextApiRequest, res: NextApiResponse, id: string, userId: string) {
  try {
    // Check if authorization exists and get current status
    const { data: authorization, error: fetchError } = await supabase
      .from('medication_authorizations')
      .select('status, patient_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Authorization not found' });
      }
      throw fetchError;
    }

    // Check if deletion is allowed based on status
    const deletableStatuses = ['draft', 'cancelled'];
    if (!deletableStatuses.includes(authorization.status)) {
      return res.status(400).json({
        error: 'Cannot delete authorization',
        message: `Authorizations with status '${authorization.status}' cannot be deleted. Only draft and cancelled authorizations can be deleted.`
      });
    }

    // Soft delete by updating status to cancelled instead of hard delete
    const { error: updateError } = await supabase
      .from('medication_authorizations')
      .update({
        status: 'cancelled',
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Log the deletion
    await auditLog({
      action: 'delete_authorization',
      userId,
      resource: 'authorization',
      resourceId: id,
      details: {
        originalStatus: authorization.status,
        patientId: authorization.patient_id,
        deletionReason: 'User-initiated deletion'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Authorization cancelled successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function handleStatusChange(authId: string, oldStatus: string, newStatus: string, userId: string) {
  const statusData: any = {};
  
  switch (newStatus) {
    case 'submitted':
      statusData.submitted_at = new Date().toISOString();
      break;
    case 'approved':
      statusData.approved_at = new Date().toISOString();
      break;
    case 'denied':
      statusData.denied_at = new Date().toISOString();
      break;
  }

  // Create communication log for status change
  await supabase
    .from('authorization_communications')
    .insert({
      authorization_id: authId,
      communication_type: 'portal',
      direction: 'outbound',
      subject: `Authorization Status Changed: ${oldStatus} → ${newStatus}`,
      content: `Authorization status updated from ${oldStatus} to ${newStatus} by user ${userId}`,
      created_by: userId
    });

  return statusData;
}

async function updateWorkflowProgress(authId: string, newStatus: string) {
  // Update workflow steps based on status
  const statusWorkflowMap: Record<string, string> = {
    'submitted': 'Insurance Submission',
    'under_review': 'Insurance Review', 
    'approved': 'Approval Processing',
    'denied': 'Denial Processing'
  };

  const targetStep = statusWorkflowMap[newStatus];
  if (targetStep) {
    await supabase
      .from('authorization_workflow_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('authorization_id', authId)
      .eq('step_name', targetStep);
  }
}

async function shouldTriggerAIReanalysis(updateData: any): Promise<boolean> {
  // Trigger AI reanalysis if significant clinical data changed
  const significantFields = [
    'diagnosisCodes',
    'quantityRequested', 
    'daysSupply',
    'clinicalNotes',
    'previousTherapiesTried',
    'contraindications'
  ];

  return significantFields.some(field => updateData[field] !== undefined);
}

async function triggerAIReanalysis(authId: string, authorization: any, userId: string) {
  try {
    const aiService = new AuthorizationAIService();
    
    // Prepare authorization request for AI reanalysis
    const authRequest = {
      id: authId,
      patient: {
        id: authorization.patient_id,
        age: 0, // Would need to calculate from patient data
        gender: '',
        medicalHistory: [],
        currentMedications: [],
        allergies: []
      },
      medication: {
        id: authorization.medication_id,
        name: '',
        genericName: '',
        strength: '',
        requiresPriorAuth: false,
        requiresStepTherapy: false
      },
      insurance: {
        id: authorization.insurance_provider_id,
        name: '',
        planType: ''
      },
      diagnosisCodes: authorization.diagnosis_codes || [],
      quantityRequested: authorization.quantity_requested,
      daysSupply: authorization.days_supply,
      refillsRequested: authorization.refills_requested || 0,
      clinicalNotes: authorization.clinical_notes,
      previousTherapies: authorization.previous_therapies_tried || [],
      contraindications: authorization.contraindications || []
    };

    // Run AI analysis
    const aiRecommendation = await aiService.analyzeAuthorizationRequest(authRequest);

    // Store new AI recommendation
    await supabase
      .from('ai_recommendations')
      .insert({
        authorization_id: authId,
        recommendation_type: aiRecommendation.recommendationType,
        confidence_score: aiRecommendation.confidenceScore,
        reasoning: aiRecommendation.reasoning,
        suggested_alternatives: aiRecommendation.suggestedAlternatives,
        required_documentation: aiRecommendation.requiredDocumentation,
        estimated_approval_probability: aiRecommendation.estimatedApprovalProbability,
        processing_time_ms: aiRecommendation.processingTimeMs,
        model_version: aiRecommendation.modelVersion
      });

    // Update authorization with new AI insights
    await supabase
      .from('medication_authorizations')
      .update({
        ai_confidence_score: aiRecommendation.confidenceScore,
        ai_recommendation: aiRecommendation.recommendationType,
        ai_reasoning: aiRecommendation.reasoning,
        estimated_approval_probability: aiRecommendation.estimatedApprovalProbability
      })
      .eq('id', authId);

  } catch (error) {
    // Don't throw error - this is a background enhancement
  }
}

async function calculateAuthorizationMetrics(authorization: any) {
  try {
    // Calculate time in current status
    const timeInStatus = authorization.updated_at 
      ? Date.now() - new Date(authorization.updated_at).getTime()
      : 0;

    // Get workflow completion percentage
    const totalSteps = authorization.authorization_workflow_steps?.length || 0;
    const completedSteps = authorization.authorization_workflow_steps?.filter(
      (step: any) => step.status === 'completed'
    ).length || 0;
    const workflowProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    // Calculate estimated completion date based on progress and processing time
    const avgProcessingTime = authorization.insurance_providers?.processing_time_hours || 72;
    const estimatedCompletion = new Date(
      Date.now() + (avgProcessingTime * 60 * 60 * 1000)
    );

    // Count communications
    const communicationCount = authorization.authorization_communications?.length || 0;
    const pendingResponses = authorization.authorization_communications?.filter(
      (comm: any) => comm.response_required && !comm.response_received_at
    ).length || 0;

    return {
      metrics: {
        timeInCurrentStatus: Math.floor(timeInStatus / (1000 * 60 * 60)), // hours
        workflowProgress: Math.round(workflowProgress),
        estimatedCompletionDate: estimatedCompletion,
        communicationCount,
        pendingResponses,
        aiConfidence: authorization.ai_confidence_score || 0,
        approvalProbability: authorization.estimated_approval_probability || 0
      }
    };
  } catch (error) {
    return { metrics: {} };
  }
}

export default withAuth(handler);