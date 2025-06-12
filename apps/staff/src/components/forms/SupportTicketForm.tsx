import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SupportTicketFormData } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Paperclip, X } from 'lucide-react';
import { useState } from 'react';

const supportTicketSchema = z.object({
  location: z.enum(['Northfield', 'Woodbury', 'Burnsville'], {
    required_error: 'Please select a location',
  }),
  requestType: z.enum([
    'General Support',
    'Equipment Issue', 
    'Software Problem',
    'Network Issue',
    'Other'
  ], {
    required_error: 'Please select a request type',
  }),
  priority: z.object({
    urgency: z.enum(['Urgent', 'Not Urgent'], {
      required_error: 'Please select urgency level',
    }),
    importance: z.enum(['Important', 'Not Important'], {
      required_error: 'Please select importance level',
    }),
  }),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  attachments: z.array(z.instanceof(File)).max(10, 'Maximum 10 files allowed'),
});

interface SupportTicketFormProps {
  onSubmit: (data: SupportTicketFormData) => void;
  loading?: boolean;
}

export const SupportTicketForm = ({ onSubmit, loading = false }: SupportTicketFormProps) => {
  const { authUser } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<SupportTicketFormData>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      location: authUser?.location,
      attachments: [],
    },
  });

  const watchedValues = watch();
  const description = watch('description', '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = [...files, ...selectedFiles].slice(0, 10);
    setFiles(newFiles);
    setValue('attachments', newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setValue('attachments', newFiles);
  };

  const getPriorityLevel = () => {
    const { urgency, importance } = watchedValues.priority || {};
    if (urgency === 'Urgent' && importance === 'Important') return 'urgent';
    if (urgency === 'Urgent' || importance === 'Important') return 'high';
    return 'medium';
  };

  const priorityLevel = getPriorityLevel();
  const priorityColors = {
    urgent: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  };

  const totalFileSize = files.reduce((acc, file) => acc + file.size, 0);
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <select
          {...register('location')}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">Select location</option>
          <option value="Northfield">Northfield</option>
          <option value="Woodbury">Woodbury</option>
          <option value="Burnsville">Burnsville</option>
        </select>
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>

      {/* Request Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Request Type *
        </label>
        <select
          {...register('requestType')}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">Select request type</option>
          <option value="General Support">General Support</option>
          <option value="Equipment Issue">Equipment Issue</option>
          <option value="Software Problem">Software Problem</option>
          <option value="Network Issue">Network Issue</option>
          <option value="Other">Other</option>
        </select>
        {errors.requestType && (
          <p className="mt-1 text-sm text-red-600">{errors.requestType.message}</p>
        )}
      </div>

      {/* Priority Matrix */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Priority Assessment *
        </label>
        <div className="space-y-4">
          {/* Urgency */}
          <div>
            <span className="text-sm text-gray-600 mb-2 block">How urgent is this issue?</span>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('priority.urgency')}
                  value="Urgent"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Urgent - Blocking my work or affecting patients
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('priority.urgency')}
                  value="Not Urgent"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Not Urgent - Can wait for normal support hours
                </span>
              </label>
            </div>
            {errors.priority?.urgency && (
              <p className="mt-1 text-sm text-red-600">{errors.priority.urgency.message}</p>
            )}
          </div>

          {/* Importance */}
          <div>
            <span className="text-sm text-gray-600 mb-2 block">How important is this issue?</span>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('priority.importance')}
                  value="Important"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Important - Critical for daily operations
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('priority.importance')}
                  value="Not Important"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Not Important - Nice to have improvement
                </span>
              </label>
            </div>
            {errors.priority?.importance && (
              <p className="mt-1 text-sm text-red-600">{errors.priority.importance.message}</p>
            )}
          </div>

          {/* Priority Result */}
          {watchedValues.priority?.urgency && watchedValues.priority?.importance && (
            <div className={`p-3 rounded-md border ${priorityColors[priorityLevel]}`}>
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  Calculated Priority: {priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          {...register('description')}
          rows={6}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="Please describe the issue in detail. Include what you were trying to do, what happened, and any error messages you saw."
        />
        <div className="mt-1 flex justify-between">
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          ) : (
            <p className="text-sm text-gray-500">
              Provide as much detail as possible to help us resolve your issue quickly.
            </p>
          )}
          <span className={`text-sm ${description.length > 1900 ? 'text-red-600' : 'text-gray-500'}`}>
            {description.length}/2000
          </span>
        </div>
      </div>

      {/* File Attachments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachments
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
          <div className="space-y-1 text-center">
            <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                <span>Upload files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, PDF, DOC up to 50MB total (max 10 files)
            </p>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <Paperclip className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="text-xs text-gray-500">
              Total size: {(totalFileSize / 1024 / 1024).toFixed(1)} MB / 50 MB
            </div>
            {totalFileSize > maxFileSize && (
              <p className="text-sm text-red-600">
                Total file size exceeds 50MB limit. Please remove some files.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || totalFileSize > maxFileSize}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Support Ticket'}
        </button>
      </div>
    </form>
  );
};