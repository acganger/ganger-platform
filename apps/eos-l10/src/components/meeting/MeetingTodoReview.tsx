import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Todo } from '@/types/eos';
import { CheckSquare, Clock, CheckCircle, Square, AlertTriangle } from 'lucide-react';

interface MeetingTodoReviewProps {
  teamId: string;
  onComplete: () => void;
  duration: number;
}

export default function MeetingTodoReview({ teamId, onComplete, duration }: MeetingTodoReviewProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    fetchRecentTodos();
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

  const fetchRecentTodos = async () => {
    try {
      setLoading(true);
      
      // Get todos from the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('todos')
        .select(`
          *,
          assignee:users!assigned_to(full_name, email, avatar_url),
          creator:users!created_by(full_name, email, avatar_url)
        `)
        .eq('team_id', teamId as any)
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos((data as any) || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const startReview = () => {
    setIsStarted(true);
  };

  const updateTodoStatus = async (todoId: string, status: Todo['status']) => {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', todoId as any);

      if (error) throw error;
      
      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, status, completed_at: updateData.completed_at } : todo
      ));
    } catch (error) {
    }
  };

  const getStatusColor = (status: Todo['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'dropped': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: Todo['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'dropped': return <Square className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <CheckSquare className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">To-Do Review</h2>
            <p className="text-sm text-gray-600">Review and update previous week's assignments</p>
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
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <CheckSquare className="h-4 w-4" />
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
          <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to review To-Dos?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Take {duration} minutes to review last week's to-dos. Update status, mark items 
            complete, and identify any issues that need to be addressed.
          </p>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-indigo-900 mb-2">Review Guidelines:</h4>
            <ul className="text-sm text-indigo-800 space-y-1 text-left">
              <li>• Go through each person's to-dos</li>
              <li>• Mark completed items as done</li>
              <li>• Update status on in-progress items</li>
              <li>• Address overdue assignments</li>
              <li>• Add obstacles to Issues List</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="mx-auto h-8 w-8 mb-2" />
              <p>No to-dos found from the last week.</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {(['completed', 'in_progress', 'pending', 'dropped'] as const).map((status) => {
                  const count = todos.filter(t => t.status === status).length;
                  const labels = {
                    completed: 'Completed',
                    in_progress: 'In Progress',
                    pending: 'Pending',
                    dropped: 'Dropped'
                  };
                  
                  return (
                    <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="ml-1">{count}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{labels[status as keyof typeof labels]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Group todos by assignee */}
              <div className="space-y-6">
                {Array.from(new Set(todos.map(t => t.assigned_to))).map((assigneeId) => {
                  const assigneeTodos = todos.filter(t => t.assigned_to === assigneeId);
                  const assignee = { full_name: assigneeId }; // Placeholder until proper user lookup is implemented
                  
                  return (
                    <div key={assigneeId} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {assignee?.full_name || 'Unknown Assignee'}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{assigneeTodos.length} total</span>
                          <span>•</span>
                          <span>{assigneeTodos.filter(t => t.status === 'completed').length} completed</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {assigneeTodos.map((todo) => (
                          <div
                            key={todo.id}
                            className={`p-3 bg-white rounded-lg border transition-colors ${
                              todo.status === 'completed'
                                ? 'border-green-200'
                                : isOverdue(todo.due_date) && ['pending', 'in_progress', 'dropped'].includes(todo.status)
                                ? 'border-red-200 bg-red-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className={`font-medium ${
                                    todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                                  }`}>
                                    {todo.title}
                                  </h4>
                                  {isOverdue(todo.due_date) && todo.status !== 'completed' && (
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                                      Overdue
                                    </span>
                                  )}
                                </div>
                                
                                {todo.description && (
                                  <p className="text-sm text-gray-600 mb-2">{todo.description}</p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Due: {new Date(todo.due_date).toLocaleDateString()}</span>
                                  <span>Priority: {todo.priority}</span>
                                  <span>Created: {new Date(todo.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <div className="ml-4 flex space-x-1">
                                {(['pending', 'in_progress', 'completed', 'dropped'] as const).map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => updateTodoStatus(todo.id, status)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors border ${
                                      todo.status === status
                                        ? getStatusColor(status)
                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                    }`}
                                    title={status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                  >
                                    {getStatusIcon(status)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">During To-Do Review:</h4>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• Each person reports on their assigned to-dos</li>
                  <li>• Mark completed items as done</li>
                  <li>• Update status on in-progress items</li>
                  <li>• Address overdue assignments</li>
                  <li>• Add systemic issues to the Issues List</li>
                  <li>• Don't create new to-dos here - that happens after IDS</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}