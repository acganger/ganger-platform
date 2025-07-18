import { useState } from 'react';
import { Button, Badge } from '@ganger/ui';
import { Modal } from '@ganger/ui-catalyst';
import { CallRecord, LiveCallUpdate } from '@/types';

interface ActiveCallsGridProps {
  calls: CallRecord[];
  liveUpdates: LiveCallUpdate[];
  onTransferCall: (callId: string, reason: string) => void;
  onEmergencyEscalate: (callId: string) => void;
}

export const ActiveCallsGrid = ({
  calls,
  liveUpdates,
  onTransferCall,
  onEmergencyEscalate
}: ActiveCallsGridProps) => {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferReason, setTransferReason] = useState('');

  const getCallUpdate = (callId: string) => {
    return liveUpdates.find(update => update.call_id === callId);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.6) return 'confidence-medium';
    return 'confidence-low';
  };

  const getStatusIndicator = (call: CallRecord) => {
    if (call.call_status === 'active') return 'status-active';
    if (call.call_status === 'transferred') return 'status-transferred';
    return 'status-completed';
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
  };

  const activeCalls = calls.filter(call => call.call_status === 'active');

  if (activeCalls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Active Calls</h3>
        <p className="text-slate-500">All calls are currently handled. New calls will appear here in real-time.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeCalls.map((call) => {
          const liveUpdate = getCallUpdate(call.id);
          const confidence = liveUpdate?.ai_confidence || call.ai_confidence_score || 0.5;
          
          return (
            <div key={call.id} className={`call-card active`}>
              {/* Call Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`status-indicator ${getStatusIndicator(call)}`} />
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {call.caller_name || 'Unknown Caller'}
                    </h4>
                    <p className="text-sm text-slate-500">{call.caller_phone}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {call.location}
                </Badge>
              </div>

              {/* AI Status */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">AI Confidence</span>
                  <span className={`confidence-indicator ${getConfidenceColor(confidence)}`}>
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
                
                {liveUpdate?.intent && (
                  <div className="text-sm text-slate-600">
                    Intent: <span className="font-medium">{liveUpdate.intent}</span>
                  </div>
                )}
                
                {liveUpdate?.sentiment !== undefined && (
                  <div className="text-sm text-slate-600">
                    Sentiment: <span className={`font-medium ${
                      liveUpdate.sentiment > 0.3 ? 'text-green-600' : 
                      liveUpdate.sentiment < -0.3 ? 'text-red-600' : 'text-slate-600'
                    }`}>
                      {liveUpdate.sentiment > 0.3 ? 'Positive' :
                       liveUpdate.sentiment < -0.3 ? 'Negative' : 'Neutral'}
                    </span>
                  </div>
                )}
              </div>

              {/* Call Duration */}
              <div className="mb-4">
                <div className="text-sm text-slate-600">
                  Duration: <span className="font-medium">{formatDuration(call.started_at)}</span>
                </div>
                {liveUpdate?.current_turn && (
                  <div className="text-sm text-slate-600">
                    Turn: <span className="font-medium">{liveUpdate.current_turn}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedCall(call)}
                >
                  Monitor
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedCall(call);
                    setTransferModalOpen(true);
                  }}
                >
                  Transfer
                </Button>
                {confidence < 0.6 && (
                  <Button
                    size="sm"
                    className="emergency-transfer"
                    onClick={() => onEmergencyEscalate(call.id)}
                  >
                    Emergency
                  </Button>
                )}
              </div>

              {/* Recent Activity */}
              {liveUpdate?.last_activity && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    Last activity: {new Date(liveUpdate.last_activity).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transfer Modal */}
      <Modal
        open={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setSelectedCall(null);
          setTransferReason('');
        }}
      >
        {selectedCall && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transfer Call</h3>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">
                Transfer call from {selectedCall.caller_name || 'Unknown Caller'}
              </h4>
              <p className="text-sm text-slate-600">
                Phone: {selectedCall.caller_phone} | Location: {selectedCall.location}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Transfer Reason
              </label>
              <select
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select reason...</option>
                <option value="medical_question">Medical Question</option>
                <option value="complex_scheduling">Complex Scheduling</option>
                <option value="billing_inquiry">Billing Inquiry</option>
                <option value="customer_escalation">Customer Escalation</option>
                <option value="technical_issue">Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setTransferModalOpen(false);
                  setSelectedCall(null);
                  setTransferReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!transferReason}
                onClick={() => {
                  if (selectedCall && transferReason) {
                    onTransferCall(selectedCall.id, transferReason);
                    setTransferModalOpen(false);
                    setSelectedCall(null);
                    setTransferReason('');
                  }
                }}
              >
                Transfer Call
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};