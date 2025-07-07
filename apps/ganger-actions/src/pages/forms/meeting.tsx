import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Users, Calendar, MapPin, Video, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const meetingSchema = z.object({
  meeting_type: z.enum(['one_on_one', 'team', 'department', 'all_hands', 'training', 'other']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  purpose: z.string().min(20, 'Please provide at least 20 characters explaining the meeting purpose'),
  preferred_dates: z.array(z.object({
    date: z.string(),
    start_time: z.string(),
    end_time: z.string()
  })).min(1, 'Please provide at least one preferred date/time'),
  duration: z.string(),
  format: z.enum(['in_person', 'virtual', 'hybrid']),
  location: z.string().optional(),
  attendees: z.string().min(1, 'Please specify who should attend'),
  agenda: z.string().min(10, 'Please provide an agenda'),
  materials_needed: z.string().optional(),
  special_requirements: z.string().optional()
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
      meeting_type: 'one_on_one',
      format: 'in_person',
      duration: '1 hour',
      preferred_dates: []
    }
  });

  const format = watch('format');

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
          meeting_type: data.meeting_type,
          title: data.title,
          purpose: data.purpose,
          preferred_dates: data.preferred_dates,
          duration: data.duration,
          format: data.format,
          location: data.location || null,
          attendees: data.attendees,
          agenda: data.agenda,
          materials_needed: data.materials_needed || null,
          special_requirements: data.special_requirements || null
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
              {/* Meeting Type */}
              <div className="mb-6">
                <label htmlFor="meeting_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Type *
                </label>
                <select
                  id="meeting_type"
                  {...register('meeting_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(meetingTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.meeting_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.meeting_type.message}</p>
                )}
              </div>

              {/* Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  id="title"
                  {...register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Q4 Planning Discussion"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
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
                            <input
                              type="date"
                              value={dateOption.date}
                              onChange={(e) => updatePreferredDate(index, 'date', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={dateOption.start_time}
                              onChange={(e) => updatePreferredDate(index, 'start_time', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">End Time</label>
                            <input
                              type="time"
                              value={dateOption.end_time}
                              onChange={(e) => updatePreferredDate(index, 'end_time', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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

              {/* Duration */}
              <div className="mb-6">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Duration *
                </label>
                <select
                  id="duration"
                  {...register('duration')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {durationOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>

              {/* Format */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Format *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="in_person"
                      {...register('format')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <MapPin className="h-4 w-4 text-gray-400 ml-2 mr-1" />
                    <span className="text-sm text-gray-700">In-Person</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="virtual"
                      {...register('format')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <Video className="h-4 w-4 text-gray-400 ml-2 mr-1" />
                    <span className="text-sm text-gray-700">Virtual (Video Call)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="hybrid"
                      {...register('format')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Hybrid (Both Options)</span>
                  </label>
                </div>
                {errors.format && (
                  <p className="mt-1 text-sm text-red-600">{errors.format.message}</p>
                )}
              </div>

              {/* Location (if not virtual) */}
              {(format === 'in_person' || format === 'hybrid') && (
                <div className="mb-6">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    {...register('location')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Conference Room A, Ann Arbor Office"
                  />
                </div>
              )}

              {/* Attendees */}
              <div className="mb-6">
                <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-2">
                  Required Attendees *
                </label>
                <textarea
                  id="attendees"
                  rows={3}
                  {...register('attendees')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="List names, departments, or roles of required attendees..."
                />
                {errors.attendees && (
                  <p className="mt-1 text-sm text-red-600">{errors.attendees.message}</p>
                )}
              </div>

              {/* Agenda */}
              <div className="mb-6">
                <label htmlFor="agenda" className="block text-sm font-medium text-gray-700 mb-2">
                  Agenda *
                </label>
                <textarea
                  id="agenda"
                  rows={4}
                  {...register('agenda')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Outline the topics to be discussed..."
                />
                {errors.agenda && (
                  <p className="mt-1 text-sm text-red-600">{errors.agenda.message}</p>
                )}
              </div>

              {/* Materials Needed */}
              <div className="mb-6">
                <label htmlFor="materials_needed" className="block text-sm font-medium text-gray-700 mb-2">
                  Materials/Resources Needed (Optional)
                </label>
                <textarea
                  id="materials_needed"
                  rows={2}
                  {...register('materials_needed')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Projector, whiteboard, specific documents..."
                />
              </div>

              {/* Special Requirements */}
              <div className="mb-6">
                <label htmlFor="special_requirements" className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements (Optional)
                </label>
                <textarea
                  id="special_requirements"
                  rows={2}
                  {...register('special_requirements')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Catering needed, accessibility requirements..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/forms')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}