import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreateIssueForm } from '@/types/eos';
import { 
  X, 
  AlertTriangle, 
  User, 
  CheckCircle, 
  Flag, 
  MessageSquare,
  Save,
  Plus
} from 'lucide-react';

interface IssueFormProps {
  onSubmit: (data: CreateIssueForm) => void;
  onClose: () => void;
  initialData?: Partial<CreateIssueForm>;
}

const issueTypes = [
  { value: 'obstacle', label: 'Obstacle', icon: AlertTriangle, color: 'text-red-600', description: 'Something blocking progress' },
  { value: 'opportunity', label: 'Opportunity', icon: Flag, color: 'text-green-600', description: 'Potential improvement or growth' },
  { value: 'process', label: 'Process', icon: CheckCircle, color: 'text-blue-600', description: 'Process improvement needed' },
  { value: 'people', label: 'People', icon: User, color: 'text-purple-600', description: 'People-related issue' },
  { value: 'other', label: 'Other', icon: MessageSquare, color: 'text-gray-600', description: 'General issue or topic' }
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-500', description: 'Can wait for future discussion' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500', description: 'Should be addressed soon' },
  { value: 'high', label: 'High', color: 'bg-orange-500', description: 'Needs attention this week' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500', description: 'Urgent - blocks team progress' }
];

export default function IssueForm({ onSubmit, onClose, initialData }: IssueFormProps) {
  const teamMembers: any[] = []; // Fix team members access
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateIssueForm>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      type: initialData?.type || 'other',
      priority: initialData?.priority || 'medium',
      owner_id: initialData?.owner_id || undefined
    }
  });

  const selectedType = watch('type');
  const selectedPriority = watch('priority');

  const handleFormSubmit = async (data: CreateIssueForm) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Edit Issue' : 'Identify New Issue'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-4 space-y-6">
            {/* Issue Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Title *
              </label>
              <input
                {...register('title', { 
                  required: 'Issue title is required',
                  minLength: { value: 3, message: 'Title must be at least 3 characters' }
                })}
                type="text"
                placeholder="Describe the issue in one line..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eos-500 focus:border-transparent"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Issue Type *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {issueTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.value;
                  
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setValue('type', type.value as any)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-eos-500 bg-eos-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${type.color}`} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{type.label}</p>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 bg-eos-500 rounded-full" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {priorities.map((priority) => {
                  const isSelected = selectedPriority === priority.value;
                  
                  return (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => setValue('priority', priority.value as any)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-eos-500 bg-eos-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{priority.label}</p>
                          <p className="text-xs text-gray-600 truncate">{priority.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 bg-eos-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Provide more details about the issue..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eos-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: Add context, examples, or potential impact
              </p>
            </div>

            {/* Assign to Team Member */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Team Member
              </label>
              <select
                {...register('owner_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eos-500 focus:border-transparent"
              >
                <option value="">No assignment (discuss as team)</option>
                {teamMembers?.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user.full_name} ({member.seat})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Optional: Who should take ownership of this issue?
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-eos-600 text-white px-4 py-2 rounded-lg hover:bg-eos-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    {initialData ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    <span>{initialData ? 'Update Issue' : 'Create Issue'}</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              Issues will be reviewed in your next Level 10 meeting
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}