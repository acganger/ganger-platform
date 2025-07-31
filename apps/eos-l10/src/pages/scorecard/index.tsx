import { useState, useEffect } from 'react';
import Head from 'next/head';
import SafeLink from '@/components/ui/SafeLink';
import { useAuth, AuthGuard, TeamGuard } from '@/lib/auth-eos';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { usePresence } from '@/hooks/usePresence';
import Layout from '@/components/Layout';
import PresenceIndicator from '@/components/PresenceIndicator';
import ScorecardMetricCard from '@/components/scorecard/ScorecardMetricCard';
import WeeklyDataEntry from '@/components/scorecard/WeeklyDataEntry';
import TrendAnalyzer from '@/components/scorecard/TrendAnalyzer';
import { Scorecard, ScorecardMetric, ScorecardEntry } from '@/types/eos';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Plus, 
  Calendar, 
  Target,
  BarChart3,
  RefreshCw,
  Filter,
  Download,
  Settings
} from 'lucide-react';

export default function ScorecardPage() {
  const { activeTeam, user, userRole } = useAuth();
  const { onlineUsers } = usePresence('scorecard');
  
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [metrics, setMetrics] = useState<ScorecardMetric[]>([]);
  const [entries, setEntries] = useState<ScorecardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get current week ending (Sunday)
  const getCurrentWeekEnding = () => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    return sunday.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (activeTeam) {
      loadScorecardData();
      if (!selectedWeek) {
        setSelectedWeek(getCurrentWeekEnding());
      }
    }
  }, [activeTeam]);

  useEffect(() => {
    if (activeTeam && scorecard) {
      setupRealtimeSubscription();
    }
  }, [activeTeam, scorecard]);

  const loadScorecardData = async () => {
    if (!activeTeam) return;

    try {
      setLoading(true);
      setError(null);

      // Load or create team scorecard
      let { data: scorecardData, error: scorecardError } = await supabase
        .from('scorecards')
        .select('*')
        .eq('team_id', activeTeam.id as any)
        .eq('active', true as any)
        .single();

      if (scorecardError && scorecardError.code === 'PGRST116') {
        // Create default scorecard if none exists
        const { data: newScorecard, error: createError } = await supabase
          .from('scorecards')
          .insert({
            team_id: activeTeam.id,
            name: `${activeTeam.name} Scorecard`,
            description: 'Team performance metrics',
            active: true
          } as any)
          .select()
          .single();

        if (createError) throw createError;
        scorecardData = newScorecard;
      } else if (scorecardError) {
        throw scorecardError;
      }

      setScorecard((scorecardData as any));

      // Load metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('scorecard_metrics')
        .select(`
          *,
          owner:users(full_name, email, avatar_url)
        `)
        .eq('scorecard_id', (scorecardData as any).id as any)
        .eq('active', true as any)
        .order('sort_order');

      if (metricsError) throw metricsError;
      setMetrics((metricsData as any) || []);

      // Load last 13 weeks of entries for trends
      const thirteenWeeksAgo = new Date();
      thirteenWeeksAgo.setDate(thirteenWeeksAgo.getDate() - (13 * 7));

      const { data: entriesData, error: entriesError } = await supabase
        .from('scorecard_entries')
        .select(`
          *,
          metric:scorecard_metrics(name, goal, measurement_type)
        `)
        .in('metric_id', (metricsData as any)?.map((m: any) => m.id) || [])
        .gte('week_ending', thirteenWeeksAgo.toISOString().split('T')[0])
        .order('week_ending', { ascending: false });

      if (entriesError) throw entriesError;
      setEntries((entriesData as any) || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scorecard');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!activeTeam || !scorecard) return;

    const subscription = supabase
      .channel(`scorecard-${activeTeam.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scorecard_entries',
        filter: `metric_id=in.(${metrics.map(m => m.id).join(',')})`
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setEntries(prev => {
            const newEntry = payload.new as ScorecardEntry;
            const existing = prev.findIndex(e => e.id === newEntry.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = newEntry;
              return updated;
            } else {
              return [newEntry, ...prev];
            }
          });
        } else if (payload.eventType === 'DELETE') {
          setEntries(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadScorecardData();
    setRefreshing(false);
  };

  const getWeekOptions = () => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 0; i < 13; i++) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (today.getDay() + (i * 7)));
      weeks.push(weekEnd.toISOString().split('T')[0]);
    }
    
    return weeks;
  };

  const getEntriesForWeek = (weekEnding: string) => {
    return entries.filter(entry => entry.week_ending === weekEnding);
  };

  const calculateComplianceRate = () => {
    if (metrics.length === 0) return 0;
    
    const weekEntries = getEntriesForWeek(selectedWeek);
    const enteredMetrics = new Set(weekEntries.map(e => e.metric_id));
    
    return Math.round((enteredMetrics.size / metrics.length) * 100);
  };

  const getOverallStatus = () => {
    const weekEntries = getEntriesForWeek(selectedWeek);
    if (weekEntries.length === 0) return 'gray';
    
    const statusCounts = weekEntries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (statusCounts.red > 0) return 'red';
    if (statusCounts.yellow > 0) return 'yellow';
    return 'green';
  };

  if (loading) {
    return (
      <AuthGuard>
        <TeamGuard>
          <Layout>
            <div className="space-y-6">
              <div className="skeleton h-8 w-64"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card">
                    <div className="card-content space-y-4">
                      <div className="skeleton h-6 w-full"></div>
                      <div className="skeleton h-16 w-full"></div>
                      <div className="skeleton h-4 w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Layout>
        </TeamGuard>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <TeamGuard>
        <div>
          <Head>
            <title>Scorecard - EOS L10 Platform</title>
            <meta name="description" content="Team scorecard metrics and analytics" />
          </Head>

          <Layout>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <BarChart3 className="h-6 w-6 mr-2 text-eos-600" />
                    Scorecard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Weekly metrics and performance tracking
                  </p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                  <PresenceIndicator page="scorecard" />
                  
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="btn-secondary flex items-center"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>

                  {(userRole === 'leader' || userRole === 'member') && (
                    <>
                      <button
                        onClick={() => setShowDataEntry(!showDataEntry)}
                        className="btn-primary flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {showDataEntry ? 'View Analytics' : 'Enter Data'}
                      </button>
                      
                      <SafeLink
                        href="/scorecard/metrics"
                        className="btn-secondary flex items-center"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Metrics
                      </SafeLink>
                    </>
                  )}
                </div>
              </div>

              {/* Error handling */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">Error: {error}</p>
                </div>
              )}

              {/* Week Selector and Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Week Selector */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title text-sm">Week Ending</h3>
                  </div>
                  <div className="card-content">
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="input"
                    >
                      {getWeekOptions().map(week => (
                        <option key={week} value={week}>
                          {new Date(week + 'T00:00:00').toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="card">
                  <div className="card-content text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {metrics.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Metrics</div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {calculateComplianceRate()}%
                    </div>
                    <div className="text-sm text-gray-600">Data Compliance</div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content text-center">
                    <div className={`text-2xl font-bold ${
                      getOverallStatus() === 'green' ? 'text-green-600' :
                      getOverallStatus() === 'yellow' ? 'text-yellow-600' :
                      getOverallStatus() === 'red' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {getOverallStatus().toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">Overall Status</div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              {showDataEntry ? (
                <WeeklyDataEntry 
                  scorecard={scorecard!}
                  metrics={metrics}
                  selectedWeek={selectedWeek}
                  existingEntries={getEntriesForWeek(selectedWeek)}
                  onDataSaved={loadScorecardData}
                />
              ) : (
                <>
                  {/* Metrics Grid */}
                  {metrics.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No metrics configured</h3>
                      <p className="text-gray-500 mb-4">
                        Set up your scorecard metrics to start tracking performance
                      </p>
                      {(userRole === 'leader' || userRole === 'member') && (
                        <SafeLink href="/scorecard/metrics" className="btn-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Metrics
                        </SafeLink>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {metrics.map((metric) => (
                        <ScorecardMetricCard
                          key={metric.id}
                          metric={metric}
                          entries={entries.filter(e => e.metric_id === metric.id)}
                          selectedWeek={selectedWeek}
                        />
                      ))}
                    </div>
                  )}

                  {/* Trend Analysis */}
                  {metrics.length > 0 && entries.length > 0 && (
                    <TrendAnalyzer 
                      metrics={metrics}
                      entries={entries}
                      selectedWeek={selectedWeek}
                    />
                  )}
                </>
              )}
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
