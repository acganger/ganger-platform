import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@ganger/auth/server';
import { MockAIEngine } from '@/lib/mock-ai-engine';
import { ConversationTurn } from '@/types';

/**
 * Process a conversation turn with the AI engine
 * This endpoint handles real-time AI conversation processing
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      call_id, 
      user_input, 
      conversation_history = [], 
      patient_context = null,
      caller_phone = null 
    } = req.body;

    if (!call_id || !user_input) {
      return res.status(400).json({ 
        error: 'Missing required fields: call_id, user_input' 
      });
    }

    // Initialize AI engine
    const aiEngine = new MockAIEngine();

    // Process the conversation turn with employee detection if caller_phone provided
    const aiResponse = caller_phone 
      ? await aiEngine.processConversationTurnWithCallerID(
          user_input,
          conversation_history,
          caller_phone,
          patient_context
        )
      : await aiEngine.processConversationTurn(
          user_input,
          conversation_history,
          patient_context
        );

    // Create conversation turn records
    const userTurn: ConversationTurn = {
      id: `turn_${Date.now()}_user`,
      call_id,
      turn_number: conversation_history.length + 1,
      speaker: 'patient',
      intent_detected: aiResponse.intent_detected,
      confidence_score: aiResponse.confidence_score,
      user_input,
      processing_time_ms: aiResponse.processing_time_ms,
      sentiment_score: aiResponse.sentiment_score,
      emotion_detected: aiResponse.emotion_detected,
      escalation_triggered: aiResponse.escalation_required,
      created_at: new Date().toISOString()
    };

    const aiTurn: ConversationTurn = {
      id: `turn_${Date.now()}_ai`,
      call_id,
      turn_number: conversation_history.length + 2,
      speaker: 'ai',
      ai_response: aiResponse.response_text,
      processing_time_ms: aiResponse.processing_time_ms,
      escalation_triggered: aiResponse.escalation_required,
      created_at: new Date().toISOString()
    };

    // In production, this would:
    // 1. Save conversation turns to database
    // 2. Update call record with latest AI confidence
    // 3. Trigger escalation workflow if needed
    // 4. Send real-time updates to monitoring dashboard
    // 5. Convert AI response to speech synthesis

    console.log('🤖 AI Conversation processed:', {
      call_id,
      intent: aiResponse.intent_detected,
      confidence: aiResponse.confidence_score,
      escalation_required: aiResponse.escalation_required,
      processing_time: aiResponse.processing_time_ms
    });

    // Simulate escalation logic
    if (aiResponse.escalation_required) {
      // In production, this would trigger the Communication Hub
      console.log('🚨 Escalation triggered for call:', call_id);
      
      // Example integration with Communication Hub:
      // await communicationHub.sendStaffAlert({
      //   staff_ids: ['manager_id'],
      //   alert_type: 'call_escalation',
      //   message: `Call ${call_id} requires immediate attention`,
      //   action_required: true,
      //   priority: 'high'
      // });
    }

    res.status(200).json({
      success: true,
      ai_response: aiResponse,
      conversation_turns: [userTurn, aiTurn],
      escalation_triggered: aiResponse.escalation_required,
      suggested_actions: aiResponse.suggested_actions || []
    });

  } catch (error) {
    console.error('Error processing conversation:', error);
    res.status(500).json({ 
      error: 'Failed to process conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}