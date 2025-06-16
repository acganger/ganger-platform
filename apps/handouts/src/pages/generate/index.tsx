import { useState, useEffect } from 'react';
import { useAuth, AuthGuard } from '@ganger/auth';
import { 
  AppLayout, 
  PageHeader, 
  Button,
  Input,
  LoadingSpinner,
  Card
} from '@ganger/ui';
import { analytics } from '@ganger/utils';
import { QRScanner } from '@/components/QRScanner';
import { TemplateSelector } from '@/components/TemplateSelector';
import { PatientInfo } from '@/components/PatientInfo';
import { DeliveryOptions } from '@/components/DeliveryOptions';
import { useHandoutGenerator } from '@/hooks/useHandoutGenerator';

interface Patient {
  id: string; // Added for communication service integration
  mrn: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

function HandoutGeneratorPage() {
  const { user, profile } = useAuth();
  const { generateHandouts, isGenerating } = useHandoutGenerator();
  
  const [currentStep, setCurrentStep] = useState<'patient' | 'templates' | 'delivery' | 'generate'>('patient');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState({
    print: true,
    email: false,
    sms: false
  });
  const [manualMRN, setManualMRN] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    analytics.track('handout_generator_opened', 'navigation', {
      user_role: profile?.role
    });
  }, [profile]);

  const handleQRCodeScanned = async (qrData: string) => {
    try {
      const mockPatient: Patient = {
        id: `patient_${Date.now()}_qr`, // Generate unique ID for communication service
        mrn: qrData,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        dateOfBirth: '1980-01-01'
      };
      
      setPatient(mockPatient);
      setShowQRScanner(false);
      setCurrentStep('templates');
      
      analytics.track('patient_identified_qr', 'interaction', {
        mrn: mockPatient.mrn
      });
    } catch (error) {
    }
  };

  const handleManualMRNSubmit = async () => {
    if (!manualMRN.trim()) return;
    
    try {
      const mockPatient: Patient = {
        id: `patient_${Date.now()}_manual`, // Generate unique ID for communication service
        mrn: manualMRN.trim(),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1987654321',
        dateOfBirth: '1975-05-15'
      };
      
      setPatient(mockPatient);
      setCurrentStep('templates');
      
      analytics.track('patient_identified_manual', 'interaction', {
        mrn: mockPatient.mrn
      });
    } catch (error) {
    }
  };

  const handleTemplatesSelected = (templateIds: string[]) => {
    setSelectedTemplates(templateIds);
    setCurrentStep('delivery');
    
    analytics.track('templates_selected', 'interaction', {
      template_count: templateIds.length,
      template_ids: templateIds
    });
  };

  const handleGenerate = async () => {
    if (!patient || selectedTemplates.length === 0) return;
    
    try {
      setCurrentStep('generate');
      
      await generateHandouts({
        patient,
        templateIds: selectedTemplates,
        deliveryOptions
      });
      
      analytics.track('handouts_generated', 'action', {
        patient_mrn: patient.mrn,
        template_count: selectedTemplates.length,
        delivery_methods: Object.keys(deliveryOptions).filter(k => deliveryOptions[k as keyof typeof deliveryOptions])
      });
      
      // Reset for next generation
      setCurrentStep('patient');
      setPatient(null);
      setSelectedTemplates([]);
      setManualMRN('');
    } catch (error) {
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'patient':
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Patient Identification</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    variant="primary"
                    className="flex-1"
                  >
                    Scan QR Code
                  </Button>
                  <span className="self-center text-gray-400">or</span>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Enter MRN"
                      value={manualMRN}
                      onChange={(e) => setManualMRN(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualMRNSubmit()}
                    />
                    <Button onClick={handleManualMRNSubmit} variant="outline">
                      Lookup
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {showQRScanner && (
              <Card className="p-6">
                <QRScanner
                  onScanned={handleQRCodeScanned}
                  onCancel={() => setShowQRScanner(false)}
                />
              </Card>
            )}
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-6">
            {patient && <PatientInfo patient={patient} />}
            <TemplateSelector
              onSelectionChange={handleTemplatesSelected}
              selectedTemplates={selectedTemplates}
            />
          </div>
        );

      case 'delivery':
        return (
          <div className="space-y-6">
            {patient && <PatientInfo patient={patient} />}
            <DeliveryOptions
              patient={patient}
              options={deliveryOptions}
              onChange={setDeliveryOptions}
              onGenerate={handleGenerate}
            />
          </div>
        );

      case 'generate':
        return (
          <div className="text-center space-y-6">
            <LoadingSpinner size="lg" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Generating Handouts</h3>
              <p className="text-gray-600">
                Creating personalized materials for {patient?.firstName} {patient?.lastName}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Generate Handouts"
        subtitle="Create personalized patient education materials"
        actions={
          currentStep !== 'patient' && currentStep !== 'generate' ? (
            <Button
              onClick={() => {
                const steps = ['patient', 'templates', 'delivery'] as const;
                const currentIndex = steps.indexOf(currentStep as 'patient' | 'templates' | 'delivery');
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1]);
                }
              }}
              variant="outline"
              size="sm"
            >
              Back
            </Button>
          ) : undefined
        }
      />

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { key: 'patient', label: 'Patient' },
            { key: 'templates', label: 'Templates' },
            { key: 'delivery', label: 'Delivery' },
            { key: 'generate', label: 'Generate' }
          ].map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.key
                    ? 'bg-handouts-primary text-white'
                    : index < ['patient', 'templates', 'delivery', 'generate'].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                {step.label}
              </span>
              {index < 3 && (
                <div className="w-16 h-0.5 bg-gray-200 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {renderStepContent()}
    </AppLayout>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedHandoutGeneratorPage() {
  return (
    <AuthGuard level="staff" appName="handouts">
      <HandoutGeneratorPage />
    </AuthGuard>
  );
}