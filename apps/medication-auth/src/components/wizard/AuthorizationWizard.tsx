import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { PatientSelector } from './PatientSelector';
import { MedicationSelector } from './MedicationSelector';
import { InsuranceChecker } from './InsuranceChecker';
import { DynamicFormBuilder } from '../forms/DynamicFormBuilder';
import { AuthorizationPreview } from './AuthorizationPreview';
import type { Patient, Medication, InsuranceProvider } from '@/types';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  completed: boolean;
}

interface AuthorizationWizardProps {
  initialStep?: string;
  authorizationId?: string; // For editing existing authorizations
}

export function AuthorizationWizard({ initialStep, authorizationId }: AuthorizationWizardProps) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [wizardData, setWizardData] = useState({
    patient: null as Patient | null,
    medication: null as Medication | null,
    insurance: null as InsuranceProvider | null,
    formData: {} as Record<string, any>,
  });

  const steps: WizardStep[] = [
    {
      id: 'patient',
      title: 'Select Patient',
      description: 'Search and select the patient for this authorization',
      component: PatientSelector,
      completed: !!wizardData.patient,
    },
    {
      id: 'medication',
      title: 'Choose Medication',
      description: 'Select the medication requiring authorization',
      component: MedicationSelector,
      completed: !!wizardData.medication,
    },
    {
      id: 'insurance',
      title: 'Insurance Information',
      description: 'Verify insurance details and requirements',
      component: InsuranceChecker,
      completed: !!wizardData.insurance,
    },
    {
      id: 'form',
      title: 'Authorization Form',
      description: 'Complete the authorization request form',
      component: DynamicFormBuilder,
      completed: Object.keys(wizardData.formData).length > 0,
    },
    {
      id: 'preview',
      title: 'Review & Submit',
      description: 'Review your request before submission',
      component: AuthorizationPreview,
      completed: false,
    },
  ];

  // Handle initial step from URL
  useEffect(() => {
    if (initialStep) {
      const stepIndex = steps.findIndex(step => step.id === initialStep);
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex);
      }
    }
  }, [initialStep]);

  // Update URL when step changes
  useEffect(() => {
    const currentStep = steps[currentStepIndex];
    if (currentStep) {
      router.replace(`/create?step=${currentStep.id}`, undefined, { shallow: true });
    }
  }, [currentStepIndex, router]);

  const handleStepData = (stepId: string, data: any) => {
    setWizardData(prev => ({
      ...prev,
      [stepId]: data,
    }));
  };

  const handleFormData = (formData: Record<string, any>) => {
    setWizardData(prev => ({
      ...prev,
      formData,
    }));
  };

  const canProceedToNext = () => {
    const currentStep = steps[currentStepIndex];
    return currentStep.completed;
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1 && canProceedToNext()) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow going back to any completed step or the next step if current is completed
    const targetStep = steps[stepIndex];
    const currentStep = steps[currentStepIndex];
    
    if (stepIndex <= currentStepIndex || (stepIndex === currentStepIndex + 1 && currentStep.completed)) {
      setCurrentStepIndex(stepIndex);
    }
  };

  const currentStep = steps[currentStepIndex];
  const CurrentStepComponent = currentStep.component;

  return (
    <div className="bg-white shadow-sm rounded-lg">
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <li
                key={step.id}
                className={`relative ${
                  stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
                }`}
              >
                {stepIdx !== steps.length - 1 && (
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-0.5 w-full ${
                        stepIdx < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => handleStepClick(stepIdx)}
                  className={`relative w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    stepIdx < currentStepIndex
                      ? 'bg-blue-600 border-blue-600 hover:bg-blue-700'
                      : stepIdx === currentStepIndex
                      ? 'border-blue-600 bg-white text-blue-600'
                      : step.completed && stepIdx === currentStepIndex + 1
                      ? 'border-blue-600 bg-white text-blue-600 hover:border-blue-700'
                      : 'border-gray-300 bg-white text-gray-400'
                  } ${
                    stepIdx <= currentStepIndex || (stepIdx === currentStepIndex + 1 && steps[currentStepIndex].completed)
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed'
                  }`}
                  disabled={
                    stepIdx > currentStepIndex && !(stepIdx === currentStepIndex + 1 && steps[currentStepIndex].completed)
                  }
                >
                  {stepIdx < currentStepIndex ? (
                    <svg
                      className="w-5 h-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{stepIdx + 1}</span>
                  )}
                </button>
                
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-32 text-center">
                  <div className="text-xs font-medium text-gray-900">
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentStep.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {currentStep.description}
          </p>
        </div>

        <CurrentStepComponent
          data={wizardData}
          onDataChange={handleStepData}
          onFormDataChange={handleFormData}
          authorizationId={authorizationId}
        />
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          Previous
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceedToNext() || currentStepIndex === steps.length - 1}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRightIcon className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}