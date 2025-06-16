import { MockAIEngine } from './mock-ai-engine';
import { ConversationTurn, CallRecord } from '@/types';

/**
 * Client-side AI Conversation Service
 * Replaces API routes for static export compatibility
 */
export class AIConversationService {
  private aiEngine: MockAIEngine;

  constructor() {
    this.aiEngine = new MockAIEngine();
  }

  /**
   * Process a conversation turn with the AI engine
   * Replaces /api/ai-engine/conversation endpoint
   */
  async processConversation({
    call_id,
    user_input,
    conversation_history = [],
    patient_context = null,
    caller_phone = null
  }: {
    call_id: string;
    user_input: string;
    conversation_history: ConversationTurn[];
    patient_context?: any;
    caller_phone?: string | null;
  }) {
    try {
      if (!call_id || !user_input) {
        throw new Error('Missing required fields: call_id, user_input');
      }

      // Process the conversation turn with employee detection if caller_phone provided
      const aiResponse = caller_phone 
        ? await this.aiEngine.processConversationTurnWithCallerID(
            user_input,
            conversation_history,
            caller_phone,
            patient_context
          )
        : await this.aiEngine.processConversationTurn(
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

      console.log('🤖 AI Conversation processed:', {
        call_id,
        intent: aiResponse.intent_detected,
        confidence: aiResponse.confidence_score,
        escalation_required: aiResponse.escalation_required,
        processing_time: aiResponse.processing_time_ms
      });

      // Simulate escalation logic
      if (aiResponse.escalation_required) {
        console.log('🚨 Escalation triggered for call:', call_id);
        // In production, this would trigger the Communication Hub
      }

      return {
        success: true,
        ai_response: aiResponse,
        conversation_turns: [userTurn, aiTurn],
        escalation_triggered: aiResponse.escalation_required,
        suggested_actions: aiResponse.suggested_actions || []
      };

    } catch (error) {
      console.error('Error processing conversation:', error);
      throw new Error(`Failed to process conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle incoming call initialization
   * Replaces /api/calls/inbound endpoint
   */
  async handleInboundCall({
    call_id,
    caller_phone,
    caller_name,
    location
  }: {
    call_id: string;
    caller_phone: string;
    caller_name?: string;
    location?: string;
  }) {
    try {
      if (!call_id || !caller_phone) {
        throw new Error('Missing required fields: call_id, caller_phone');
      }

      // Create new call record
      const newCall: CallRecord = {
        id: `call_${Date.now()}`,
        call_id,
        caller_phone,
        caller_name: caller_name || undefined,
        call_direction: 'inbound',
        call_status: 'active',
        location: (location as 'Ann Arbor' | 'Wixom' | 'Plymouth') || 'Ann Arbor',
        started_at: new Date().toISOString(),
        ai_handled: true,
        ai_confidence_score: 0.85,
        escalation_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Generate initial AI greeting with employee detection
      const initialResponse = await this.aiEngine.processConversationTurnWithCallerID(
        '', // Empty input for greeting
        [], // No conversation history
        caller_phone, // Caller phone for employee lookup
        null // No patient context yet
      );

      console.log('📞 New inbound call:', {
        call_id,
        caller_phone,
        location,
        ai_greeting: initialResponse.response_text
      });

      return {
        success: true,
        call_record: newCall,
        ai_response: initialResponse,
        message: 'Call initialized successfully'
      };

    } catch (error) {
      console.error('Error handling inbound call:', error);
      throw new Error(`Failed to process inbound call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle call transfer
   * Replaces /api/calls/transfer endpoint
   */
  async handleCallTransfer({
    call_id,
    transfer_to,
    reason
  }: {
    call_id: string;
    transfer_to: string;
    reason?: string;
  }) {
    try {
      if (!call_id || !transfer_to) {
        throw new Error('Missing required fields: call_id, transfer_to');
      }

      console.log('📞 Call transfer request:', {
        call_id,
        transfer_to,
        reason
      });

      // In production, this would trigger actual call transfer
      return {
        success: true,
        message: `Call ${call_id} transferred to ${transfer_to}`,
        transfer_time: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error transferring call:', error);
      throw new Error(`Failed to transfer call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run demo scenario
   * Replaces /api/demo/run-scenario endpoint
   */
  async runDemoScenario({
    scenario_type
  }: {
    scenario_type: string;
  }) {
    try {
      console.log('🎭 Running demo scenario:', scenario_type);

      // Generate demo conversation based on scenario
      const demoResponse = await this.aiEngine.processConversationTurn(
        `Demo scenario: ${scenario_type}`,
        [],
        null
      );

      return {
        success: true,
        scenario_type,
        demo_response: demoResponse,
        message: `Demo scenario "${scenario_type}" completed successfully`
      };

    } catch (error) {
      console.error('Error running demo scenario:', error);
      throw new Error(`Failed to run demo scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const aiConversationService = new AIConversationService();