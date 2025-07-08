import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SupportTicketFormData } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Paperclip, X } from 'lucide-react';
import { useState } from 'react';
import { Button, Input, Select } from '@ganger/ui';

const supportTicketSchema = z.object({
  location: z.enum(['Wixom', 'Ann Arbor', 'Plymouth'], {
    required_error: 'Please select a location',
  }),
  request_type: z.enum([
    'General Support',
    'Equipment Issue', 
    'Software Problem',
    'Network Issue',
    'Other'
  ], {
    required_error: 'Please select a request type',
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: 'Please select priority level',
  }),
  details: z.string()
    .min(10, 'Details must be at least 10 characters')
    .max(2000, 'Details cannot exceed 2000 characters'),
  submitter_name: z.string().min(1, 'Name is required'),
  submitter_email: z.string().email('Valid email is required'),
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
      location: (authUser?.location as 'Wixom' | 'Ann Arbor' | 'Plymouth' | undefined) || undefined,
      submitter_name: authUser?.name || '',
      submitter_email: authUser?.email || '',
      attachments: [],
    },
  });

  const watchedValues = watch();
  const details = watch('details', '');

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


  const totalFileSize = files.reduce((acc, file) => acc + file.size, 0);
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as SupportTicketFormData))} className="space-y-6">
      {/* Location */}
      <Select
        {...register('location')}
        label="Location *"
        placeholder="Select location"
        options={[
          { value: 'Wixom', label: 'Wixom' },
          { value: 'Ann Arbor', label: 'Ann Arbor' },
          { value: 'Plymouth', label: 'Plymouth' }
        ]}
        error={errors.location?.message}
      />

      {/* Request Type */}
      <Select
        {...register('request_type')}
        label="Request Type *"
        placeholder="Select request type"
        options={[
          { value: 'General Support', label: 'General Support' },
          { value: 'Equipment Issue', label: 'Equipment Issue' },
          { value: 'Software Problem', label: 'Software Problem' },
          { value: 'Network Issue', label: 'Network Issue' },
          { value: 'Other', label: 'Other' }
        ]}
        error={errors.request_type?.message}
      />

      {/* Priority */}
      <Select
        {...register('priority')}
        label="Priority *"
        placeholder="Select priority level"
        options={[
          { value: 'low', label: 'Low - Can wait for normal support hours' },
          { value: 'medium', label: 'Medium - Important but not urgent' },
          { value: 'high', label: 'High - Important and time-sensitive' },
          { value: 'urgent', label: 'Urgent - Blocking work or affecting patients' }
        ]}
        error={errors.priority?.message}
      />

      {/* Submitter Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Details *
        </label>
        <textarea
          {...register('details')}
          rows={6}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="Please describe the issue in detail. Include what you were trying to do, what happened, and any error messages you saw."
        />
        <div className="mt-1 flex justify-between">
          {errors.details ? (
            <p className="text-sm text-red-600">{errors.details.message}</p>
          ) : (
            <p className="text-sm text-gray-500">
              Provide as much detail as possible to help us resolve your issue quickly.
            </p>
          )}
          <span className={`text-sm ${details.length > 1900 ? 'text-red-600' : 'text-gray-500'}`}>
            {details.length}/2000
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-600 h-auto p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
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
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          disabled={totalFileSize > maxFileSize}
        >
          {loading ? 'Submitting...' : 'Submit Support Ticket'}
        </Button>
      </div>
    </form>
  );
};