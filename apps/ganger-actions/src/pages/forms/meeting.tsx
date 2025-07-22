export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Users, Calendar, MapPin, Video, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@ganger/ui-catalyst';
import { Input, Select } from '@ganger/ui-catalyst';

const meetingSchema = z.object({
  meeting_type: z.string().min(1, 'Meeting type is required'),
  location: z.enum(['Ann Arbor', 'Wixom', 'Plymouth', 'Any/All']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  purpose: z.string().min(10, 'Please provide meeting purpose'),
  participants: z.string().min(1, 'Please specify participants'),
  submitter_name: z.string().min(1, 'Name is required'),
  submitter_email: z.string().email('Valid email is required'),
  preferred_dates: z.array(z.object({
    date: z.string(),
    start_time: z.string(),
    end_time: z.string()
  })).min(1, 'At least one preferred date/time is required')
});

type MeetingFormData = z.infer<typeof meetingSchema>;
type PreferredDate = { date: string; start_time: string; end_time: string; };

const meetingTypeLabels = {
  one_on_one: 'One-on-One',
  team: 'Team Meeting',
  department: 'Department Meeting',
  all_hands: 'All Hands',
  training: 'Training Session',
  other: 'Other'
};

const durationOptions = [
  '15 minutes',
  '30 minutes',
  '45 minutes',
  '1 hour',
  '1.5 hours',
  '2 hours',
  '3 hours',
  '4 hours',
  'Half day',
  'Full day'
];

export default function MeetingRequestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { authUser } = useAuth();
  const [preferredDates, setPreferredDates] = useState<PreferredDate[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      meeting_type: '',
      location: 'Ann Arbor',
      title: '',
      purpose: '',
      participants: '',
      submitter_name: authUser?.name || '',
      submitter_email: authUser?.email || ''
    }
  });

  // const format = watch('format'); // Removed - not in schema

  const addPreferredDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newDate: PreferredDate = {
      date: tomorrow.toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '10:00'
    };
    setPreferredDates([...preferredDates, newDate]);
    setValue('preferred_dates', [...preferredDates, newDate]);
  };

  const updatePreferredDate = (index: number, field: keyof PreferredDate, value: string) => {
    const updatedDates = [...preferredDates];
    updatedDates[index] = { ...updatedDates[index], [field]: value };
    setPreferredDates(updatedDates);
    setValue('preferred_dates', updatedDates);
  };

  const removePreferredDate = (index: number) => {
    const updatedDates = preferredDates.filter((_, i) => i !== index);
    setPreferredDates(updatedDates);
    setValue('preferred_dates', updatedDates);
  };

  const submitRequest = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const formData = {
        title: `Meeting Request - ${data.title}`,
        description: data.purpose,
        form_type: 'meeting_request',
        form_data: {
          submitter_name: data.submitter_name,
          submitter_email: data.submitter_email,
          location: data.location,
          meeting_type: data.meeting_type,
          title: data.title,
          purpose: data.purpose,
          participants: data.participants,
          preferred_dates: data.preferred_dates
        }
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
        description: 'Meeting request submitted successfully!',
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

  const onSubmit = (data: MeetingFormData) => {
    data.preferred_dates = preferredDates;
    submitRequest.mutate(data);
  };

  return (
    <DashboardLayout title="Meeting Request">
      <div className="py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Meeting Request</h1>
            </div>
            <p className="text-sm text-gray-600">
              Schedule meetings with staff, departments, or external parties.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              {/* Submitter Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Input
                  {...register('submitter_name')}
                  label="Your Name *"
                  placeholder="Enter your full name"
                  error={errors.submitter_name?.message}
                />
                <Input
                  {...register('submitter_email')}
                  type="email"
                  label="Your Email *"
                  placeholder="Enter your email address"
                  error={errors.submitter_email?.message}
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Location *
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

              {/* Meeting Type */}
              <div className="mb-6">
                <Select
                  {...register('meeting_type')}
                  label="Meeting Type *"
                  error={errors.meeting_type?.message}
                >
                  <option value="">Select meeting type</option>
                  {Object.entries(meetingTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>

              {/* Title */}
              <div className="mb-6">
                <Input
                  type="text"
                  {...register('title')}
                  label="Meeting Title *"
                  placeholder="e.g., Q4 Planning Discussion"
                  error={errors.title?.message}
                />
              </div>

              {/* Purpose */}
              <div className="mb-6">
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose/Description *
                </label>
                <textarea
                  id="purpose"
                  rows={3}
                  {...register('purpose')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Explain the purpose and expected outcomes of this meeting..."
                />
                {errors.purpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
                )}
              </div>

              {/* Preferred Dates/Times */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Preferred Date/Time Options *
                  </label>
                  <button
                    type="button"
                    onClick={addPreferredDate}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </button>
                </div>

                {preferredDates.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-md">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No date/time options added yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Option" to suggest meeting times.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {preferredDates.map((dateOption, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Option {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removePreferredDate(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Date</label>
                            <Input
                              type="date"
                              value={dateOption.date}
                              onChange={(e) => updatePreferredDate(index, 'date', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                            <Input
                              type="time"
                              value={dateOption.start_time}
                              onChange={(e) => updatePreferredDate(index, 'start_time', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">End Time</label>
                            <Input
                              type="time"
                              value={dateOption.end_time}
                              onChange={(e) => updatePreferredDate(index, 'end_time', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.preferred_dates && (
                  <p className="mt-1 text-sm text-red-600">{errors.preferred_dates.message}</p>
                )}
              </div>

              {/* Participants */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participants *
                </label>
                <textarea
                  {...register('participants')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="List the names and/or departments of expected participants..."
                />
                {errors.participants && (
                  <p className="mt-1 text-sm text-red-600">{errors.participants.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                outline
                onClick={() => router.push('/forms')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="blue"
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
