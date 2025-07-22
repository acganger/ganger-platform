import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/router';
import { Card, CardContent } from '@ganger/ui-catalyst';
import { 
  Ticket, 
  Calendar,
  Clock,
  Users,
  DollarSign,
  MessageSquare,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface FormType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  category: 'request' | 'hr' | 'business' | 'innovation';
}

const forms: FormType[] = [
  {
    id: 'support',
    title: 'Support Ticket',
    description: 'Report issues with equipment, facilities, IT, or request general support.',
    icon: Ticket,
    href: '/forms/support',
    category: 'request'
  },
  {
    id: 'time-off',
    title: 'Time Off Request',
    description: 'Submit vacation, sick leave, or other time off requests.',
    icon: Calendar,
    href: '/forms/time-off',
    category: 'hr'
  },
  {
    id: 'punch-fix',
    title: 'Punch Fix',
    description: 'Correct clock in/out times and attendance records.',
    icon: Clock,
    href: '/forms/punch-fix',
    category: 'hr'
  },
  {
    id: 'availability',
    title: 'Change of Availability',
    description: 'Update your work schedule, availability, or employment status.',
    icon: Users,
    href: '/forms/availability',
    category: 'hr'
  },
  {
    id: 'expense',
    title: 'Expense Reimbursement',
    description: 'Submit receipts and request reimbursement for business expenses.',
    icon: DollarSign,
    href: '/forms/expense',
    category: 'business'
  },
  {
    id: 'meeting',
    title: 'Meeting Request',
    description: 'Schedule meetings with specific team members or departments.',
    icon: MessageSquare,
    href: '/forms/meeting',
    category: 'business'
  },
  {
    id: 'impact',
    title: 'Impact Filter',
    description: 'Submit innovative ideas and suggestions for improvement.',
    icon: Lightbulb,
    href: '/forms/impact',
    category: 'innovation'
  }
];

const categoryLabels = {
  request: 'Support & Requests',
  hr: 'HR & Scheduling',
  business: 'Business Operations',
  innovation: 'Ideas & Innovation'
};

const categoryColors = {
  request: 'bg-blue-50 text-blue-700 border-blue-200',
  hr: 'bg-green-50 text-green-700 border-green-200',
  business: 'bg-purple-50 text-purple-700 border-purple-200',
  innovation: 'bg-yellow-50 text-yellow-700 border-yellow-200'
};

export default function FormsPage() {
  const router = useRouter();

  const formsByCategory = forms.reduce((acc, form) => {
    if (!acc[form.category]) {
      acc[form.category] = [];
    }
    acc[form.category].push(form);
    return acc;
  }, {} as Record<string, FormType[]>);

  return (
    <DashboardLayout title="Submit Request">
      <div className="py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Submit a Request</h1>
          <p className="mt-1 text-sm text-gray-600">
            Choose from the available forms below to submit your request.
          </p>
        </div>

        {/* Forms by Category */}
        {Object.entries(formsByCategory).map(([category, categoryForms]) => (
          <div key={category} className="mb-10">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryForms.map((form) => (
                <Card
                  key={form.id}
                  onClick={() => router.push(form.href)}
                  className={`relative group border-2 hover:shadow-md transition-all cursor-pointer ${
                    categoryColors[form.category]
                  }`}
                >
                  <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <form.icon className="h-6 w-6 mr-3" />
                        <h3 className="text-lg font-medium">{form.title}</h3>
                      </div>
                      <p className="text-sm opacity-90">
                        {form.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 ml-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Stats */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-semibold text-gray-900">12</p>
                <p className="text-sm text-gray-600">Open Requests</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-semibold text-gray-900">3</p>
                <p className="text-sm text-gray-600">Pending Approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-semibold text-gray-900">94%</p>
                <p className="text-sm text-gray-600">Resolution Rate</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
