// Cloudflare Workers Edge Runtime
export const dynamic = 'force-dynamic';

// Check-in Kiosk Main Page
// Demonstrates immediate business value from Universal Payment Processing Hub

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout, Button, Card, LoadingSpinner } from '@ganger/ui';
import { User, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import { PaymentProcessor } from '@/components/PaymentProcessor';
import type { CheckInSession, CheckInStep } from '@/types/kiosk';

// Mock type for static build
interface PaymentResult {
  success: boolean;
  status: string;
}

export default function CheckInKiosk() {
  const [session, setSession] = useState<CheckInSession | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Mock data for demonstration
  const mockSession: CheckInSession = useMemo(() => ({
    patient: {
      id: 'patient-123',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1985-06-15',
      phone_number: '(555) 123-4567',
      email: 'john.doe@email.com',
      insurance_id: 'INS123456',
      medical_record_number: 'MRN789012',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    appointment: {
      id: 'appt-456',
      patient_id: 'patient-123',
      provider_id: 'provider-789',
      appointment_date: '2025-01-06',
      appointment_time: '14:30',
      appointment_type: 'consultation',
      status: 'scheduled',
      copay_amount: 25.00,
      insurance_copay: 25.00,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    provider: {
      id: 'provider-789',
      first_name: 'Dr. Sarah',
      last_name: 'Ganger',
      title: 'Dermatologist',
      specialty: 'Dermatology',
      office_number: 'Room 205'
    },
    copay_required: true,
    copay_amount: 25.00,
    insurance_verified: true,
    payment_completed: false,
    forms_completed: true,
    check_in_completed: false,
    session_start: new Date()
  }), []);

  const steps: CheckInStep[] = [
    {
      id: 'patient_lookup',
      title: 'Patient Identification',
      description: 'Verify your identity and appointment',
      completed: false,
      required: true,
      component: 'patient_lookup'
    },
    {
      id: 'appointment_confirmation',
      title: 'Appointment Details',
      description: 'Confirm your appointment information',
      completed: false,
      required: true,
      component: 'appointment_confirmation'
    },
    {
      id: 'payment',
      title: 'Payment Processing',
      description: 'Complete copay payment',
      completed: false,
      required: true,
      component: 'payment'
    },
    {
      id: 'completion',
      title: 'Check-in Complete',
      description: 'You are now checked in',
      completed: false,
      required: true,
      component: 'completion'
    }
  ];

  const [checkInSteps, setCheckInSteps] = useState(steps);

  useEffect(() => {
    // Simulate loading session data
    const timer = setTimeout(() => {
      setSession(mockSession);
      markStepCompleted(0); // Patient lookup completed
    }, 1000);

    return () => clearTimeout(timer);
  }, [mockSession]);

  const markStepCompleted = (stepIndex: number) => {
    setCheckInSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, completed: true } : step
    ));
  };

  const handleStartCheckIn = () => {
    markStepCompleted(1); // Appointment confirmation completed
    setCurrentStep(2); // Move to payment step
  };

  const handlePaymentComplete = (result: PaymentResult) => {
    if (result.success) {
      markStepCompleted(2); // Payment completed
      setSession(prev => prev ? { ...prev, payment_completed: true } : null);
      setCurrentStep(3); // Move to completion step
    }
  };

  const handlePaymentSkipped = () => {
    markStepCompleted(2); // Payment step completed (skipped)
    setSession(prev => prev ? { ...prev, payment_completed: false } : null);
    setCurrentStep(3); // Move to completion step
  };

  const handleCompleteCheckIn = () => {
    markStepCompleted(3); // Check-in completed
    setSession(prev => prev ? { ...prev, check_in_completed: true } : null);
    
    // Simulate redirect to waiting area or restart
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  if (!session) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 text-center">
            <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading Check-in System</h2>
            <p className="text-gray-600">Please wait while we prepare your check-in...</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Ganger Dermatology
            </h1>
            <p className="text-lg text-gray-600">
              Complete your check-in process below
            </p>
          </Card>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              {checkInSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : currentStep === index
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      step.completed || currentStep === index ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < checkInSteps.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-gray-400 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 0 && (
            <Card className="p-8 text-center">
              <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-4">Welcome Back!</h2>
              <p className="text-gray-600 mb-6">
                We found your information. Please confirm your identity to continue.
              </p>
              <Button onClick={() => setCurrentStep(1)}>
                Confirm Identity
              </Button>
            </Card>
          )}

          {currentStep === 1 && (
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-semibold">Appointment Confirmation</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {session.patient.first_name} {session.patient.last_name}</p>
                    <p><span className="font-medium">DOB:</span> {new Date(session.patient.date_of_birth).toLocaleDateString()}</p>
                    <p><span className="font-medium">Phone:</span> {session.patient.phone_number}</p>
                    <p><span className="font-medium">Insurance ID:</span> {session.patient.insurance_id}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Appointment Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Provider:</span> {session.provider.first_name} {session.provider.last_name}</p>
                    <p><span className="font-medium">Date:</span> {new Date(session.appointment.appointment_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Time:</span> {session.appointment.appointment_time}</p>
                    <p><span className="font-medium">Type:</span> {session.appointment.appointment_type}</p>
                    <p><span className="font-medium">Office:</span> {session.provider.office_number}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button onClick={handleStartCheckIn} size="lg">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm and Continue
                </Button>
              </div>
            </Card>
          )}

          {currentStep === 2 && (
            <PaymentProcessor
              session={session}
              onPaymentComplete={handlePaymentComplete}
              onSkip={handlePaymentSkipped}
            />
          )}

          {currentStep === 3 && (
            <Card className="p-8 text-center">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Check-in Complete!
              </h2>
              <div className="space-y-3 mb-8">
                <p className="text-lg text-gray-600">
                  You are now checked in for your appointment with {session.provider.first_name} {session.provider.last_name}
                </p>
                {session.payment_completed && (
                  <p className="text-green-600 font-medium">
                    ✓ Payment processed successfully
                  </p>
                )}
                {!session.payment_completed && (
                  <p className="text-orange-600 font-medium">
                    ⚠ Please complete payment at the front desk
                  </p>
                )}
                <p className="text-gray-500">
                  Please have a seat in the waiting area. You will be called when it&apos;s time for your appointment.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Take a seat in the waiting area</li>
                  <li>• Keep your phone nearby for any updates</li>
                  <li>• Estimated wait time: 10-15 minutes</li>
                </ul>
              </div>
              
              <Button onClick={handleCompleteCheckIn} size="lg">
                Complete Check-in
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                You will be automatically redirected in a few moments...
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}