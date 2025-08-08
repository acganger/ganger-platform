import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SafeLink from '@/components/ui/SafeLink';
import { usePresence } from '@/hooks/usePresence';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import PresenceIndicator from '@/components/PresenceIndicator';
import { Rock } from '@/types/eos';
import { 
  Target, 
  Calendar, 
  User, 
  TrendingUp, 
  ArrowLeft, 
  Edit3,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Minus
} from 'lucide-react';

export default function RockDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { activeTeam, user, userRole } = useAuth();
  const { onlineUsers } = usePresence(`rock-${id}`);
  
  const [rock, setRock] = useState<Rock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newProgress, setNewProgress] = useState<number>(0);
  const [newStatus, setNewStatus] = useState<Rock['status']>('not_started');

  useEffect(() => {
    if (id && activeTeam) {
      loadRock();
    }
  }, [id, activeTeam]);

  const loadRock = async () => {
    if (!id || !activeTeam) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('rocks')
        .select(`
          *,
          owner:users(full_name, email, avatar_url)
        `)
        .eq('id', id)
        .eq('team_id', activeTeam.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Rock not found');
        } else {
          throw fetchError;
        }
        return;
      }

      setRock(data);
      setNewProgress(data.completion_percentage);
      setNewStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rock');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    if (!rock || updating) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('rocks')
        .update({
          completion_percentage: newProgress,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rock.id);

      if (error) throw error;

      setRock({ ...rock, completion_percentage: newProgress, status: newStatus });
    } catch (err) {
      alert('Failed to update progress. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: Rock['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'on_track':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'off_track':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'not_started':
        return <Minus className="h-5 w-5 text-gray-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Rock['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'off_track':
        return 'bg-red-100 text-red-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percentage: number, status: Rock['status']) => {
    if (status === 'complete') return 'bg-blue-500';
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <AuthGuard>
        <TeamGuard>
          <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="skeleton h-8 w-64"></div>
              <div className="card">
                <div className="card-content space-y-4">
                  <div className="skeleton h-6 w-full"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-32 w-full"></div>
                </div>
              </div>
            </div>
          </Layout>
        </TeamGuard>
      </AuthGuard>
    );
  }

  if (error || !rock) {
    return (
      <AuthGuard>
        <TeamGuard>
          <Layout>
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                {error || 'Rock not found'}
              </h2>
              <SafeLink href="/rocks" className="btn-primary">
                Back to Rocks
              </SafeLink>
            </div>
          </Layout>
        </TeamGuard>
      </AuthGuard>
    );
  }

  const daysRemaining = getDaysRemaining(rock.due_date);
  const isOverdue = daysRemaining < 0;

  return (
    <AuthGuard>
      <TeamGuard>
        <div>
          <Head>
            <title>{rock.title} - Rocks - EOS L10 Platform</title>
            <meta name="description" content={`Rock details: ${rock.title}`} />
          </Head>

          <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <SafeLink
                    href="/rocks"
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </SafeLink>
                  
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                      <Target className="h-6 w-6 mr-2 text-eos-600" />
                      {rock.title}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {rock.quarter} • Priority #{rock.priority}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <PresenceIndicator page={`rock-${rock.id}`} />
                  
                  {(userRole === 'leader' || userRole === 'member') && (
                    <SafeLink
                      href={`/rocks/${rock.id}/edit`}
                      className="btn-secondary flex items-center"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </SafeLink>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Rock Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description */}
                  {rock.description && (
                    <div className="card">
                      <div className="card-header">
                        <h3 className="card-title">Description</h3>
                      </div>
                      <div className="card-content">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {rock.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Progress Update */}
                  {(userRole === 'leader' || userRole === 'member') && (
                    <div className="card">
                      <div className="card-header">
                        <h3 className="card-title">Update Progress</h3>
                      </div>
                      <div className="card-content space-y-4">
                        {/* Progress Slider */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Completion Percentage: {newProgress}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={newProgress}
                            onChange={(e) => setNewProgress(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Status Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(['not_started', 'on_track', 'off_track', 'complete'] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() => setNewStatus(status)}
                                className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center space-x-2 ${
                                  newStatus === status
                                    ? 'border-eos-500 bg-eos-50 text-eos-700'
                                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {getStatusIcon(status)}
                                <span className="capitalize">
                                  {status.replace('_', ' ')}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Update Button */}
                        {(newProgress !== rock.completion_percentage || newStatus !== rock.status) && (
                          <button
                            onClick={updateProgress}
                            disabled={updating}
                            className="btn-primary w-full"
                          >
                            {updating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              'Update Progress'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                  {/* Progress Overview */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Progress Overview</h3>
                    </div>
                    <div className="card-content space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Completion</span>
                          <span className="font-bold text-lg">{rock.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              getProgressColor(rock.completion_percentage, rock.status)
                            }`}
                            style={{ width: `${rock.completion_percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                          getStatusColor(rock.status)
                        }`}>
                          {getStatusIcon(rock.status)}
                          <span className="ml-1 capitalize">
                            {rock.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Details</h3>
                    </div>
                    <div className="card-content space-y-3">
                      {/* Owner */}
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rock.owner?.full_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Rock Owner
                          </div>
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className={`text-sm font-medium ${
                            isOverdue ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {new Date(rock.due_date).toLocaleDateString()}
                          </div>
                          <div className={`text-xs ${
                            isOverdue ? 'text-red-500' : 'text-gray-500'
                          }`}>
                            {isOverdue 
                              ? `${Math.abs(daysRemaining)} days overdue`
                              : daysRemaining === 0
                              ? 'Due today'
                              : `${daysRemaining} days remaining`
                            }
                          </div>
                        </div>
                      </div>

                      {/* Quarter */}
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rock.quarter}
                          </div>
                          <div className="text-xs text-gray-500">
                            Quarter
                          </div>
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(rock.updated_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Last updated
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collaborators */}
                  {onlineUsers.length > 0 && (
                    <div className="card">
                      <div className="card-header">
                        <h3 className="card-title">Active Collaborators</h3>
                      </div>
                      <div className="card-content">
                        <div className="space-y-2">
                          {onlineUsers.map((user) => (
                            <div key={user.user_id} className="flex items-center space-x-3">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.full_name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-eos-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-eos-700">
                                    {user.full_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {user.full_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Viewing this rock
                                </div>
                              </div>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Layout>
        </div>
      </TeamGuard>
    </AuthGuard>
  );
}

// Force SSR to prevent auth context issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
}
