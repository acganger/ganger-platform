'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useStaffAuth } from '@ganger/auth/staff';
import { withAuthComponent } from '@ganger/auth';
import { 
  AppLayout, 
  PageHeader, 
  Card, 
  Button, 
  FormField,
  Input,
  Select,
  Checkbox,
  LoadingSpinner,
  Modal
} from '@ganger/ui';
// Temporary local implementation until @ganger/utils is available
const validateForm = (data: any, schema: any) => ({ isValid: true, errors: {} });
import type { CallRecord, JournalEntry } from '../../types';

interface JournalFormData {
  call_id: string;
  call_summary: string;
  detailed_notes: string;
  patient_concern: string;
  resolution_provided: string;
  action_items: string[];
  follow_up_required: boolean;
  follow_up_type: string;
  follow_up_date: string;
  follow_up_notes: string;
  call_tags: string[];
  department_involved: string[];
  referral_made: boolean;
  referral_type: string;
}

const initialFormData: JournalFormData = {
  call_id: '',
  call_summary: '',
  detailed_notes: '',
  patient_concern: '',
  resolution_provided: '',
  action_items: [],
  follow_up_required: false,
  follow_up_type: '',
  follow_up_date: '',
  follow_up_notes: '',
  call_tags: [],
  department_involved: [],
  referral_made: false,
  referral_type: ''
};

const CALL_TAGS = [
  'Appointment Scheduling',
  'Insurance Question',
  'Billing Inquiry',
  'Prescription Request',
  'Test Results',
  'General Information',
  'Complaint',
  'Emergency',
  'Follow-up',
  'Cancellation'
];

const DEPARTMENTS = [
  'Front Desk',
  'Clinical',
  'Billing',
  'Insurance',
  'Provider',
  'Lab',
  'Pharmacy',
  'Imaging'
];

const FOLLOW_UP_TYPES = [
  { value: 'callback', label: 'Callback Required' },
  { value: 'appointment', label: 'Appointment Needed' },
  { value: 'provider_review', label: 'Provider Review' },
  { value: 'billing', label: 'Billing Follow-up' }
];

const REFERRAL_TYPES = [
  { value: 'internal', label: 'Internal Department' },
  { value: 'external', label: 'External Provider' },
  { value: 'specialist', label: 'Specialist Referral' },
  { value: 'emergency', label: 'Emergency Services' }
];

function CallJournalPage() {
  const { user } = useStaffAuth();
  const [formData, setFormData] = useState<JournalFormData>(initialFormData);
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRecentCalls();
  }, []);

  const loadRecentCalls = async () => {
    try {
      const response = await fetch('/api/call-records?limit=20&agent_email=' + user?.email);
      const result = await response.json();
      setRecentCalls(result.data || []);
    } catch (error) {
    }
  };

  const handleCallSelect = (callId: string) => {
    const selectedCall = recentCalls.find(call => call.id === callId);
    if (selectedCall) {
      setFormData(prev => ({
        ...prev,
        call_id: callId,
        call_summary: selectedCall.call_outcome || '',
        patient_concern: selectedCall.call_outcome || ''
      }));
    }
  };

  const handleInputChange = (field: keyof JournalFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleArrayInputChange = (field: 'action_items' | 'call_tags' | 'department_involved', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    handleInputChange(field, items);
  };

  const handleTagToggle = (tag: string, field: 'call_tags' | 'department_involved') => {
    const currentTags = formData[field];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    handleInputChange(field, newTags);
  };

  const validateJournalForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.call_id) {
      newErrors.call_id = 'Please select a call to journal';
    }
    if (!formData.call_summary.trim()) {
      newErrors.call_summary = 'Call summary is required';
    }
    if (!formData.patient_concern.trim()) {
      newErrors.patient_concern = 'Patient concern is required';
    }
    if (!formData.resolution_provided.trim()) {
      newErrors.resolution_provided = 'Resolution provided is required';
    }
    if (formData.follow_up_required && !formData.follow_up_type) {
      newErrors.follow_up_type = 'Follow-up type is required when follow-up is needed';
    }
    if (formData.referral_made && !formData.referral_type) {
      newErrors.referral_type = 'Referral type is required when referral is made';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateJournalForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/call-journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          agent_email: user?.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit journal entry');
      }

      setShowSuccessModal(true);
      setFormData(initialFormData);
      loadRecentCalls(); // Refresh call list
    } catch (error) {
      setErrors({ submit: 'Failed to submit journal entry. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSave = async () => {
    try {
      await fetch('/api/call-journals/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          agent_email: user?.email,
          journal_status: 'draft'
        })
      });
    } catch (error) {
    }
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Call Journal" 
        subtitle="Document call outcomes and patient interactions"
        actions={
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleQuickSave}
              disabled={!formData.call_summary.trim()}
            >
              💾 Save Draft
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/calls/history'}
            >
              📞 Call History
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journal Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Call Selection */}
              <FormField label="Select Call" required error={errors.call_id}>
                <Select
                  value={formData.call_id}
                  onChange={(e) => handleCallSelect(e.target.value)}
                  options={[
                    { value: '', label: 'Select a recent call...' },
                    ...recentCalls.map(call => ({
                      value: call.id,
                      label: `${call.caller_name || 'Unknown'} - ${new Date(call.call_start_time).toLocaleString()}`
                    }))
                  ]}
                  placeholder="Choose call to journal"
                />
              </FormField>

              {/* Call Summary */}
              <FormField label="Call Summary" required error={errors.call_summary}>
                <Input
                  value={formData.call_summary}
                  onChange={(value) => handleInputChange('call_summary', value)}
                  placeholder="Brief summary of the call purpose and outcome"
                />
              </FormField>

              {/* Patient Concern */}
              <FormField label="Patient Concern" required error={errors.patient_concern}>
                <Input
                  value={formData.patient_concern}
                  onChange={(value) => handleInputChange('patient_concern', value)}
                  placeholder="Primary patient concern or request"
                />
              </FormField>

              {/* Resolution Provided */}
              <FormField label="Resolution Provided" required error={errors.resolution_provided}>
                <textarea
                  className="w-full min-h-[100px] p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.resolution_provided}
                  onChange={(e) => handleInputChange('resolution_provided', e.target.value)}
                  placeholder="How the concern was addressed and what information was provided"
                />
              </FormField>

              {/* Detailed Notes */}
              <FormField label="Detailed Notes">
                <textarea
                  className="w-full min-h-[120px] p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.detailed_notes}
                  onChange={(e) => handleInputChange('detailed_notes', e.target.value)}
                  placeholder="Additional details about the interaction..."
                />
              </FormField>

              {/* Action Items */}
              <FormField label="Action Items (comma-separated)">
                <Input
                  value={formData.action_items.join(', ')}
                  onChange={(e) => handleArrayInputChange('action_items', e.target.value)}
                  placeholder="e.g. Schedule follow-up call, Send insurance information"
                />
              </FormField>

              {/* Follow-up Section */}
              <div className="space-y-4">
                <Checkbox
                  checked={formData.follow_up_required}
                  onChange={(checked) => handleInputChange('follow_up_required', checked)}
                  label="Follow-up Required"
                />

                {formData.follow_up_required && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <FormField label="Follow-up Type" required error={errors.follow_up_type}>
                      <Select
                        value={formData.follow_up_type}
                        onChange={(e) => handleInputChange('follow_up_type', e.target.value)}
                        options={FOLLOW_UP_TYPES}
                        placeholder="Select follow-up type"
                      />
                    </FormField>

                    <FormField label="Follow-up Date">
                      <Input
                        type="date"
                        value={formData.follow_up_date}
                        onChange={(value) => handleInputChange('follow_up_date', value)}
                      />
                    </FormField>

                    <div className="md:col-span-2">
                      <FormField label="Follow-up Notes">
                        <Input
                          value={formData.follow_up_notes}
                          onChange={(value) => handleInputChange('follow_up_notes', value)}
                          placeholder="Notes about the required follow-up"
                        />
                      </FormField>
                    </div>
                  </div>
                )}
              </div>

              {/* Referral Section */}
              <div className="space-y-4">
                <Checkbox
                  checked={formData.referral_made}
                  onChange={(checked) => handleInputChange('referral_made', checked)}
                  label="Referral Made"
                />

                {formData.referral_made && (
                  <div className="ml-6">
                    <FormField label="Referral Type" required error={errors.referral_type}>
                      <Select
                        value={formData.referral_type}
                        onChange={(e) => handleInputChange('referral_type', e.target.value)}
                        options={REFERRAL_TYPES}
                        placeholder="Select referral type"
                      />
                    </FormField>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => window.location.href = '/calls/history'}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <LoadingSpinner size="sm" /> : '📝 Submit Journal'}
                </Button>
              </div>

              {errors.submit && (
                <div className="text-red-600 text-sm mt-2">{errors.submit}</div>
              )}
            </form>
          </Card>
        </div>

        {/* Quick Tags and Departments */}
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="font-medium text-neutral-900 mb-3">Call Tags</h3>
            <div className="space-y-2">
              {CALL_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag, 'call_tags')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                    formData.call_tags.includes(tag)
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {formData.call_tags.includes(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium text-neutral-900 mb-3">Departments Involved</h3>
            <div className="space-y-2">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => handleTagToggle(dept, 'department_involved')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                    formData.department_involved.includes(dept)
                      ? 'bg-secondary-50 border-secondary-200 text-secondary-700'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {formData.department_involved.includes(dept) ? '✓ ' : ''}{dept}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium text-neutral-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFormData(initialFormData)}
                className="w-full"
              >
                🗑️ Clear Form
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleQuickSave}
                className="w-full"
                disabled={!formData.call_summary.trim()}
              >
                💾 Save as Draft
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Journal Submitted Successfully"
      >
        <div className="text-center py-4">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <p className="text-neutral-700 mb-6">
            Your call journal has been submitted successfully and is now available for supervisor review.
          </p>
          <div className="flex space-x-3 justify-center">
            <Button 
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                setFormData(initialFormData);
              }}
            >
              Create Another Journal
            </Button>
            <Button 
              variant="primary"
              onClick={() => window.location.href = '/calls/history'}
            >
              View Call History
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

export default withAuthComponent(CallJournalPage, {
  requiredRoles: ['staff', 'manager', 'superadmin']
});