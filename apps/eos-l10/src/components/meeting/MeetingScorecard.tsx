import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ScorecardMetric, ScorecardEntry } from '@/types/eos';
import { BarChart3, Clock, CheckCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface MeetingScorecardProps {
  teamId: string;
  onComplete: () => void;
  duration: number;
}

export default function MeetingScorecard({ teamId, onComplete, duration }: MeetingScorecardProps) {
  const [metrics, setMetrics] = useState<ScorecardMetric[]>([]);
  const [entries, setEntries] = useState<ScorecardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    fetchScorecardData();
  }, [teamId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, timeRemaining]);

  const fetchScorecardData = async () => {
    try {
      setLoading(true);
      
      // Get current week ending date (Sunday)
      const today = new Date();
      const currentWeekEnding = new Date(today);
      currentWeekEnding.setDate(today.getDate() - today.getDay());
      const weekEndingStr = currentWeekEnding.toISOString().split('T')[0];

      // Fetch metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('scorecard_metrics')
        .select(`
          *,
          owner:users(full_name, email, avatar_url)
        `)
        .eq('scorecard.team_id', teamId as any)
        .eq('active', true as any)
        .order('sort_order');

      if (metricsError) throw metricsError;

      // Fetch entries for current week
      const { data: entriesData, error: entriesError } = await supabase
        .from('scorecard_entries')
        .select('*')
        .eq('week_ending', weekEndingStr as any)
        .in('metric_id', (metricsData || []).map((m: any) => (m as any).id));

      if (entriesError) throw entriesError;

      setMetrics((metricsData as any) || []);
      setEntries((entriesData as any) || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const startReview = () => {
    setIsStarted(true);
  };

  const getMetricStatus = (metric: ScorecardMetric) => {
    const entry = entries.find(e => e.metric_id === metric.id);
    if (!entry) return 'missing';
    
    if (entry.value >= metric.goal) return 'green';
    if (entry.value >= metric.goal * 0.8) return 'yellow';
    return 'red';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'red': return 'text-red-600 bg-red-100';
      case 'missing': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return <TrendingUp className="h-4 w-4" />;
      case 'yellow': return <AlertTriangle className="h-4 w-4" />;
      case 'red': return <TrendingDown className="h-4 w-4" />;
      case 'missing': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-eos-200 border-t-eos-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Scorecard Review</h2>
            <p className="text-sm text-gray-600">Review weekly metrics and performance</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isStarted && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className={`font-mono text-sm ${
                timeRemaining <= 60 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          
          {!isStarted ? (
            <button
              onClick={startReview}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Start Review</span>
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Complete</span>
            </button>
          )}
        </div>
      </div>

      {!isStarted ? (
        <div className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to review the Scorecard?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Take {duration} minutes to review this week's metrics. Focus on what's off track and 
            identify any issues that need to be added to the Issues List.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-green-900 mb-2">Review Guidelines:</h4>
            <ul className="text-sm text-green-800 space-y-1 text-left">
              <li>• Quickly scan all metrics</li>
              <li>• Focus on red and yellow items</li>
              <li>• Identify patterns and trends</li>
              <li>• Add issues to the Issues List</li>
              <li>• Keep discussion brief</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {metrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="mx-auto h-8 w-8 mb-2" />
              <p>No scorecard metrics found. Set up your scorecard in the Scorecard section.</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {['green', 'yellow', 'red', 'missing'].map((status) => {
                  const count = metrics.filter(m => getMetricStatus(m) === status).length;
                  const labels = {
                    green: 'On Track',
                    yellow: 'At Risk',
                    red: 'Off Track',
                    missing: 'Missing Data'
                  };
                  
                  return (
                    <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="ml-1">{count}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{labels[status as keyof typeof labels]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Metrics List */}
              <div className="space-y-3">
                {metrics.map((metric) => {
                  const entry = entries.find(e => e.metric_id === metric.id);
                  const status = getMetricStatus(metric);
                  
                  return (
                    <div
                      key={metric.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        status === 'red' || status === 'missing'
                          ? 'border-red-200 bg-red-50'
                          : status === 'yellow'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">{metric.name}</h4>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {getStatusIcon(status)}
                              <span className="ml-1">
                                {status === 'missing' ? 'No Data' : status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              Owner: <span className="font-medium">{metric.owner?.full_name}</span>
                            </span>
                            <span className="text-gray-600">
                              Goal: <span className="font-medium">{formatValue(metric.goal, metric.measurement_type)}</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {entry ? formatValue(entry.value, metric.measurement_type) : '—'}
                          </div>
                          {entry && entry.notes && (
                            <p className="text-xs text-gray-600 mt-1 max-w-xs">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">During Scorecard Review:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Call out red and yellow metrics</li>
                  <li>• Ask metric owners for quick explanations</li>
                  <li>• Add systemic issues to the Issues List</li>
                  <li>• Don't solve problems here - just identify them</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}