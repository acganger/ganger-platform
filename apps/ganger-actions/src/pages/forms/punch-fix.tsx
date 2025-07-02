import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@ganger/ui';

const punchFixSchema = z.object({
  punch_type: z.enum(['missed_in', 'missed_out', 'missed_both', 'incorrect_time', 'other']),
  date: z.string().min(1, 'Date is required'),
  scheduled_in: z.string().optional(),
  scheduled_out: z.string().optional(),
  actual_in: z.string().optional(),
  actual_out: z.string().optional(),
  reason: z.string().min(10, 'Please provide at least 10 characters explaining the issue'),
  supervisor_aware: z.boolean().default(false)
});

type PunchFixFormData = z.infer<typeof punchFixSchema>;

const punchTypeLabels = {
  missed_in: 'Missed Clock In',
  missed_out: 'Missed Clock Out',
  missed_both: 'Missed Both Punches',
  incorrect_time: 'Incorrect Time Recorded',
  other: 'Other Issue'
};

export default function PunchFixRequestForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<PunchFixFormData>({
    resolver: zodResolver(punchFixSchema),
    defaultValues: {
      punch_type: 'missed_in',
      supervisor_aware: false
    }
  });

  const punchType = watch('punch_type');

  const submitRequest = useMutation({
    mutationFn: async (data: PunchFixFormData) => {
      const formData = {
        title: `Punch Fix Request - ${punchTypeLabels[data.punch_type]}`,
        description: data.reason,
        form_type: 'punch_fix_request',
        form_data: {
          punch_type: data.punch_type,
          date: data.date,
          scheduled_in: data.scheduled_in || null,
          scheduled_out: data.scheduled_out || null,
          actual_in: data.actual_in || null,
          actual_out: data.actual_out || null,
          reason: data.reason,
          supervisor_aware: data.supervisor_aware
        },
        priority: 'high' // Payroll-related issues are high priority
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
        description: 'Punch fix request submitted successfully!',
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

  const onSubmit = (data: PunchFixFormData) => {
    submitRequest.mutate(data);
  };

  return (
    <DashboardLayout title="Punch Fix Request">
      <div className="py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Clock className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Punch Fix Request</h1>
            </div>
            <p className="text-sm text-gray-600">
              Report missed or incorrect time clock punches for payroll correction.
            </p>
          </div>

          {/* Alert */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Important:</p>
                <p>Submit punch fix requests as soon as possible to ensure accurate payroll processing. Multiple missed punches may require supervisor approval.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              {/* Issue Type */}
              <div className="mb-6">
                <label htmlFor="punch_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <select
                  id="punch_type"
                  {...register('punch_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(punchTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.punch_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.punch_type.message}</p>
                )}
              </div>

              {/* Date */}
              <div className="mb-6">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Issue *
                </label>
                <input
                  type="date"
                  id="date"
                  {...register('date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              {/* Scheduled Times */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Scheduled Times</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="scheduled_in" className="block text-sm text-gray-600 mb-1">
                      Scheduled In
                    </label>
                    <input
                      type="time"
                      id="scheduled_in"
                      {...register('scheduled_in')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="scheduled_out" className="block text-sm text-gray-600 mb-1">
                      Scheduled Out
                    </label>
                    <input
                      type="time"
                      id="scheduled_out"
                      {...register('scheduled_out')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actual Times */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Actual Times Worked</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="actual_in" className="block text-sm text-gray-600 mb-1">
                      Actual In
                    </label>
                    <input
                      type="time"
                      id="actual_in"
                      {...register('actual_in')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="actual_out" className="block text-sm text-gray-600 mb-1">
                      Actual Out
                    </label>
                    <input
                      type="time"
                      id="actual_out"
                      {...register('actual_out')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation *
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  {...register('reason')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Please explain what happened and why the punch was missed or incorrect..."
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                )}
              </div>

              {/* Supervisor Aware */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('supervisor_aware')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I have notified my supervisor about this issue
                  </span>
                </label>
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