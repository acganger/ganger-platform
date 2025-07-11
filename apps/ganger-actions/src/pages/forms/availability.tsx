export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Calendar, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Select } from '@ganger/ui';

const timeSlotSchema = z.object({
  day: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  available: z.boolean()
});

const availabilitySchema = z.object({
  employee_name: z.string().optional(),
  employee_email: z.string().optional(),
  location: z.enum(['Ann Arbor', 'Wixom', 'Plymouth', 'Any/All']).optional(),
  availability_change: z.enum(['Increasing', 'Decreasing']),
  employment_type: z.enum(['Full-time', 'Part-time']),
  effective_date: z.string().min(1, 'Effective date is required'),
  probation_completed: z.enum(['Yes', 'No']),
  days_affected: z.array(z.string()).min(1, 'Please select at least one day'),
  limited_availability_details: z.string().optional(),
  return_date: z.string().optional(),
  reason: z.string().min(10, 'Please provide at least 10 characters explaining the change'),
  supporting_documentation: z.instanceof(File).optional(),
  additional_comments: z.string().optional()
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;
type TimeSlot = z.infer<typeof timeSlotSchema>;

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityChangeForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const isManager = hasRole(['admin', 'manager']);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      employee_name: user?.name || '',
      employee_email: user?.email || '',
      location: user?.location === 'Multiple' ? 'Ann Arbor' : undefined,
      availability_change: 'Increasing',
      employment_type: 'Full-time',
      probation_completed: 'Yes',
      days_affected: []
    }
  });

  const changeType = watch('availability_change');

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      day: 'Monday',
      start_time: '09:00',
      end_time: '17:00',
      available: true
    };
    setTimeSlots([...timeSlots, newSlot]);
    // Time slots are managed separately from the main form
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setTimeSlots(updatedSlots);
    // Time slots are managed separately from the main form
  };

  const removeTimeSlot = (index: number) => {
    const updatedSlots = timeSlots.filter((_slot, i) => i !== index);
    setTimeSlots(updatedSlots);
    // Time slots are managed separately from the main form
  };

  const submitRequest = useMutation({
    mutationFn: async (data: AvailabilityFormData) => {
      const formData = {
        title: `Change of Availability - ${data.availability_change}`,
        description: data.reason,
        form_type: 'change_of_availability',
        form_data: {
          employee_name: data.employee_name || user?.name || '',
          employee_email: data.employee_email || user?.email || '',
          location: data.location || user?.location || 'Multiple',
          availability_change: data.availability_change,
          employment_type: data.employment_type,
          effective_date: data.effective_date,
          probation_completed: data.probation_completed,
          days_affected: data.days_affected.join(', '),
          limited_availability_details: data.limited_availability_details || '',
          return_date: data.return_date || '',
          reason: data.reason,
          supporting_documentation: '', // File handled separately
          additional_comments: data.additional_comments || ''
        },
        completed_by: data.employee_name || user?.name || ''
      };

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability change request submitted successfully!',
        variant: 'success'
      });
      router.push('/tickets');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'error'
      });
    }
  });

  const onSubmit = (data: AvailabilityFormData) => {
    // Include time slots in the submission data
    const submissionData = {
      ...data,
      time_slots: timeSlots
    };
    submitRequest.mutate(submissionData);
  };

  return (
    <DashboardLayout title="Change of Availability">
      <div className="py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Change of Availability</h1>
            </div>
            <p className="text-sm text-gray-600">
              Request changes to your work availability schedule.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              {/* Conditional Location Dropdown */}
              {user?.location === 'Multiple' && (
                <div className="mb-6">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <select
                    id="location"
                    {...register('location')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Ann Arbor">Ann Arbor</option>
                    <option value="Wixom">Wixom</option>
                    <option value="Plymouth">Plymouth</option>
                    <option value="Any/All">Any/All</option>
                  </select>
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>
              )}

              {/* Change Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Change *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Increasing"
                      {...register('availability_change')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Increasing availability</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Decreasing"
                      {...register('availability_change')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Decreasing availability</span>
                  </label>
                </div>
                {errors.availability_change && (
                  <p className="mt-1 text-sm text-red-600">{errors.availability_change.message}</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  type="date"
                  {...register('effective_date')}
                  label="Effective Date *"
                  error={errors.effective_date?.message}
                />

                {changeType === 'Decreasing' && (
                  <div>
                    <Input
                      type="date"
                      {...register('return_date')}
                      label="Expected Return Date"
                      error={errors.return_date?.message}
                    />
                  </div>
                )}
              </div>

              {/* Availability Changes */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Availability Changes *
                  </label>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Time Slot
                  </button>
                </div>

                {timeSlots.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">No availability changes added yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Time Slot" to specify your availability.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeSlots.map((slot, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Time Slot {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Day</label>
                            <Select
                              value={slot.day}
                              onChange={(e) => updateTimeSlot(index, 'day', e.target.value)}
                              options={daysOfWeek.map(day => ({ value: day, label: day }))}
                              className="w-full text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Available?</label>
                            <Select
                              value={slot.available.toString()}
                              onChange={(e) => updateTimeSlot(index, 'available', e.target.value === 'true')}
                              options={[
                                { value: 'true', label: 'Available' },
                                { value: 'false', label: 'Not Available' }
                              ]}
                              className="w-full text-sm"
                            />
                          </div>

                          {slot.available && (
                            <>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                                <Input
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)}
                                  className="w-full text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-gray-600 mb-1">End Time</label>
                                <Input
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) => updateTimeSlot(index, 'end_time', e.target.value)}
                                  className="w-full text-sm"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Time slots are managed separately from form validation */}
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Change *
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  {...register('reason')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Please explain why you need to change your availability..."
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                )}
              </div>

              {/* Additional Notes */}
              <div className="mb-6">
                <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="additional_notes"
                  rows={3}
                  {...register('additional_comments')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any other information relevant to your availability change..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/forms')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}