import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { 
  Ticket, 
  Clock, 
  Users, 
  TrendingUp,
  AlertCircle,
  Calendar,
  Target,
  FileText,
  Plus,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, CardTitle, CardDescription, Badge } from '@ganger/ui';

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  completed: number;
  pending_approval: number;
}

interface DashboardData {
  ticketStats: TicketStats;
  recentTickets: any[];
  assignedTickets: any[];
  weeklyStats: {
    submitted: number;
    resolved: number;
    averageResolutionTime: number;
  };
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType,
  loading = false
}: {
  title: string;
  value: string | number;
  icon: any;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-semibold text-gray-900">
                      {value}
                    </div>
                    {change && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${changeColors[changeType || 'neutral']}`}>
                        {change}
                      </div>
                    )}
                  </>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QuickAction = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  color = 'primary' 
}: {
  title: string;
  description: string;
  icon: any;
  onClick?: () => void;
  color?: 'primary' | 'blue' | 'green' | 'yellow';
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 group-hover:bg-primary-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100',
  };

  return (
    <Card
      onClick={onClick}
      className="relative group focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <CardContent className="p-6">
        <div>
          <span className={`rounded-lg inline-flex p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </span>
        </div>
        <div className="mt-8">
          <CardTitle className="text-lg font-medium text-gray-900">{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
        <span className="absolute top-6 right-6 text-gray-300 group-hover:text-gray-400 transition-colors">
          <ArrowRight className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
};

const TicketCard = ({ 
  ticket,
  onClick
}: {
  ticket: any;
  onClick: () => void;
}) => {

  const priorityColors = {
    low: 'text-gray-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };

  const formTypeLabels = {
    support_ticket: 'Support',
    time_off_request: 'Time Off',
    punch_fix: 'Punch Fix',
    change_of_availability: 'Availability',
    expense_reimbursement: 'Expense',
    meeting_room: 'Meeting Room',
    impact_filter: 'Impact Filter',
  };

  return (
    <Card 
      onClick={onClick}
      className="hover:shadow-md transition-shadow cursor-pointer"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                #{ticket.ticket_number}
              </span>
              <Badge 
                variant={
                  ticket.status === 'open' || ticket.status === 'in_progress' ? 'primary' :
                  ticket.status === 'completed' || ticket.status === 'approved' ? 'success' :
                  ticket.status === 'pending' ? 'warning' :
                  ticket.status === 'denied' || ticket.status === 'cancelled' ? 'destructive' :
                  'secondary'
                } 
                size="sm"
              >
                {ticket.status.replace(/_/g, ' ')}
              </Badge>
              <span className="text-sm text-gray-500">
                {formTypeLabels[ticket.form_type] || ticket.form_type}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {ticket.title}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {ticket.submitter_name} • {new Date(ticket.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className={`ml-2 ${priorityColors[ticket.priority || 'medium']}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const { authUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    ticketStats: {
      total: 0,
      open: 0,
      in_progress: 0,
      completed: 0,
      pending_approval: 0,
    },
    recentTickets: [],
    assignedTickets: [],
    weeklyStats: {
      submitted: 0,
      resolved: 0,
      averageResolutionTime: 0,
    },
  });

  useEffect(() => {
    if (authUser) {
      fetchDashboardData();
    }
  }, [authUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch tickets
      const response = await fetch('/api/tickets?limit=100');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      
      const data = await response.json();
      const tickets = data.tickets || [];
      
      // Calculate stats
      const stats: TicketStats = {
        total: tickets.length,
        open: tickets.filter((t: any) => t.status === 'open').length,
        in_progress: tickets.filter((t: any) => t.status === 'in_progress').length,
        completed: tickets.filter((t: any) => t.status === 'completed').length,
        pending_approval: tickets.filter((t: any) => t.status === 'pending' || t.status === 'pending_approval').length,
      };
      
      // Get recent tickets (last 5)
      const recentTickets = tickets
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      // Get assigned tickets for managers/admins
      const assignedTickets = authUser?.role !== 'staff' 
        ? tickets.filter((t: any) => t.assigned_to_email === authUser?.email)
        : [];
      
      // Calculate weekly stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyTickets = tickets.filter((t: any) => new Date(t.created_at) >= oneWeekAgo);
      const resolvedThisWeek = weeklyTickets.filter((t: any) => 
        t.status === 'completed' || t.status === 'approved'
      );
      
      // Calculate average resolution time (in hours)
      let totalResolutionTime = 0;
      let resolvedCount = 0;
      
      resolvedThisWeek.forEach((ticket: any) => {
        if (ticket.completed_at) {
          const created = new Date(ticket.created_at);
          const completed = new Date(ticket.completed_at);
          const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
          totalResolutionTime += hours;
          resolvedCount++;
        }
      });
      
      const averageResolutionTime = resolvedCount > 0 
        ? Math.round(totalResolutionTime / resolvedCount) 
        : 0;
      
      setDashboardData({
        ticketStats: stats,
        recentTickets,
        assignedTickets,
        weeklyStats: {
          submitted: weeklyTickets.length,
          resolved: resolvedThisWeek.length,
          averageResolutionTime,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Open Tickets',
      value: dashboardData.ticketStats.open,
      icon: Ticket,
      change: '+2 from last week',
      changeType: 'positive' as const,
    },
    {
      title: 'In Progress',
      value: dashboardData.ticketStats.in_progress,
      icon: Clock,
      change: 'Same as last week',
      changeType: 'neutral' as const,
    },
    {
      title: 'Pending Approval',
      value: dashboardData.ticketStats.pending_approval,
      icon: FileText,
      change: authUser?.role !== 'staff' ? 'Needs attention' : undefined,
      changeType: 'negative' as const,
    },
    {
      title: 'Resolution Time',
      value: dashboardData.weeklyStats.averageResolutionTime ? 
        `${dashboardData.weeklyStats.averageResolutionTime}h` : 'N/A',
      icon: TrendingUp,
      change: dashboardData.weeklyStats.averageResolutionTime ? '2h faster' : undefined,
      changeType: 'positive' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Submit Support Ticket',
      description: 'Get help with IT issues, equipment problems, or general support.',
      icon: Ticket,
      color: 'primary' as const,
      onClick: () => router.push('/forms/support'),
    },
    {
      title: 'Request Time Off',
      description: 'Submit vacation, sick leave, or other time off requests.',
      icon: Calendar,
      color: 'blue' as const,
      onClick: () => router.push('/forms/time-off'),
    },
    {
      title: 'Fix Punch Time',
      description: 'Correct clock in/out times and attendance records.',
      icon: Clock,
      color: 'green' as const,
      onClick: () => router.push('/forms/punch-fix'),
    },
    {
      title: 'View All Forms',
      description: 'Browse all available forms and requests.',
      icon: FileText,
      color: 'yellow' as const,
      onClick: () => router.push('/forms'),
    },
  ];

  // Add admin/manager specific actions
  if (authUser?.role === 'admin' || authUser?.role === 'manager') {
    quickActions.push({
      title: 'User Management',
      description: 'Manage staff profiles and permissions.',
      icon: Users,
      color: 'primary' as const,
      onClick: () => router.push('/staff/users'),
    });
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {authUser?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening in your workspace today.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} loading={loading} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/forms')}
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View all forms
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.slice(0, 4).map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </div>
        </div>

        {/* Two column layout for tickets */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                  Recent Tickets
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/tickets')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : dashboardData.recentTickets.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => router.push(`/tickets?selected=${ticket.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No recent tickets</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/forms/support')}
                    leftIcon={<Plus className="h-3 w-3" />}
                    className="mt-3"
                  >
                    Create ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Tickets (for managers/admins) or Activity Summary */}
          <Card>
            <CardContent className="px-4 py-5 sm:p-6">
              {authUser?.role !== 'staff' && dashboardData.assignedTickets.length > 0 ? (
                <>
                  <CardHeader className="px-0 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                        Assigned to You
                      </CardTitle>
                      <span className="text-sm text-gray-500">
                        {dashboardData.assignedTickets.length} tickets
                      </span>
                    </div>
                  </CardHeader>
                  <div className="space-y-3">
                    {dashboardData.assignedTickets.slice(0, 5).map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => router.push(`/tickets?selected=${ticket.id}`)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <CardHeader className="px-0 pb-4">
                    <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                      This Week's Activity
                    </CardTitle>
                  </CardHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div className="flex items-center">
                        <Plus className="h-5 w-5 text-blue-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          Tickets Submitted
                        </span>
                      </div>
                      <span className="text-2xl font-semibold text-gray-900">
                        {dashboardData.weeklyStats.submitted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          Tickets Resolved
                        </span>
                      </div>
                      <span className="text-2xl font-semibold text-gray-900">
                        {dashboardData.weeklyStats.resolved}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-primary-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          Resolution Rate
                        </span>
                      </div>
                      <span className="text-2xl font-semibold text-gray-900">
                        {dashboardData.weeklyStats.submitted > 0 
                          ? Math.round((dashboardData.weeklyStats.resolved / dashboardData.weeklyStats.submitted) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Force server-side rendering to avoid static generation issues
export async function getServerSideProps() {
  return { props: {} };
}
