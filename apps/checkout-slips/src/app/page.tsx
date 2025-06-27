'use client'

import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  LoadingSpinner,
  ErrorAlert
} from '@ganger/ui';
import { useStaffAuth } from '@ganger/auth/staff';
import { StaffLoginRedirect } from '@ganger/ui/staff';
import PatientSearch from '../components/PatientSearch';
import SlipSelector from '../components/SlipSelector';
import SlipPreview from '../components/SlipPreview';
import PrintControls from '../components/PrintControls';
import RecentPrintJobs from '../components/RecentPrintJobs';
import { SlipData, PatientInfo, ProviderInfo, SlipType } from '../types';
import { usePrinter } from '../hooks/usePrinter';

export default function CheckoutSlipsApp() {
  const { user, isAuthenticated, isLoading } = useStaffAuth();
  const { printers, loading: printersLoading } = usePrinter();
  
  // State management
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
  const [slipType, setSlipType] = useState<SlipType>('medical');
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [slipData, setSlipData] = useState<SlipData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select first available printer
  useEffect(() => {
    if (printers.length > 0 && !selectedPrinter) {
      const onlinePrinter = printers.find(p => p.status === 'online');
      setSelectedPrinter(onlinePrinter?.id || printers[0].id);
    }
  }, [printers, selectedPrinter]);

  // Build slip data when components change
  useEffect(() => {
    if (selectedPatient && selectedProvider) {
      setSlipData({
        patient: selectedPatient,
        provider: selectedProvider,
        slipType,
        content: {},
        location: user?.location || 'ann-arbor'
      });
    } else {
      setSlipData(null);
    }
  }, [selectedPatient, selectedProvider, slipType, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <StaffLoginRedirect appName="checkout-slips" />;
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Checkout Slip Printing</h1>
        <p className="mt-2 text-gray-600">
          Generate and print intelligent thermal checkout slips for patient visits
        </p>
      </div>

      {error && (
        <ErrorAlert 
          message={error} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Patient Selection */}
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold">Patient Selection</h2>
          </Card.Header>
          <Card.Content>
            <PatientSearch
              onPatientSelect={setSelectedPatient}
              onProviderSelect={setSelectedProvider}
              selectedPatient={selectedPatient}
            />
          </Card.Content>
        </Card>

        {/* Slip Configuration */}
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold">Slip Configuration</h2>
          </Card.Header>
          <Card.Content>
            <SlipSelector
              slipType={slipType}
              onSlipTypeChange={setSlipType}
              selectedPrinter={selectedPrinter}
              onPrinterChange={setSelectedPrinter}
              printers={printers}
              loading={printersLoading}
            />
          </Card.Content>
        </Card>
      </div>

      {/* Preview and Print Section */}
      {slipData && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Slip Preview</h2>
              </Card.Header>
              <Card.Content>
                <SlipPreview 
                  slipData={slipData}
                  onContentChange={(content) => 
                    setSlipData(prev => prev ? { ...prev, content } : null)
                  }
                />
              </Card.Content>
            </Card>
          </div>

          <div className="xl:col-span-1">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Print Controls</h2>
              </Card.Header>
              <Card.Content>
                <PrintControls
                  slipData={slipData}
                  printerId={selectedPrinter}
                  onPrintSuccess={() => {
                    // Reset form after successful print
                    setSelectedPatient(null);
                    setSelectedProvider(null);
                    setSlipData(null);
                  }}
                  onError={setError}
                />
              </Card.Content>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Print Jobs */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">Recent Print Jobs</h2>
        </Card.Header>
        <Card.Content>
          <RecentPrintJobs />
        </Card.Content>
      </Card>
    </main>
  );
}