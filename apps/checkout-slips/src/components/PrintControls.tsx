'use client'

import { useState } from 'react';
import { 
  Button, 
  LoadingSpinner, 
  Badge,
  Alert,
  AlertDescription
} from '@ganger/ui';
import { Printer, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { SlipData } from '../types';

interface PrintControlsProps {
  slipData: SlipData;
  printerId: string;
  onPrintSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PrintControls({ 
  slipData, 
  printerId, 
  onPrintSuccess,
  onError 
}: PrintControlsProps) {
  const [printing, setPrinting] = useState(false);
  const [lastPrintResult, setLastPrintResult] = useState<{
    success: boolean;
    message: string;
    jobId?: string;
  } | null>(null);

  const handlePrint = async () => {
    if (!printerId) {
      onError?.('No printer selected');
      return;
    }

    if (!slipData.patient || !slipData.provider) {
      onError?.('Patient and provider must be selected');
      return;
    }

    setPrinting(true);
    setLastPrintResult(null);

    try {
      const response = await fetch('/api/print/slip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slipData,
          printerId,
          metadata: {
            printedBy: 'current-user', // This would come from auth context
            printedAt: new Date().toISOString(),
            location: slipData.location
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Print request failed');
      }

      setLastPrintResult({
        success: true,
        message: `Print job submitted successfully`,
        jobId: result.data.jobId
      });

      onPrintSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown print error';
      setLastPrintResult({
        success: false,
        message: errorMessage
      });
      onError?.(errorMessage);
    } finally {
      setPrinting(false);
    }
  };

  const handleTestPrint = async () => {
    if (!printerId) {
      onError?.('No printer selected');
      return;
    }

    setPrinting(true);
    
    try {
      const response = await fetch('/api/print/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Test print failed');
      }

      setLastPrintResult({
        success: true,
        message: 'Test print sent successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test print failed';
      setLastPrintResult({
        success: false,
        message: errorMessage
      });
      onError?.(errorMessage);
    } finally {
      setPrinting(false);
    }
  };

  const canPrint = slipData.patient && slipData.provider && printerId && !printing;

  return (
    <div className="space-y-4">
      {/* Print Status */}
      {lastPrintResult && (
        <Alert variant={lastPrintResult.success ? "default" : "destructive"}>
          <div className="flex items-center space-x-2">
            {lastPrintResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription>
              {lastPrintResult.message}
              {lastPrintResult.jobId && (
                <div className="text-xs text-gray-500 mt-1">
                  Job ID: {lastPrintResult.jobId}
                </div>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Print Readiness Check */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Print Readiness</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span>Patient Selected:</span>
            {slipData.patient ? (
              <Badge variant="success">✓ {slipData.patient.name}</Badge>
            ) : (
              <Badge variant="secondary">Not selected</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Provider Selected:</span>
            {slipData.provider ? (
              <Badge variant="success">✓ {slipData.provider.name}</Badge>
            ) : (
              <Badge variant="secondary">Not selected</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Printer Ready:</span>
            {printerId ? (
              <Badge variant="success">✓ Selected</Badge>
            ) : (
              <Badge variant="secondary">Not selected</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Slip Type:</span>
            <Badge variant="outline">
              {slipData.slipType.charAt(0).toUpperCase() + slipData.slipType.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Print Actions */}
      <div className="space-y-2">
        <Button
          onClick={handlePrint}
          disabled={!canPrint}
          className="w-full"
          size="lg"
        >
          {printing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Printing...
            </>
          ) : (
            <>
              <Printer className="h-5 w-5 mr-2" />
              Print Checkout Slip
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleTestPrint}
          disabled={!printerId || printing}
          className="w-full"
        >
          {printing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Sending Test...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4 mr-2" />
              Test Print
            </>
          )}
        </Button>
      </div>

      {/* Print Instructions */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
        <h5 className="font-medium mb-1">Print Instructions:</h5>
        <ul className="space-y-1">
          <li>• Ensure printer has thermal paper loaded</li>
          <li>• Verify printer is online and ready</li>
          <li>• Use test print to check alignment</li>
          <li>• Slip will print automatically when ready</li>
        </ul>
      </div>

      {/* Quick Stats */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Slip Length:</span>
          <span>~4-6 inches</span>
        </div>
        <div className="flex justify-between">
          <span>Print Time:</span>
          <span>~3-5 seconds</span>
        </div>
        <div className="flex justify-between">
          <span>Paper Width:</span>
          <span>4 inches (102mm)</span>
        </div>
      </div>
    </div>
  );
}