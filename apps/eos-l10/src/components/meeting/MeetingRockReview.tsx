import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Rock } from '@/types/eos';
import { Target, Clock, CheckCircle, TrendingUp, AlertTriangle, TrendingDown } from 'lucide-react';

interface MeetingRockReviewProps {
  teamId: string;
  onComplete: () => void;
  duration: number;
}

export default function MeetingRockReview({ teamId, onComplete, duration }: MeetingRockReviewProps) {
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    fetchCurrentRocks();
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

  const fetchCurrentRocks = async () => {
    try {
      setLoading(true);
      
      // Get current quarter
      const now = new Date();
      const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;

      const { data, error } = await supabase
        .from('rocks')
        .select(`
          *,
          owner:users(full_name, email, avatar_url)
        `)
        .eq('team_id', teamId as any)
        .eq('quarter', quarter as any)
        .order('priority', { ascending: true });

      if (error) throw error;
      setRocks((data as any) || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const startReview = () => {
    setIsStarted(true);
  };

  const updateRockStatus = async (rockId: string, status: Rock['status']) => {
    try {
      const { error } = await supabase
        .from('rocks')
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq('id', rockId as any);

      if (error) throw error;
      
      setRocks(prev => prev.map(rock => 
        rock.id === rockId ? { ...rock, status } : rock
      ));
    } catch (error) {
    }
  };

  const getStatusColor = (status: Rock['status']) => {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-100 border-green-200';
      case 'on_track': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'off_track': return 'text-red-600 bg-red-100 border-red-200';
      case 'not_started': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: Rock['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4" />;
      case 'on_track': return <TrendingUp className="h-4 w-4" />;
      case 'off_track': return <TrendingDown className="h-4 w-4" />;
      case 'not_started': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
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
          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
            <Target className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Rock Review</h2>
            <p className="text-sm text-gray-600">Review quarterly goal progress</p>
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
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
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
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to review quarterly Rocks?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Take {duration} minutes to review progress on quarterly goals. Update status for each 
            rock and identify any obstacles that need to become issues.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-purple-900 mb-2">Review Guidelines:</h4>
            <ul className="text-sm text-purple-800 space-y-1 text-left">
              <li>• Go through each rock quickly</li>
              <li>• Owner reports: On Track or Off Track</li>
              <li>• Update completion percentage</li>
              <li>• Add obstacles to Issues List</li>
              <li>• Keep updates brief</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {rocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="mx-auto h-8 w-8 mb-2" />
              <p>No rocks found for this quarter. Create rocks in the Rocks section.</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {['complete', 'on_track', 'off_track', 'not_started'].map((status) => {
                  const count = rocks.filter(r => r.status === status).length;
                  const labels = {
                    complete: 'Complete',
                    on_track: 'On Track',
                    off_track: 'Off Track',
                    not_started: 'Not Started'
                  };
                  
                  return (
                    <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium border ${getStatusColor(status as any)}`}>
                        {getStatusIcon(status as any)}
                        <span className="ml-1">{count}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{labels[status as keyof typeof labels]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Rocks List */}
              <div className="space-y-4">
                {rocks.map((rock) => (
                  <div
                    key={rock.id}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      rock.status === 'off_track' || rock.status === 'not_started'
                        ? 'border-red-200 bg-red-50'
                        : rock.status === 'complete'
                        ? 'border-green-200 bg-green-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{rock.title}</h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Priority {rock.priority}
                          </span>
                        </div>
                        
                        {rock.description && (
                          <p className="text-sm text-gray-600 mb-3">{rock.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">
                            Owner: <span className="font-medium">{rock.owner?.full_name}</span>
                          </span>
                          <span className="text-gray-600">
                            Due: <span className="font-medium">{new Date(rock.due_date).toLocaleDateString()}</span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{rock.completion_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(rock.completion_percentage)}`}
                              style={{ width: `${rock.completion_percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        {/* Status Buttons */}
                        <div className="flex flex-col space-y-1">
                          {(['on_track', 'off_track', 'complete'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => updateRockStatus(rock.id, status)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                                rock.status === status
                                  ? getStatusColor(status)
                                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {getStatusIcon(status)}
                              <span className="ml-1">
                                {status === 'on_track' ? 'On Track' : 
                                 status === 'off_track' ? 'Off Track' : 'Complete'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">During Rock Review:</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Each owner gives a quick status update</li>
                  <li>• Focus on off-track rocks</li>
                  <li>• Identify obstacles and add them to Issues</li>
                  <li>• Update completion percentages</li>
                  <li>• Don't solve problems here - just report status</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}