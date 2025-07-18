import React from 'react';
import { Button } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { FileText, User, Pill, Shield, Send, Edit, Download } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  memberId: string;
}

interface Medication {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  dosageForm: string;
}

interface InsuranceInfo {
  planName: string;
  memberId: string;
  groupNumber: string;
}

interface AuthorizationPreviewProps {
  patient: Patient;
  medication: Medication;
  insurance: InsuranceInfo;
  formData: Record<string, any>;
  onEdit: () => void;
  onSubmit: () => void;
  onDownload: () => void;
  isSubmitting?: boolean;
}

export function AuthorizationPreview({
  patient,
  medication,
  insurance,
  formData,
  onEdit,
  onSubmit,
  onDownload,
  isSubmitting = false
}: AuthorizationPreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string' && value.includes('-') && value.length === 10) {
      // Assume it's a date
      return formatDate(value);
    }
    return String(value || 'Not provided');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold">Prior Authorization Preview</h3>
        </div>

        <div className="space-y-8">
          {/* Patient Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h4 className="text-lg font-medium text-gray-900">Patient Information</h4>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Name:</span> {patient.name}</p>
                  <p><span className="font-medium">Date of Birth:</span> {formatDate(patient.dateOfBirth)}</p>
                </div>
                <div>
                  <p><span className="font-medium">Member ID:</span> {patient.memberId}</p>
                  <p><span className="font-medium">Patient ID:</span> {patient.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medication Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-gray-600" />
              <h4 className="text-lg font-medium text-gray-900">Requested Medication</h4>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Brand Name:</span> {medication.name}</p>
                  <p><span className="font-medium">Generic Name:</span> {medication.genericName}</p>
                </div>
                <div>
                  <p><span className="font-medium">Strength:</span> {medication.strength}</p>
                  <p><span className="font-medium">Dosage Form:</span> {medication.dosageForm}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <h4 className="text-lg font-medium text-gray-900">Insurance Information</h4>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Plan Name:</span> {insurance.planName}</p>
                  <p><span className="font-medium">Member ID:</span> {insurance.memberId}</p>
                </div>
                <div>
                  <p><span className="font-medium">Group Number:</span> {insurance.groupNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Data */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Authorization Details</h4>
            <div className="space-y-4">
              {Object.entries(formData).map(([key, value]) => {
                // Skip empty values
                if (!value || (typeof value === 'string' && !value.trim())) {
                  return null;
                }

                // Format the key as a readable label
                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();

                return (
                  <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-medium text-gray-900">{label}:</div>
                      <div className="col-span-2 text-gray-700">{formatValue(value)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-blue-900 mb-2">Authorization Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Patient: {patient.name} (DOB: {formatDate(patient.dateOfBirth)})</p>
              <p>• Medication: {medication.name} ({medication.genericName}) - {medication.strength}</p>
              <p>• Insurance: {insurance.planName}</p>
              <p>• Form completed on: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <Button onClick={onEdit} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Form
              </Button>
              <Button onClick={onDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
            
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Authorization
                </>
              )}
            </Button>
          </div>

          {/* Submission Note */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Important Notes:</p>
            <ul className="space-y-1">
              <li>• This prior authorization will be submitted electronically to the insurance provider</li>
              <li>• Processing typically takes 24-72 hours</li>
              <li>• You will receive email notifications about status updates</li>
              <li>• A copy will be saved to the patient's medical record</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}