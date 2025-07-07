import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Ticket, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@ganger/ui';

const supportTicketSchema = z.object({
  location: z.enum(['Ann Arbor', 'Wixom', 'Plymouth', 'Any/All']),
  request_type: z.enum([
    'Property Maintenance (Outdoor)',
    'Building Maintenance (Indoor)', 
    'IT (Network/Computer/Software)',
    'Clinic Issue',
    'Admin Issue',
    'Information Request',
    'General Support',
    'Meeting Request'
  ]),
  priority: z.enum([
    'Urgent + Important',
    'Urgent + Not Important',
    'Not Urgent + Important',
    'Not Urgent + Not Important'
  ]),
  details: z.string().min(10, 'Please provide at least 10 characters of detail'),
  photos: z.array(z.instanceof(File)).optional()
});

type SupportTicketFormData = z.infer<typeof supportTicketSchema>;

const requestTypeLabels = {
  'Property Maintenance (Outdoor)': 'Property Maintenance (Outdoor)',
  'Building Maintenance (Indoor)': 'Building Maintenance (Indoor)',
  'IT (Network/Computer/Software)': 'IT (Network/Computer/Software)',
  'Clinic Issue': 'Clinic Issue',
  'Admin Issue': 'Admin Issue',
  'Information Request': 'Information Request',
  'General Support': 'General Support',
  'Meeting Request': 'Meeting Request'
};

const priorityLabels = {
  'Urgent + Important': '🔴 Urgent + Important',
  'Urgent + Not Important': '🟠 Urgent + Not Important',
  'Not Urgent + Important': '🟡 Not Urgent + Important',
  'Not Urgent + Not Important': '🟢 Not Urgent + Not Important'
};

export default function SupportTicketForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<SupportTicketFormData>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      location: 'Ann Arbor',
      request_type: 'General Support',
      priority: 'Not Urgent + Not Important'
    }
  });

  const submitTicket = useMutation({
    mutationFn: async (data: SupportTicketFormData) => {
      // Prepare ticket data for API
      const ticketData = {
        title: `${data.request_type} - ${data.location}`,
        description: data.details,
        form_type: 'support_ticket',
        form_data: {
          submitter_name: user?.name || '',
          submitter_email: user?.email || '',
          location: data.location,
          request_type: data.request_type,
          priority: data.priority,
          details: data.details,
          photos: '' // File upload handled separately
        },
        priority: data.priority.includes('Urgent') ? 'urgent' : data.priority.includes('Important') ? 'high' : 'normal',
        location: data.location
      };

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit ticket');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Support ticket submitted successfully!',
        variant: 'success'
      });
      router.push('/tickets');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit ticket. Please try again.',
        variant: 'error'
      });
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: SupportTicketFormData) => {
    submitTicket.mutate(data);
  };

  return (
    <DashboardLayout title="Support Ticket">
      <div className="py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Ticket className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Submit Support Ticket</h1>
            </div>
            <p className="text-sm text-gray-600">
              Report issues with equipment, facilities, IT, or request general support.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              {/* Location */}
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

              {/* Request Type */}
              <div className="mb-6">
                <label htmlFor="request_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type *
                </label>
                <select
                  id="request_type"
                  {...register('request_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(requestTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.request_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.request_type.message}</p>
                )}
              </div>

              {/* Priority */}
              <div className="mb-6">
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>

              {/* Details */}
              <div className="mb-6">
                <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
                  Details *
                </label>
                <textarea
                  id="details"
                  rows={5}
                  {...register('details')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Please describe the issue or request in detail..."
                />
                {errors.details && (
                  <p className="mt-1 text-sm text-red-600">{errors.details.message}</p>
                )}
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos/Attachments
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF, DOC up to 10MB each
                    </p>
                  </div>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 h-auto p-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => router.push('/forms')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}