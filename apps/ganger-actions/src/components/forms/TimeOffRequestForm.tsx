import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimeOffRequestFormData } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@ganger/ui';
// TODO: Fix date-fns import issue - temporarily commented
// import { addDays, differenceInDays, isSameDay, isWeekend } from 'date-fns';

// Temporary implementations until date-fns import is fixed
const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};
const differenceInDays = (date1: Date, date2: Date) => {
  const timeDiff = date1.getTime() - date2.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const timeOffRequestSchema = z.object({
  dateRange: z.object({
    startDate: z.date({
      required_error: 'Start date is required',
    }),
    endDate: z.date({
      required_error: 'End date is required',
    }),
  }).refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  }),
  ptoElection: z.enum(['Paid Time Off', 'Unpaid Leave', 'Sick Leave'], {
    required_error: 'Please select time off type',
  }),
  reason: z.string()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional(),
});

interface TimeOffRequestFormProps {
  onSubmit: (data: TimeOffRequestFormData) => void;
  loading?: boolean;
}

const holidays2025 = [
  new Date('2025-01-01'), // New Year's Day
  new Date('2025-01-20'), // MLK Day
  new Date('2025-02-17'), // Presidents Day
  new Date('2025-05-26'), // Memorial Day
  new Date('2025-07-04'), // Independence Day
  new Date('2025-09-01'), // Labor Day
  new Date('2025-10-13'), // Columbus Day
  new Date('2025-11-11'), // Veterans Day
  new Date('2025-11-27'), // Thanksgiving
  new Date('2025-12-25'), // Christmas
];

export const TimeOffRequestForm = ({ onSubmit, loading = false }: TimeOffRequestFormProps) => {
  const { authUser } = useAuth();
  const [businessDays, setBusinessDays] = useState(0);
  const [hasHolidays, setHasHolidays] = useState(false);
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<TimeOffRequestFormData>({
    resolver: zodResolver(timeOffRequestSchema),
  });

  const watchedDateRange = watch('dateRange');

  useEffect(() => {
    if (watchedDateRange?.startDate && watchedDateRange?.endDate) {
      calculateBusinessDays(watchedDateRange.startDate, watchedDateRange.endDate);
    }
  }, [watchedDateRange]);

  const calculateBusinessDays = (startDate: Date, endDate: Date) => {
    let count = 0;
    let holidayCount = 0;
    let current = new Date(startDate);

    while (current <= endDate) {
      if (!isWeekend(current)) {
        count++;
        // Check if current date is a holiday
        if (holidays2025.some(holiday => isSameDay(current, holiday))) {
          holidayCount++;
        }
      }
      current = addDays(current, 1);
    }

    setBusinessDays(count);
    setHasHolidays(holidayCount > 0);
  };

  const isWithinAdvanceNotice = (startDate: Date) => {
    const now = new Date();
    const hoursUntilStart = differenceInDays(startDate, now) * 24;
    return hoursUntilStart >= 48; // 48 hours advance notice
  };

  const getMinDate = () => {
    const tomorrow = addDays(new Date(), 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const advanceNoticeOk = watchedDateRange?.startDate ? 
    isWithinAdvanceNotice(watchedDateRange.startDate) : true;

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <Clock className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Time Off Request Guidelines</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Submit requests at least 48 hours in advance</li>
                <li>Manager approval required for all time off</li>
                <li>Check team calendar to avoid scheduling conflicts</li>
                <li>Sick leave can be submitted retroactively</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <Controller
              name="dateRange.startDate"
              control={control}
              render={({ field }) => (
                <input
                  type="date"
                  {...field}
                  value={field.value ? field.value.toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  min={getMinDate()}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              )}
            />
            {errors.dateRange?.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dateRange.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <Controller
              name="dateRange.endDate"
              control={control}
              render={({ field }) => (
                <input
                  type="date"
                  {...field}
                  value={field.value ? field.value.toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  min={watchedDateRange?.startDate ? 
                    watchedDateRange.startDate.toISOString().split('T')[0] : 
                    getMinDate()}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              )}
            />
            {errors.dateRange?.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dateRange.endDate.message}</p>
            )}
          </div>
        </div>

        {/* Date Range Summary */}
        {watchedDateRange?.startDate && watchedDateRange?.endDate && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Request Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Business Days:</span>
                <p className="font-medium">{businessDays}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Days:</span>
                <p className="font-medium">
                  {differenceInDays(watchedDateRange.endDate, watchedDateRange.startDate) + 1}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Advance Notice:</span>
                <p className={`font-medium ${advanceNoticeOk ? 'text-green-600' : 'text-red-600'}`}>
                  {advanceNoticeOk ? 'Sufficient' : 'Less than 48h'}
                </p>
              </div>
              {hasHolidays && (
                <div>
                  <span className="text-gray-500">Note:</span>
                  <p className="font-medium text-blue-600">Includes holidays</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advance Notice Warning */}
        {!advanceNoticeOk && watchedDateRange?.startDate && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Insufficient Advance Notice
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  This request does not meet the 48-hour advance notice requirement. 
                  Approval may be delayed or denied unless this is for sick leave.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Time Off Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Time Off Type *
          </label>
          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="radio"
                {...register('ptoElection')}
                value="Paid Time Off"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-0.5"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">Paid Time Off (PTO)</span>
                <p className="text-sm text-gray-500">
                  Use accrued vacation time. Requires manager approval.
                </p>
              </div>
            </label>
            
            <label className="flex items-start">
              <input
                type="radio"
                {...register('ptoElection')}
                value="Unpaid Leave"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-0.5"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">Unpaid Leave</span>
                <p className="text-sm text-gray-500">
                  Time off without pay. May require additional documentation.
                </p>
              </div>
            </label>
            
            <label className="flex items-start">
              <input
                type="radio"
                {...register('ptoElection')}
                value="Sick Leave"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-0.5"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">Sick Leave</span>
                <p className="text-sm text-gray-500">
                  For illness or medical appointments. Can be submitted retroactively.
                </p>
              </div>
            </label>
          </div>
          {errors.ptoElection && (
            <p className="mt-2 text-sm text-red-600">{errors.ptoElection.message}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason (Optional)
          </label>
          <textarea
            {...register('reason')}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Provide additional context for your time off request..."
          />
          <div className="mt-1 flex justify-between">
            {errors.reason ? (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            ) : (
              <p className="text-sm text-gray-500">
                Optional: Provide context to help with approval.
              </p>
            )}
            <span className="text-sm text-gray-500">
              {watch('reason')?.length || 0}/500
            </span>
          </div>
        </div>

        {/* Manager Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Approval Process</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Your request will be sent to your direct manager for approval</p>
            <p>• You will receive email notification when a decision is made</p>
            <p>• Approved time off will automatically update your schedule</p>
            {authUser?.manager && (
              <p>• Manager: <span className="font-medium">{authUser.manager}</span></p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            leftIcon={<Calendar className="h-4 w-4" />}
          >
            {loading ? 'Submitting...' : 'Submit Time Off Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};