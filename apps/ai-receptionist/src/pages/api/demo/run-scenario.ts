import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@ganger/auth/server';
import { MockAIEngine } from '@/lib/mock-ai-engine';
import { CallRecord, ConversationTurn } from '@/types';

/**
 * Run a demo scenario end-to-end
 * This simulates the complete AI conversation flow
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

    const { scenario_id, scenario } = req.body;

    if (!scenario_id || !scenario) {
      return res.status(400).json({ 
        error: 'Missing required fields: scenario_id, scenario' 
      });
    }

    console.log('🎭 Running demo scenario:', scenario.name);

    // Create mock call record
    const callRecord: CallRecord = {
      id: `demo_call_${Date.now()}`,
      call_id: `demo_3cx_${scenario_id}`,
      caller_phone: scenario.caller_phone,
      caller_name: scenario.patient_name,
      call_direction: 'inbound',
      call_status: 'active',
      location: scenario.location,
      started_at: new Date().toISOString(),
      ai_handled: true,
      ai_confidence_score: 0.85,
      escalation_required: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Initialize AI engine
    const aiEngine = new MockAIEngine();
    const conversationTurns: ConversationTurn[] = [];
    let shouldEscalate = false;
    let escalationReason = '';

    // Process each turn in the scenario
    for (let i = 0; i < scenario.conversation_script.length; i++) {
      const scriptTurn = scenario.conversation_script[i];
      
      if (scriptTurn.speaker === 'patient') {
        // Process patient input with AI (use caller ID detection for employee scenarios)
        const aiResponse = scenario.scenario_type === 'employee_recognition' 
          ? await aiEngine.processConversationTurnWithCallerID(
              scriptTurn.text,
              conversationTurns,
              scenario.caller_phone,
              aiEngine.getMockPatientData('patient_001')
            )
          : await aiEngine.processConversationTurn(
              scriptTurn.text,
              conversationTurns,
              aiEngine.getMockPatientData('patient_001')
            );

        // Create patient turn
        const patientTurn: ConversationTurn = {
          id: `demo_turn_${Date.now()}_${i}_patient`,
          call_id: callRecord.id,
          turn_number: i + 1,
          speaker: 'patient',
          intent_detected: scriptTurn.intent || aiResponse.intent_detected,
          confidence_score: scriptTurn.confidence || aiResponse.confidence_score,
          user_input: scriptTurn.text,
          processing_time_ms: aiResponse.processing_time_ms,
          sentiment_score: aiResponse.sentiment_score,
          emotion_detected: aiResponse.emotion_detected,
          escalation_triggered: scriptTurn.should_escalate || aiResponse.escalation_required,
          created_at: new Date().toISOString()
        };

        conversationTurns.push(patientTurn);

        // Check for escalation
        if (scriptTurn.should_escalate || aiResponse.escalation_required) {
          shouldEscalate = true;
          escalationReason = aiResponse.escalation_reason || 'Scenario-triggered escalation';
        }

        // Create AI response turn (if not escalating)
        if (!shouldEscalate && i + 1 < scenario.conversation_script.length) {
          const nextScriptTurn = scenario.conversation_script[i + 1];
          
          const aiTurn: ConversationTurn = {
            id: `demo_turn_${Date.now()}_${i}_ai`,
            call_id: callRecord.id,
            turn_number: i + 2,
            speaker: 'ai',
            ai_response: nextScriptTurn?.speaker === 'ai' ? nextScriptTurn.text : aiResponse.response_text,
            processing_time_ms: aiResponse.processing_time_ms,
            escalation_triggered: false,
            created_at: new Date().toISOString()
          };

          conversationTurns.push(aiTurn);
        }
      }

      // Add small delay to simulate realistic conversation timing
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Update call record with final status
    const finalCallRecord: CallRecord = {
      ...callRecord,
      call_status: shouldEscalate ? 'transferred' : 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: Math.floor(conversationTurns.length * 15), // Estimate 15s per turn
      resolution_type: shouldEscalate ? 'transferred' : 'resolved',
      transfer_reason: shouldEscalate ? escalationReason : undefined,
      escalation_required: shouldEscalate,
      patient_satisfaction_score: shouldEscalate ? 4 : 5,
      quality_score: shouldEscalate ? 75.0 : 95.0,
      updated_at: new Date().toISOString()
    };

    // Simulate Communication Hub integration for escalation
    if (shouldEscalate) {
      console.log('🚨 Demo scenario triggered escalation:', escalationReason);
      
      // In production, this would trigger real Communication Hub:
      // await communicationHub.sendStaffAlert({
      //   staff_ids: ['demo_manager'],
      //   alert_type: 'demo_escalation',
      //   message: `Demo scenario "${scenario.name}" escalated: ${escalationReason}`,
      //   action_required: true,
      //   priority: scenario.scenario_type === 'emergency' ? 'high' : 'medium'
      // });
    }

    console.log('✅ Demo scenario completed:', {
      scenario_name: scenario.name,
      turns_processed: conversationTurns.length,
      escalated: shouldEscalate,
      duration: finalCallRecord.duration_seconds
    });

    res.status(200).json({
      success: true,
      scenario_id,
      scenario_name: scenario.name,
      call_record: finalCallRecord,
      conversation_turns: conversationTurns,
      escalation_triggered: shouldEscalate,
      escalation_reason: shouldEscalate ? escalationReason : null,
      expected_outcome: scenario.expected_outcome,
      actual_outcome: shouldEscalate ? 
        `AI escalated to human staff: ${escalationReason}` : 
        'AI successfully resolved without escalation',
      performance_metrics: {
        total_turns: conversationTurns.length,
        ai_turns: conversationTurns.filter(t => t.speaker === 'ai').length,
        patient_turns: conversationTurns.filter(t => t.speaker === 'patient').length,
        avg_confidence: conversationTurns
          .filter(t => t.confidence_score)
          .reduce((sum, t) => sum + (t.confidence_score || 0), 0) / 
          conversationTurns.filter(t => t.confidence_score).length,
        processing_time_total: conversationTurns
          .reduce((sum, t) => sum + (t.processing_time_ms || 0), 0)
      }
    });

  } catch (error) {
    console.error('Error running demo scenario:', error);
    res.status(500).json({ 
      error: 'Failed to run demo scenario',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}