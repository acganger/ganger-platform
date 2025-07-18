import React, { useState } from 'react';
import { Button, FormField } from '@ganger/ui';
import { Input } from '@ganger/ui-catalyst';
import { StaffMember } from '@/types/staffing';
import { staffAvailabilitySchema, validateForm, StaffAvailabilityForm as FormData } from '@/lib/validation';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

interface StaffAvailabilityFormProps {
  staff: StaffMember;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Form validation is now handled by the imported validateForm function

export function StaffAvailabilityForm({ 
  staff, 
  onSubmit, 
  onCancel,
  isLoading = false 
}: StaffAvailabilityFormProps) {
  const [formData, setFormData] = useState<FormData>({
    available_start_time: staff.availability_start_time || '08:00',
    available_end_time: staff.availability_end_time || '17:00',
    location_preferences: staff.location_preferences || [],
    unavailable_dates: staff.unavailable_dates || [],
    notes: staff.notes || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const validation = validateForm(formData, staffAvailabilitySchema);
    if (!validation.success) {
      setErrors(validation.errors || {});
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to update availability' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addLocationPreference = (locationId: string) => {
    if (!formData.location_preferences.includes(locationId)) {
      handleInputChange('location_preferences', [...formData.location_preferences, locationId]);
    }
  };

  const removeLocationPreference = (locationId: string) => {
    handleInputChange(
      'location_preferences', 
      formData.location_preferences.filter(id => id !== locationId)
    );
  };

  const addUnavailableDate = (date: string) => {
    if (!formData.unavailable_dates.includes(date)) {
      handleInputChange('unavailable_dates', [...formData.unavailable_dates, date]);
    }
  };

  const removeUnavailableDate = (date: string) => {
    handleInputChange(
      'unavailable_dates',
      formData.unavailable_dates.filter(d => d !== date)
    );
  };

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Staff Info Header */}
      <div className="bg-neutral-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {staff.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-neutral-600">
          <span className="capitalize">{staff.role.replace('_', ' ')}</span>
          <span>•</span>
          <span>{staff.email}</span>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Time Availability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Available Start Time" error={errors.available_start_time}>
          <Input
            type="time"
            value={formData.available_start_time}
            onChange={(e) => handleInputChange('available_start_time', e.target.value)}
            disabled={isLoading || isSubmitting}
          />
        </FormField>

        <FormField label="Available End Time" error={errors.available_end_time}>
          <Input
            type="time"
            value={formData.available_end_time}
            onChange={(e) => handleInputChange('available_end_time', e.target.value)}
            disabled={isLoading || isSubmitting}
          />
        </FormField>
      </div>

      {/* Location Preferences */}
      <FormField label="Location Preferences" error={errors.location_preferences}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {formData.location_preferences.map(locationId => (
              <span 
                key={locationId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
              >
                Location {locationId}
                <button
                  type="button"
                  onClick={() => removeLocationPreference(locationId)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  disabled={isLoading || isSubmitting}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter location ID"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    addLocationPreference(target.value.trim());
                    target.value = '';
                  }
                }
              }}
              disabled={isLoading || isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                if (input?.value.trim()) {
                  addLocationPreference(input.value.trim());
                  input.value = '';
                }
              }}
              disabled={isLoading || isSubmitting}
            >
              Add
            </Button>
          </div>
        </div>
      </FormField>

      {/* Unavailable Dates */}
      <FormField label="Unavailable Dates" error={errors.unavailable_dates}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {formData.unavailable_dates.map(date => (
              <span 
                key={date}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-sm rounded"
              >
                {date}
                <button
                  type="button"
                  onClick={() => removeUnavailableDate(date)}
                  className="ml-1 text-red-600 hover:text-red-800"
                  disabled={isLoading || isSubmitting}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              type="date"
              onChange={(e) => {
                if (e.target.value) {
                  addUnavailableDate(e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={isLoading || isSubmitting}
            />
          </div>
        </div>
      </FormField>

      {/* Notes */}
      <FormField label="Notes (Optional)" error={errors.notes}>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Any additional notes about availability or preferences..."
          className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={3}
          disabled={isLoading || isSubmitting}
        />
      </FormField>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        <Button 
          type="submit" 
          disabled={isLoading || isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting ? 'Saving...' : 'Update Availability'}
        </Button>
        
        {onCancel && (
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
    </ErrorBoundary>
  );
}