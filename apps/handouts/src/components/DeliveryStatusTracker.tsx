import { useState, useEffect } from 'react';
import { Card } from '@ganger/ui-catalyst';
import { handoutsCommunication } from '../lib/communication-service';

interface DeliveryStatus {
  method: 'print' | 'email' | 'sms';
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed';
  timestamp?: string;
  details?: string;
  attempts?: number;
}

interface DeliveryStatusTrackerProps {
  handoutId: string;
  patientId: string; // Added for communication tracking
  patientName: string;
  handoutTitle: string; // Added for SMS content
  handoutUrl: string; // Added for SMS delivery
  providerName: string; // Added for SMS content
  initialStatuses: DeliveryStatus[];
  onStatusUpdate?: (statuses: DeliveryStatus[]) => void;
  onSMSDelivery?: () => void; // Callback when SMS is actually sent
}

export function DeliveryStatusTracker({ 
  handoutId,
  patientId,
  patientName,
  handoutTitle,
  handoutUrl,
  providerName,
  initialStatuses, 
  onStatusUpdate,
  onSMSDelivery
}: DeliveryStatusTrackerProps) {
  const [statuses, setStatuses] = useState<DeliveryStatus[]>(initialStatuses);

  // Handle actual SMS delivery via communication service
  const handleSMSDelivery = async () => {
    const smsStatus = statuses.find(s => s.method === 'sms');
    if (!smsStatus || smsStatus.status !== 'processing') return;

    try {
      const result = await handoutsCommunication.sendHandoutDelivery(
        patientId,
        handoutTitle,
        handoutUrl,
        providerName
      );

      setStatuses(prev => prev.map(status => {
        if (status.method === 'sms') {
          return {
            ...status,
            status: result.success ? 'sent' : 'failed',
            timestamp: new Date().toISOString(),
            details: result.error || undefined,
            attempts: (status.attempts || 0) + 1
          };
        }
        return status;
      }));

      if (result.success && onSMSDelivery) {
        onSMSDelivery();
      }

    } catch (error) {
      setStatuses(prev => prev.map(status => {
        if (status.method === 'sms') {
          return {
            ...status,
            status: 'failed',
            timestamp: new Date().toISOString(),
            details: 'SMS delivery failed - system error',
            attempts: (status.attempts || 0) + 1
          };
        }
        return status;
      }));
    }
  };

  useEffect(() => {
    // Handle actual SMS delivery when status changes to processing
    const smsStatus = statuses.find(s => s.method === 'sms');
    if (smsStatus?.status === 'processing') {
      handleSMSDelivery();
    }
  }, [statuses]);

  useEffect(() => {
    // Simulate real-time status updates (for non-SMS methods)
    const interval = setInterval(() => {
      setStatuses(prevStatuses => {
        const updated = prevStatuses.map(status => {
          // Skip SMS processing - handled by actual communication service
          if (status.method === 'sms') {
            return status;
          }

          // Simulate status progression for print and email
          if (status.status === 'pending') {
            return { ...status, status: 'processing' as const, timestamp: new Date().toISOString() };
          } else if (status.status === 'processing') {
            // Simulate success/failure
            const success = Math.random() > 0.1; // 90% success rate
            return {
              ...status,
              status: success ? 'sent' as const : 'failed' as const,
              timestamp: new Date().toISOString(),
              details: success ? undefined : 'Delivery failed - will retry',
              attempts: (status.attempts || 0) + 1
            };
          } else if (status.status === 'sent' && status.method !== 'print') {
            // Simulate delivery confirmation after a delay
            const shouldConfirm = Math.random() > 0.3; // 70% get delivery confirmation
            if (shouldConfirm) {
              return {
                ...status,
                status: 'delivered' as const,
                timestamp: new Date().toISOString(),
                details: status.method === 'email' ? 'Email opened by patient' : 'SMS received and link accessed'
              };
            }
          }
          return status;
        });

        if (onStatusUpdate) {
          onStatusUpdate(updated);
        }

        return updated;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [handoutId, onStatusUpdate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-4 h-4 border-2 border-gray-300 rounded-full animate-pulse" />
        );
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'sent':
        return (
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'delivered':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600';
      case 'processing': return 'text-blue-600';
      case 'sent': return 'text-blue-600';
      case 'delivered': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'print':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        );
      case 'email':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'sms':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Delivery Status</h3>
        <p className="text-sm text-gray-600">
          Handouts for {patientName} • ID: {handoutId}
        </p>
      </div>

      <div className="space-y-4">
        {statuses.map((delivery, index) => (
          <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-gray-400">
                {getMethodIcon(delivery.method)}
              </div>
              <div className="capitalize font-medium text-gray-900">
                {delivery.method}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(delivery.status)}
                <span className={`text-sm font-medium capitalize ${getStatusColor(delivery.status)}`}>
                  {delivery.status}
                </span>
                {delivery.timestamp && (
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(delivery.timestamp)}
                  </span>
                )}
              </div>
              
              {delivery.details && (
                <p className="text-sm text-gray-600 mt-1">
                  {delivery.details}
                </p>
              )}
              
              {delivery.attempts && delivery.attempts > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Attempt {delivery.attempts}
                </p>
              )}
            </div>
            
            {delivery.status === 'failed' && (
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Retry
              </button>
            )}
          </div>
        ))}
      </div>
      
      {statuses.every(s => ['delivered', 'failed'].includes(s.status)) && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            All delivery attempts completed. Patient has been notified via all selected methods.
          </p>
        </div>
      )}
    </Card>
  );
}