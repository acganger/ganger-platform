import { NextApiRequest, NextApiResponse } from 'next';
import { MockAIEngine } from '@/lib/mock-ai-engine';
import { CallRecord } from '@/types';

/**
 * Handle incoming call webhook from 3CX VoIP system
 * This endpoint would be called when a new call comes in
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In production, this would verify the webhook signature from 3CX
    const { call_id, caller_phone, caller_name, location } = req.body;

    if (!call_id || !caller_phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: call_id, caller_phone' 
      });
    }

    // Create new call record
    const newCall: CallRecord = {
      id: `call_${Date.now()}`,
      call_id,
      caller_phone,
      caller_name: caller_name || null,
      call_direction: 'inbound',
      call_status: 'active',
      location: location || 'Ann Arbor',
      started_at: new Date().toISOString(),
      ai_handled: true,
      ai_confidence_score: 0.85,
      escalation_required: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Initialize AI engine for this call
    const aiEngine = new MockAIEngine();
    
    // Generate initial AI greeting with employee detection
    const initialResponse = await aiEngine.processConversationTurnWithCallerID(
      '', // Empty input for greeting
      [], // No conversation history
      caller_phone, // Caller phone for employee lookup
      null // No patient context yet
    );

    // In production, this would:
    // 1. Save call record to database
    // 2. Initialize real AI conversation
    // 3. Send initial greeting via voice synthesis
    // 4. Set up real-time monitoring

    console.log('📞 New inbound call:', {
      call_id,
      caller_phone,
      location,
      ai_greeting: initialResponse.response_text
    });

    res.status(200).json({
      success: true,
      call_record: newCall,
      ai_response: initialResponse,
      message: 'Call initialized successfully'
    });

  } catch (error) {
    console.error('Error handling inbound call:', error);
    res.status(500).json({ 
      error: 'Failed to process inbound call',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}