import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth-eos';
import { CreateTodoForm } from '@/types/eos';
import { format, addDays, addWeeks } from 'date-fns';
import { 
  X, 
  Calendar,
  User,
  Flag,
  AlertTriangle,
  Save,
  Plus,
  Clock
} from 'lucide-react';

interface TodoFormProps {
  onSubmit: (data: CreateTodoForm) => void;
  onClose: () => void;
  initialData?: Partial<CreateTodoForm>;
}

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-500', description: 'Can be done later' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500', description: 'Should be done soon' },
  { value: 'high', label: 'High', color: 'bg-red-500', description: 'Needs immediate attention' }
];

const dueDatePresets = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Week', value: 'this_week' },
  { label: 'Next Week', value: 'next_week' },
  { label: 'Custom', value: 'custom' }
];

export default function TodoForm({ onSubmit, onClose, initialData }: TodoFormProps) {
  const teamMembers: any[] = []; // Fix team members access
  const user = null; // Fix user access
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dueDatePreset, setDueDatePreset] = useState('this_week');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateTodoForm>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      assigned_to: initialData?.assigned_to || '',
      due_date: initialData?.due_date || format(addWeeks(new Date(), 1), 'yyyy-MM-dd'),
      priority: initialData?.priority || 'medium'
    }
  });

  const selectedPriority = watch('priority');

  const handleFormSubmit = async (data: CreateTodoForm) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDueDatePresetChange = (preset: string) => {
    setDueDatePreset(preset);
    
    if (preset !== 'custom') {
      let date: Date;
      
      switch (preset) {
        case 'today':
          date = new Date();
          break;
        case 'tomorrow':
          date = addDays(new Date(), 1);
          break;
        case 'this_week':
          date = addDays(new Date(), 7);
          break;
        case 'next_week':
          date = addWeeks(new Date(), 1);
          break;
        default:
          date = new Date();
      }
      
      setValue('due_date', format(date, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Edit Todo' : 'Create New Todo'}
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
            {/* Todo Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Todo Title *
              </label>
              <input
                {...register('title', { 
                  required: 'Todo title is required',
                  minLength: { value: 3, message: 'Title must be at least 3 characters' }
                })}
                type="text"
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eos-500 focus:border-transparent"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Add more details about this todo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eos-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: Provide context or specific requirements
              </p>
            </div>

            {/* Assign to Team Member */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Team Member *
              </label>
              <select
                {...register('assigned_to', { required: 'Please assign this todo to someone' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eos-500 focus:border-transparent"
              >
                <option value="">Select team member...</option>
                {teamMembers?.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user.full_name} ({member.seat})
                  </option>
                ))}
              </select>
              {errors.assigned_to && (
                <p className="mt-1 text-sm text-red-600">{errors.assigned_to.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Who is responsible for completing this todo?
              </p>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Due Date *
              </label>
              
              {/* Due Date Presets */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {dueDatePresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleDueDatePresetChange(preset.value)}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      dueDatePreset === preset.value
                        ? 'border-eos-500 bg-eos-50 text-eos-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Input */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('due_date', { required: 'Due date is required' })}
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eos-500 focus:border-transparent"
                />
              </div>
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority *
              </label>
              <div className="grid grid-cols-1 gap-2">
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
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{priority.label}</p>
                          <p className="text-sm text-gray-600">{priority.description}</p>
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

            {/* Meeting Context */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Level 10 Meeting Integration
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This todo will be tracked in your team's Level 10 meetings and can be marked as completed during the todo review segment.
                  </p>
                </div>
              </div>
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
                    <span>{initialData ? 'Update Todo' : 'Create Todo'}</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              Todos help track action items and ensure accountability in your team
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}