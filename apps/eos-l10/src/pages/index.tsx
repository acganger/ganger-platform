import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth, AuthGuard, TeamGuard } from '@/lib/auth-eos';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { supabase } from '@/lib/supabase';
import { TeamAnalytics } from '@/types/eos';
import Layout from '@/components/Layout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import QuickActions from '@/components/dashboard/QuickActions';
import UpcomingMeetings from '@/components/dashboard/UpcomingMeetings';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TeamSelector from '@/components/TeamSelector';
import OfflineBanner from '@/components/OfflineBanner';
import { TeamPresenceIndicator } from '@/components/PresenceIndicator';

export default function Dashboard() {
  const { activeTeam, userRole } = useAuth();
  const { rocks, issues, todos, meetings, loading: realtimeLoading, error: realtimeError } = useRealtimeData();
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (activeTeam && !realtimeLoading) {
      loadAnalytics();
    }
  }, [activeTeam, realtimeLoading]);

  const loadAnalytics = async () => {
    if (!activeTeam) return;

    try {
      // Calculate analytics from real-time data
      const completedRocks = rocks.filter(rock => rock.status === 'complete').length;
      const totalRocks = rocks.length;
      const rock_completion_rate = totalRocks > 0 ? Math.round((completedRocks / totalRocks) * 100) : 0;

      const completedTodos = todos.filter(todo => todo.status === 'completed').length;
      const totalTodos = todos.length;
      const todo_completion_rate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

      const solvedIssues = issues.filter(issue => issue.status === 'solved').length;
      const totalIssues = issues.length;
      const issue_resolution_rate = totalIssues > 0 ? Math.round((solvedIssues / totalIssues) * 100) : 0;

      // Calculate average issue resolution time
      const resolvedIssues = issues.filter(issue => issue.solved_at);
      const avgResolutionTime = resolvedIssues.length > 0 
        ? resolvedIssues.reduce((acc, issue) => {
            const created = new Date(issue.created_at);
            const solved = new Date(issue.solved_at!);
            return acc + (solved.getTime() - created.getTime());
          }, 0) / resolvedIssues.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      setAnalytics({
        rock_completion_rate,
        scorecard_compliance: 92, // This would come from scorecard data
        meeting_attendance: 85, // This would come from meeting attendance data
        issue_resolution_time: Math.round(avgResolutionTime * 10) / 10,
        todo_completion_rate,
        trend_data: [] // This would include historical trend data
      });

    } catch (error) {
    }
  };

  if (!activeTeam) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <TeamSelector />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <TeamGuard>
        <div>
          <Head>
            <title>Dashboard - EOS L10 Platform</title>
            <meta name="description" content="Your EOS team dashboard with rocks, scorecard, and upcoming meetings" />
          </Head>

          <Layout>
            {!isOnline && <OfflineBanner />}
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Welcome back to {activeTeam.name}
                  </p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                  <TeamPresenceIndicator />
                  <TeamSelector />
                </div>
              </div>

              {/* Error handling */}
              {realtimeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    Error loading data: {realtimeError}
                  </p>
                </div>
              )}

              {/* Analytics Cards */}
              {analytics && (
                <DashboardStats analytics={analytics} loading={realtimeLoading} />
              )}

              {/* Quick Actions */}
              <QuickActions userRole={userRole} />

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Meetings */}
                <UpcomingMeetings 
                  meetings={meetings.filter(m => m.status === 'scheduled' && new Date(m.scheduled_date) >= new Date()).slice(0, 3)} 
                  loading={realtimeLoading}
                />

                {/* Recent Activity */}
                <RecentActivity 
                  rocks={rocks.slice(0, 5)}
                  issues={issues.filter(i => ['high', 'critical'].includes(i.priority)).slice(0, 5)}
                  todos={todos.filter(t => t.status === 'pending').slice(0, 5)}
                  loading={realtimeLoading}
                />
              </div>

              {/* Mobile-specific sections */}
              <div className="lg:hidden space-y-6">
                {/* My Tasks Summary for Mobile */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">My Tasks</h3>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {todos.filter(t => t.status === 'pending').slice(0, 3).map((todo) => (
                        <div key={todo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {todo.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              Due: {new Date(todo.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            todo.priority === 'high' 
                              ? 'bg-red-100 text-red-800'
                              : todo.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {todo.priority}
                          </div>
                        </div>
                      ))}
                      
                      {todos.filter(t => t.status === 'pending').length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No pending tasks
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Layout>
        </div>
      </TeamGuard>
    </AuthGuard>
  );
}