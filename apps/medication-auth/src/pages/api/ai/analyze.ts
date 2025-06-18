import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { AuthorizationAIService } from '../../../lib/ai/authorization-ai-service';
import { MLModelManager } from '../../../lib/ai/ml-models';
import { withAuth } from '../../../lib/auth/middleware';
import { auditLog } from '../../../lib/security/audit-logger';
import { withRateLimit, RateLimits } from '@ganger/utils';
import { supabase } from '../../../lib/supabase';

const analyzeRequestSchema = z.object({
  authorizationId: z.string().uuid().optional(),
  patient: z.object({
    id: z.string(),
    age: z.number().min(0).max(150),
    gender: z.string(),
    medicalHistory: z.array(z.string()).default([]),
    currentMedications: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([])
  }),
  medication: z.object({
    id: z.string(),
    name: z.string(),
    genericName: z.string(),
    strength: z.string(),
    formularyTier: z.number().min(1).max(5).optional(),
    requiresPriorAuth: z.boolean().default(false),
    requiresStepTherapy: z.boolean().default(false)
  }),
  insurance: z.object({
    id: z.string(),
    name: z.string(),
    planType: z.string()
  }),
  diagnosisCodes: z.array(z.string()).min(1),
  quantityRequested: z.number().positive(),
  daysSupply: z.number().positive(),
  refillsRequested: z.number().int().min(0).default(0),
  clinicalNotes: z.string().optional(),
  previousTherapies: z.array(z.string()).optional().default([]),
  contraindications: z.array(z.string()).optional().default([]),
  urgency: z.enum(['routine', 'urgent', 'emergent', 'stat']).default('routine')
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const userId = (req as any).user?.id;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return await handleAIAnalysis(req, res, userId);
  } catch (error) {
    
    await auditLog({
      action: 'ai_analysis_error',
      userId,
      resource: 'ai_analysis',
      error: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.status(500).json({ 
      error: 'AI analysis failed',
      message: process.env.NODE_ENV === 'development' ? error : 'An unexpected error occurred'
    });
  }
}

async function handleAIAnalysis(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const validation = analyzeRequestSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid request data',
      details: validation.error.errors
    });
  }

  const analysisRequest = {
    ...validation.data,
    id: crypto.randomUUID() // Add required id property
  };

  try {
    const startTime = Date.now();

    // Initialize AI services
    const aiService = new AuthorizationAIService();
    const mlManager = new MLModelManager();

    // Run comprehensive AI analysis
    const [
      aiRecommendation,
      mlAnalysis,
      formSuggestions
    ] = await Promise.all([
      // Primary AI recommendation
      aiService.analyzeAuthorizationRequest(analysisRequest),
      
      // ML model analysis
      mlManager.analyzeRequest(analysisRequest),
      
      // Form completion suggestions
      aiService.generateFormSuggestions(
        analysisRequest.patient.id,
        analysisRequest.medication.id
      )
    ]);

    const totalProcessingTime = Date.now() - startTime;

    // Compile comprehensive analysis result
    const analysisResult = {
      recommendation: {
        type: aiRecommendation.recommendationType,
        confidence: aiRecommendation.confidenceScore,
        reasoning: aiRecommendation.reasoning,
        approvalProbability: aiRecommendation.estimatedApprovalProbability || mlAnalysis.approvalPrediction.prediction,
        suggestedAlternatives: aiRecommendation.suggestedAlternatives,
        requiredDocumentation: aiRecommendation.requiredDocumentation,
        riskFactors: aiRecommendation.riskFactors || {},
        processingTimeMs: aiRecommendation.processingTimeMs,
        modelVersion: aiRecommendation.modelVersion
      },
      mlInsights: {
        approvalPrediction: {
          probability: mlAnalysis.approvalPrediction.prediction,
          confidence: mlAnalysis.approvalPrediction.confidence,
          features: mlAnalysis.approvalPrediction.features
        },
        processingTimeEstimate: {
          hours: mlAnalysis.processingTime.prediction,
          confidence: mlAnalysis.processingTime.confidence
        },
        alternatives: mlAnalysis.alternatives ? {
          recommendations: mlAnalysis.alternatives.prediction,
          confidence: mlAnalysis.alternatives.confidence
        } : null
      },
      formSuggestions: {
        diagnosisCodes: formSuggestions.diagnosisCodes,
        quantitySuggestion: formSuggestions.quantitySuggestion,
        daysSupplySuggestion: formSuggestions.daysSupplySuggestion,
        clinicalJustification: formSuggestions.clinicalJustification,
        previousTherapies: formSuggestions.previousTherapies,
        supportingDocuments: formSuggestions.supportingDocuments,
        confidence: formSuggestions.confidenceScore
      },
      insights: {
        keyFactors: identifyKeyFactors(analysisRequest, aiRecommendation, mlAnalysis),
        warningFlags: identifyWarningFlags(analysisRequest, aiRecommendation),
        opportunities: identifyOptimizationOpportunities(analysisRequest, aiRecommendation, mlAnalysis),
        nextSteps: generateNextSteps(aiRecommendation, mlAnalysis)
      },
      metadata: {
        analysisId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        totalProcessingTime,
        services: {
          aiRecommendation: true,
          mlModels: true,
          formSuggestions: true
        },
        version: '1.0.0'
      }
    };

    // Store analysis if associated with an authorization
    if (analysisRequest.authorizationId) {
      await storeAIAnalysis(analysisRequest.authorizationId, analysisResult, userId);
    }

    // Log AI analysis for audit and improvement
    await auditLog({
      action: 'ai_analysis_completed',
      userId,
      resource: 'ai_analysis',
      resourceId: analysisRequest.authorizationId,
      details: {
        patientId: analysisRequest.patient.id,
        medicationId: analysisRequest.medication.id,
        recommendation: aiRecommendation.recommendationType,
        confidence: aiRecommendation.confidenceScore,
        approvalProbability: analysisResult.recommendation.approvalProbability,
        processingTime: totalProcessingTime,
        urgency: analysisRequest.urgency
      }
    });

    return res.status(200).json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    throw error;
  }
}

function identifyKeyFactors(request: any, aiRec: any, mlAnalysis: any): string[] {
  const factors = [];

  // High-impact factors from ML model features
  const mlFeatures = mlAnalysis.approvalPrediction.features || {};
  
  if (mlFeatures.insurance_approval_rate < 0.6) {
    factors.push('Low insurance approval rate for this medication');
  }
  
  if (mlFeatures.medication_tier >= 4) {
    factors.push('High-tier medication requiring additional justification');
  }
  
  if (mlFeatures.step_therapy_compliance < 1.0) {
    factors.push('Step therapy requirements may not be fully met');
  }
  
  if (mlFeatures.previous_denials > 0) {
    factors.push('Previous authorization denials on record');
  }

  // Clinical factors from AI analysis
  if (request.patient.age > 65) {
    factors.push('Elderly patient requiring special consideration');
  }
  
  if (request.patient.allergies.length > 3) {
    factors.push('Multiple drug allergies requiring careful medication selection');
  }
  
  if (request.quantityRequested > mlFeatures.quantity_ratio * 60) {
    factors.push('Requested quantity above typical prescribing patterns');
  }

  return factors.slice(0, 5); // Return top 5 factors
}

function identifyWarningFlags(request: any, aiRec: any): string[] {
  const warnings = [];

  // Low confidence warnings
  if (aiRec.confidenceScore < 0.7) {
    warnings.push('AI analysis confidence below optimal threshold');
  }

  // Clinical warnings
  if (request.patient.currentMedications.length > 10) {
    warnings.push('Polypharmacy - patient on multiple medications');
  }

  // Authorization-specific warnings
  if (aiRec.recommendationType === 'escalate_manual_review') {
    warnings.push('Complex case requiring manual clinical review');
  }

  if (aiRec.estimatedApprovalProbability < 0.4) {
    warnings.push('Low probability of approval - consider alternatives');
  }

  return warnings;
}

function identifyOptimizationOpportunities(request: any, aiRec: any, mlAnalysis: any): string[] {
  const opportunities = [];

  // Alternative medication opportunities
  if (aiRec.suggestedAlternatives?.length > 0) {
    opportunities.push('Alternative medications available with better coverage');
  }

  // Documentation improvements
  if (aiRec.requiredDocumentation?.length > 0) {
    opportunities.push('Additional documentation could strengthen authorization');
  }

  // Timing opportunities
  if (mlAnalysis.processingTime?.prediction > 72) {
    opportunities.push('Consider urgent processing to reduce wait time');
  }

  // Cost optimization
  const mlFeatures = mlAnalysis.approvalPrediction.features || {};
  if (mlFeatures.medication_tier > 2) {
    opportunities.push('Generic or lower-tier alternatives may reduce costs');
  }

  return opportunities;
}

function generateNextSteps(aiRec: any, mlAnalysis: any): string[] {
  const steps = [];

  switch (aiRec.recommendationType) {
    case 'approve':
      steps.push('Submit authorization to insurance provider');
      steps.push('Monitor for insurance response');
      break;
      
    case 'request_more_info':
      if (aiRec.requiredDocumentation?.length > 0) {
        steps.push(`Gather required documentation: ${aiRec.requiredDocumentation.join(', ')}`);
      }
      steps.push('Complete clinical justification');
      steps.push('Re-analyze after documentation update');
      break;
      
    case 'suggest_alternative':
      steps.push('Review suggested alternative medications');
      steps.push('Discuss alternatives with patient');
      steps.push('Consider formulary-preferred options');
      break;
      
    case 'escalate_manual_review':
      steps.push('Schedule clinical review with senior provider');
      steps.push('Prepare comprehensive case documentation');
      steps.push('Consider consultation if needed');
      break;
      
    default:
      steps.push('Review AI recommendations');
      steps.push('Complete any missing information');
      steps.push('Proceed with clinical judgment');
  }

  // Add time-sensitive steps
  if (mlAnalysis.processingTime?.prediction > 96) {
    steps.unshift('Consider marking as urgent due to extended processing time');
  }

  return steps;
}

async function storeAIAnalysis(authorizationId: string, analysisResult: any, userId: string) {
  try {
    // Store the complete AI analysis for future reference
    const { error } = await supabase
      .from('ai_recommendations')
      .insert({
        authorization_id: authorizationId,
        recommendation_type: analysisResult.recommendation.type,
        confidence_score: analysisResult.recommendation.confidence,
        reasoning: analysisResult.recommendation.reasoning,
        suggested_alternatives: analysisResult.recommendation.suggestedAlternatives,
        required_documentation: analysisResult.recommendation.requiredDocumentation,
        estimated_approval_probability: analysisResult.recommendation.approvalProbability,
        processing_time_ms: analysisResult.metadata.totalProcessingTime,
        model_version: analysisResult.recommendation.modelVersion
      });

    if (error) {
    }
  } catch (error) {
  }
}

// Apply both authentication and rate limiting to AI endpoint
export default withAuth(
  withRateLimit(handler, RateLimits.AI_PROCESSING)
);
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
