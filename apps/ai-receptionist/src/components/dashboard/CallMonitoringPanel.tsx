import { useState } from 'react';
import { Badge, Button } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { CallRecord, ConversationTurn } from '@/types';

interface CallMonitoringPanelProps {
  activeCalls: CallRecord[];
  onSelectCall: (callId: string) => void;
}

export const CallMonitoringPanel = ({ activeCalls, onSelectCall }: CallMonitoringPanelProps) => {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(
    activeCalls.length > 0 && activeCalls[0] ? activeCalls[0].id : null
  );

  // Mock conversation data for demo
  const mockConversationTurns: ConversationTurn[] = [
    {
      id: '1',
      call_id: selectedCallId || '',
      turn_number: 1,
      speaker: 'ai',
      intent_detected: 'greeting',
      confidence_score: 0.95,
      user_input: '',
      ai_response: "Thank you for calling Ganger Dermatology. I'm your AI assistant. How can I help you today?",
      processing_time_ms: 150,
      sentiment_score: 0.1,
      emotion_detected: 'neutral',
      escalation_triggered: false,
      created_at: new Date(Date.now() - 180000).toISOString()
    },
    {
      id: '2',
      call_id: selectedCallId || '',
      turn_number: 2,
      speaker: 'patient',
      intent_detected: 'appointment_scheduling',
      confidence_score: 0.88,
      user_input: "Hi, I'd like to schedule an appointment for a skin check.",
      ai_response: '',
      processing_time_ms: 280,
      sentiment_score: 0.2,
      emotion_detected: 'neutral',
      escalation_triggered: false,
      created_at: new Date(Date.now() - 150000).toISOString()
    },
    {
      id: '3',
      call_id: selectedCallId || '',
      turn_number: 3,
      speaker: 'ai',
      intent_detected: 'appointment_scheduling',
      confidence_score: 0.92,
      user_input: '',
      ai_response: "I'd be happy to help you schedule a skin check appointment. Can you provide your name and date of birth so I can look up your information?",
      processing_time_ms: 320,
      sentiment_score: 0.3,
      emotion_detected: 'positive',
      escalation_triggered: false,
      created_at: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: '4',
      call_id: selectedCallId || '',
      turn_number: 4,
      speaker: 'patient',
      intent_detected: 'personal_information',
      confidence_score: 0.95,
      user_input: "Sure, my name is Sarah Johnson and my date of birth is March 15, 1985.",
      ai_response: '',
      processing_time_ms: 200,
      sentiment_score: 0.4,
      emotion_detected: 'positive',
      escalation_triggered: false,
      created_at: new Date(Date.now() - 90000).toISOString()
    },
    {
      id: '5',
      call_id: selectedCallId || '',
      turn_number: 5,
      speaker: 'ai',
      intent_detected: 'patient_verification',
      confidence_score: 0.98,
      user_input: '',
      ai_response: "Thank you, Sarah. I found your account. I see you're due for your annual skin check. Which location would work better for you - Ann Arbor or Wixom?",
      processing_time_ms: 450,
      sentiment_score: 0.5,
      emotion_detected: 'positive',
      escalation_triggered: false,
      created_at: new Date(Date.now() - 60000).toISOString()
    }
  ];

  const selectedCall = activeCalls.find(call => call.id === selectedCallId);

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'ai':
        return '🤖';
      case 'patient':
        return '👤';
      case 'staff':
        return '👨‍⚕️';
      default:
        return '💬';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-ai-confident';
    if (confidence >= 0.6) return 'text-ai-uncertain';
    return 'text-red-600';
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600';
    if (sentiment < -0.3) return 'text-red-600';
    return 'text-slate-600';
  };

  if (activeCalls.length === 0) {
    return (
      <Card title="Call Monitoring">
        <div className="text-center py-8">
          <p className="text-slate-500">No active calls to monitor</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Call Selection */}
      <Card title="Active Calls">
        <div className="space-y-3">
          {activeCalls.map((call) => (
            <div
              key={call.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedCallId === call.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => {
                setSelectedCallId(call.id);
                onSelectCall(call.id);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">
                  {call.caller_name || 'Unknown Caller'}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {call.location}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{call.caller_phone}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">
                  {new Date(call.started_at).toLocaleTimeString()}
                </span>
                {call.ai_confidence_score && (
                  <span className={`text-xs font-medium ${getConfidenceColor(call.ai_confidence_score)}`}>
                    {(call.ai_confidence_score * 100).toFixed(0)}% confidence
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversation Flow */}
      <Card title="Live Conversation" className="lg:col-span-2">
        {selectedCall ? (
          <div className="space-y-4">
            {/* Call Info Header */}
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">
                    {selectedCall.caller_name || 'Unknown Caller'}
                  </h4>
                  <p className="text-sm text-slate-600">Phone: {selectedCall.caller_phone}</p>
                  <p className="text-sm text-slate-600">Location: {selectedCall.location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    Started: {new Date(selectedCall.started_at).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-slate-600">
                    Duration: {Math.floor((Date.now() - new Date(selectedCall.started_at).getTime()) / 60000)}:
                    {Math.floor(((Date.now() - new Date(selectedCall.started_at).getTime()) % 60000) / 1000)
                      .toString().padStart(2, '0')}
                  </p>
                  {selectedCall.ai_confidence_score && (
                    <p className="text-sm text-slate-600">
                      AI Confidence: 
                      <span className={`ml-1 font-medium ${getConfidenceColor(selectedCall.ai_confidence_score)}`}>
                        {(selectedCall.ai_confidence_score * 100).toFixed(0)}%
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Conversation Turns */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mockConversationTurns.map((turn) => (
                <div
                  key={turn.id}
                  className={`conversation-turn ${turn.speaker}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-lg">
                      {getSpeakerIcon(turn.speaker)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium capitalize text-slate-700">
                          {turn.speaker === 'ai' ? 'AI Assistant' : 'Patient'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(turn.created_at).toLocaleTimeString()}
                        </span>
                        {turn.processing_time_ms && (
                          <Badge variant="outline" className="text-xs">
                            {turn.processing_time_ms}ms
                          </Badge>
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <div className="text-sm text-slate-900 mb-2">
                        {turn.speaker === 'patient' ? turn.user_input : turn.ai_response}
                      </div>
                      
                      {/* AI Analytics */}
                      {turn.speaker === 'patient' && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {turn.intent_detected && (
                            <Badge variant="outline" className="text-xs">
                              Intent: {turn.intent_detected}
                            </Badge>
                          )}
                          {turn.confidence_score && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getConfidenceColor(turn.confidence_score)}`}
                            >
                              {(turn.confidence_score * 100).toFixed(0)}% confidence
                            </Badge>
                          )}
                          {turn.sentiment_score !== undefined && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSentimentColor(turn.sentiment_score)}`}
                            >
                              {turn.sentiment_score > 0.3 ? 'Positive' :
                               turn.sentiment_score < -0.3 ? 'Negative' : 'Neutral'}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {turn.escalation_triggered && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                          ⚠️ Escalation triggered - preparing for human transfer
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Live typing indicator */}
              <div className="conversation-turn ai opacity-60">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-lg">🤖</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-slate-700">AI Assistant</span>
                      <Badge variant="outline" className="text-xs animate-pulse">
                        Processing...
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-slate-200">
              <Button variant="outline" size="sm">
                Pause Monitoring
              </Button>
              <Button variant="outline" size="sm">
                Add Note
              </Button>
              <Button variant="primary" size="sm">
                Transfer to Human
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">Select a call to monitor the conversation</p>
          </div>
        )}
      </Card>
    </div>
  );
};