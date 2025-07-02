import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SupportTicketForm } from '@/components/forms/SupportTicketForm';
import { TimeOffRequestForm } from '@/components/forms/TimeOffRequestForm';
import { 
  SupportTicketFormData, 
  TimeOffRequestFormData
} from '@/types';
import { 
  Headphones, 
  Calendar, 
  Clock, 
  Users,
  ArrowLeft,
  CheckCircle 
} from 'lucide-react';

type FormType = 'support_ticket' | 'time_off_request' | 'punch_fix' | 'change_of_availability';

const formTypes = [
  {
    id: 'support_ticket' as const,
    title: 'Support Ticket',
    description: 'Get help with IT issues, equipment problems, or general support',
    icon: Headphones,
    color: 'blue',
  },
  {
    id: 'time_off_request' as const,
    title: 'Time Off Request',
    description: 'Request vacation, sick leave, or other time off',
    icon: Calendar,
    color: 'green',
  },
  {
    id: 'punch_fix' as const,
    title: 'Punch Fix',
    description: 'Correct clock in/out times and attendance records',
    icon: Clock,
    color: 'orange',
  },
  {
    id: 'change_of_availability' as const,
    title: 'Change of Availability',
    description: 'Update your work schedule or availability preferences',
    icon: Users,
    color: 'purple',
  },
];

interface FormTypeCardProps {
  formType: typeof formTypes[0];
  selected: boolean;
  onClick: () => void;
}

const FormTypeCard = ({ formType, selected, onClick }: FormTypeCardProps) => {
  const { title, description, icon: Icon, color } = formType;
  
  const colorClasses: Record<string, {
    bg: string;
    border: string;
    icon: string;
    ring: string;
  }> = {
    blue: {
      bg: selected ? 'bg-blue-50' : 'bg-white',
      border: selected ? 'border-blue-500' : 'border-gray-200',
      icon: 'text-blue-600',
      ring: 'ring-blue-500',
    },
    green: {
      bg: selected ? 'bg-green-50' : 'bg-white',
      border: selected ? 'border-green-500' : 'border-gray-200',
      icon: 'text-green-600',
      ring: 'ring-green-500',
    },
    orange: {
      bg: selected ? 'bg-orange-50' : 'bg-white',
      border: selected ? 'border-orange-500' : 'border-gray-200',
      icon: 'text-orange-600',
      ring: 'ring-orange-500',
    },
    purple: {
      bg: selected ? 'bg-purple-50' : 'bg-white',
      border: selected ? 'border-purple-500' : 'border-gray-200',
      icon: 'text-purple-600',
      ring: 'ring-purple-500',
    },
  };

  const classes = colorClasses[color];

  return (
    <button
      onClick={onClick}
      className={`relative w-full p-6 text-left border-2 rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${classes.bg} ${classes.border} ${selected ? `${classes.ring}` : ''}`}
    >
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 p-2 rounded-lg bg-white ${classes.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        {selected && (
          <CheckCircle className="h-6 w-6 text-green-500 absolute top-4 right-4" />
        )}
      </div>
    </button>
  );
};

export default function NewTicketPage() {
  const [selectedFormType, setSelectedFormType] = useState<FormType | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleFormTypeSelect = (formType: FormType) => {
    setSelectedFormType(formType);
  };

  const handleBack = () => {
    if (selectedFormType) {
      setSelectedFormType(null);
    } else {
      router.push('/tickets');
    }
  };

  const handleSupportTicketSubmit = async (data: SupportTicketFormData) => {
    console.log('Support ticket data:', data);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setSuccess(true);
      setTimeout(() => {
        router.push('/tickets');
      }, 2000);
    } catch (error) {
      console.error('Error submitting support ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeOffSubmit = async (data: TimeOffRequestFormData) => {
    console.log('Time off request data:', data);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setSuccess(true);
      setTimeout(() => {
        router.push('/tickets');
      }, 2000);
    } catch (error) {
      console.error('Error submitting time off request:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (selectedFormType) {
      case 'support_ticket':
        return (
          <SupportTicketForm 
            onSubmit={handleSupportTicketSubmit}
            loading={loading}
          />
        );
      case 'time_off_request':
        return (
          <TimeOffRequestForm 
            onSubmit={handleTimeOffSubmit}
            loading={loading}
          />
        );
      case 'punch_fix':
        return (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-500">Punch fix form is under development.</p>
          </div>
        );
      case 'change_of_availability':
        return (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-500">Change of availability form is under development.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const selectedForm = formTypes.find(f => f.id === selectedFormType);

  if (success) {
    return (
      <DashboardLayout title="Request Submitted">
        <div className="py-6">
          <div className="max-w-md mx-auto text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Request Submitted Successfully
            </h2>
            <p className="text-gray-500 mb-6">
              Your {selectedForm?.title.toLowerCase()} has been submitted and is pending review.
              You will receive email notifications about any updates.
            </p>
            <button
              onClick={() => router.push('/tickets')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View My Tickets
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={selectedFormType ? selectedForm?.title || 'New Request' : 'New Request'}>
      <div className="py-6">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {selectedFormType ? 'Back to form types' : 'Back to tickets'}
        </button>

        {!selectedFormType ? (
          // Form Type Selection
          <div className="max-w-4xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
              <p className="mt-1 text-gray-600">
                Choose the type of request you&apos;d like to submit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formTypes.map((formType) => (
                <FormTypeCard
                  key={formType.id}
                  formType={formType}
                  selected={selectedFormType === formType.id}
                  onClick={() => handleFormTypeSelect(formType.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          // Selected Form
          <div className="max-w-3xl">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                {selectedForm && (
                  <div className={`p-2 rounded-lg bg-${selectedForm.color}-100`}>
                    <selectedForm.icon className={`h-6 w-6 text-${selectedForm.color}-600`} />
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedForm?.title}
                </h1>
              </div>
              <p className="text-gray-600">
                {selectedForm?.description}
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              {renderForm()}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}