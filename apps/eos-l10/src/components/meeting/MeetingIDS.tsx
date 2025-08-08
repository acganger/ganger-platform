import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Issue, CreateTodoForm } from '@/types/eos';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Plus, 
  Target,
  MessageSquare,
  CheckSquare,
  Eye,
  MessageCircle,
  Check
} from 'lucide-react';

interface MeetingIDSProps {
  teamId: string;
  meetingId: string;
  onComplete: () => void;
  duration: number;
}

interface IDSStep {
  issue: Issue;
  step: 'identify' | 'discuss' | 'solve';
  discussion: string[];
  solution?: string;
  todos: CreateTodoForm[];
}

export default function MeetingIDS({ teamId, meetingId, onComplete, duration }: MeetingIDSProps) {
  const teamMembers: any[] = []; // Get from actual auth context
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [currentIDS, setCurrentIDS] = useState<IDSStep | null>(null);
  const [completedIDS, setCompletedIDS] = useState<IDSStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isStarted, setIsStarted] = useState(false);
  const [discussionNote, setDiscussionNote] = useState('');
  const [solution, setSolution] = useState('');
  const [newTodo, setNewTodo] = useState<Partial<CreateTodoForm>>({
    title: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchIssues();
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

  const fetchIssues = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          owner:users!owner_id(full_name, email, avatar_url),
          creator:users!created_by(full_name, email, avatar_url)
        `)
        .eq('team_id', teamId as any)
        .eq('status', 'identified' as any)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setIssues((data as any) || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const startIDS = () => {
    setIsStarted(true);
    if (issues.length > 0) {
      setCurrentIDS({
        issue: issues[0],
        step: 'identify',
        discussion: [],
        todos: []
      });
    }
  };

  const nextStep = () => {
    if (!currentIDS) return;

    if (currentIDS.step === 'identify') {
      setCurrentIDS(prev => prev ? { ...prev, step: 'discuss' } : null);
    } else if (currentIDS.step === 'discuss') {
      setCurrentIDS(prev => prev ? { ...prev, step: 'solve' } : null);
    } else if (currentIDS.step === 'solve') {
      completeCurrentIDS();
    }
  };

  const completeCurrentIDS = async () => {
    if (!currentIDS) return;

    try {
      // Update issue status
      await supabase
        .from('issues')
        .update({ 
          status: 'solved' as any,
          solution: currentIDS.solution,
          solved_at: new Date().toISOString(),
          meeting_id: meetingId
        } as any)
        .eq('id', (currentIDS.issue as any).id);

      // Create todos
      for (const todo of currentIDS.todos) {
        if (todo.title && todo.assigned_to && todo.due_date) {
          await supabase
            .from('todos')
            .insert([{
              ...todo,
              team_id: teamId as string,
              created_by: (user as any)?.id || 'anonymous',
              status: 'pending' as any,
              meeting_id: meetingId
            } as any]);
        }
      }

      // Move to completed
      setCompletedIDS(prev => [...prev, currentIDS]);
      
      // Move to next issue
      const remainingIssues = issues.filter(i => 
        i.id !== currentIDS.issue.id && 
        !completedIDS.some(c => c.issue.id === i.id)
      );
      
      if (remainingIssues.length > 0) {
        setCurrentIDS({
          issue: remainingIssues[0],
          step: 'identify',
          discussion: [],
          todos: []
        });
      } else {
        setCurrentIDS(null);
      }

      // Reset forms
      setSolution('');
      setDiscussionNote('');
      setNewTodo({
        title: '',
        assigned_to: '',
        due_date: '',
        priority: 'medium'
      });

    } catch (error) {
    }
  };

  const addDiscussion = () => {
    if (!discussionNote.trim() || !currentIDS) return;

    setCurrentIDS(prev => prev ? {
      ...prev,
      discussion: [...prev.discussion, discussionNote.trim()]
    } : null);
    setDiscussionNote('');
  };

  const updateSolution = () => {
    if (!solution.trim() || !currentIDS) return;

    setCurrentIDS(prev => prev ? {
      ...prev,
      solution: solution.trim()
    } : null);
  };

  const addTodo = () => {
    if (!newTodo.title || !newTodo.assigned_to || !newTodo.due_date || !currentIDS) return;

    setCurrentIDS(prev => prev ? {
      ...prev,
      todos: [...prev.todos, newTodo as CreateTodoForm]
    } : null);

    setNewTodo({
      title: '',
      assigned_to: '',
      due_date: '',
      priority: 'medium'
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDefaultDueDate = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
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
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">IDS (Issues)</h2>
            <p className="text-sm text-gray-600">Identify, Discuss, Solve team issues</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isStarted && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className={`font-mono text-sm ${
                timeRemaining <= 300 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          
          {!isStarted ? (
            <button
              onClick={startIDS}
              disabled={issues.length === 0}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Start IDS</span>
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
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for IDS?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Take up to {duration} minutes to work through issues using the IDS methodology: 
            Identify, Discuss, and Solve each issue systematically.
          </p>
          
          {issues.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="font-medium text-green-900 mb-2">No Issues to Discuss!</h4>
              <p className="text-sm text-green-800">
                Great job! Your team has no open issues to work through.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="font-medium text-red-900 mb-2">
                {issues.length} Issue{issues.length > 1 ? 's' : ''} to Work Through:
              </h4>
              <ul className="text-sm text-red-800 space-y-1 text-left">
                {issues.slice(0, 3).map((issue) => (
                  <li key={issue.id}>• {issue.title}</li>
                ))}
                {issues.length > 3 && (
                  <li>• And {issues.length - 3} more...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">IDS Progress</h3>
              <span className="text-sm text-gray-600">
                {completedIDS.length} solved, {issues.length - completedIDS.length} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${issues.length > 0 ? (completedIDS.length / issues.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Current IDS */}
          {currentIDS ? (
            <div className="border border-red-200 rounded-lg p-6 bg-red-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-900">
                  {currentIDS.issue.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {['identify', 'discuss', 'solve'].map((step, index) => (
                    <div
                      key={step}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                        currentIDS.step === step
                          ? 'bg-red-600 text-white'
                          : index < ['identify', 'discuss', 'solve'].indexOf(currentIDS.step)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {step === 'identify' && <Eye className="h-3 w-3" />}
                      {step === 'discuss' && <MessageCircle className="h-3 w-3" />}
                      {step === 'solve' && <Check className="h-3 w-3" />}
                      <span>{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issue Details */}
              <div className="mb-6 p-4 bg-white rounded-lg border border-red-200">
                <p className="text-gray-700 mb-2">{currentIDS.issue.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Type: {currentIDS.issue.type}</span>
                  <span>Priority: {currentIDS.issue.priority}</span>
                  <span>Owner: {(currentIDS.issue as any).owner?.full_name || 'Unassigned'}</span>
                </div>
              </div>

              {/* Step Content */}
              {currentIDS.step === 'identify' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Identify Phase</h4>
                    <p className="text-sm text-blue-800">
                      Make sure everyone understands the issue clearly. Is this the real issue 
                      or just a symptom? Get to the root cause.
                    </p>
                  </div>
                  <button
                    onClick={nextStep}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Move to Discuss
                  </button>
                </div>
              )}

              {currentIDS.step === 'discuss' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Discuss Phase</h4>
                    <p className="text-sm text-yellow-800">
                      Openly discuss the issue. Share ideas, perspectives, and potential solutions. 
                      Keep discussion focused and productive.
                    </p>
                  </div>

                  {/* Discussion Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discussion Notes
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={discussionNote}
                        onChange={(e) => setDiscussionNote(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addDiscussion()}
                        placeholder="Add discussion point..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                      <button
                        onClick={addDiscussion}
                        disabled={!discussionNote.trim()}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    
                    {currentIDS.discussion.length > 0 && (
                      <div className="space-y-2">
                        {currentIDS.discussion.map((note, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-700">{note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={nextStep}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                  >
                    Move to Solve
                  </button>
                </div>
              )}

              {currentIDS.step === 'solve' && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Solve Phase</h4>
                    <p className="text-sm text-green-800">
                      Determine the solution and create specific action items. Assign owners 
                      and due dates for each to-do.
                    </p>
                  </div>

                  {/* Solution */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Solution
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        onBlur={updateSolution}
                        placeholder="Describe the solution..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    {currentIDS.solution && (
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-700">{currentIDS.solution}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Items */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action Items (To-Dos)
                    </label>
                    <div className="bg-white border border-gray-300 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        <input
                          type="text"
                          value={newTodo.title}
                          onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="To-do title..."
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <select
                          value={newTodo.assigned_to}
                          onChange={(e) => setNewTodo(prev => ({ ...prev, assigned_to: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Assign to...</option>
                          {teamMembers?.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              {member.user.full_name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={newTodo.due_date}
                          onChange={(e) => setNewTodo(prev => ({ ...prev, due_date: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          onClick={addTodo}
                          disabled={!newTodo.title || !newTodo.assigned_to || !newTodo.due_date}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add</span>
                        </button>
                      </div>
                      
                      {currentIDS.todos.length > 0 && (
                        <div className="space-y-2">
                          {currentIDS.todos.map((todo, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{todo.title}</span>
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <span>{teamMembers?.find(m => m.user_id === todo.assigned_to)?.user.full_name}</span>
                                <span>•</span>
                                <span>{new Date(todo.due_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={nextStep}
                    disabled={!currentIDS.solution}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Mark as Solved
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Issues Solved!</h3>
              <p className="text-gray-600">
                Great work! Your team has worked through all identified issues.
              </p>
            </div>
          )}

          {/* Completed IDS Summary */}
          {completedIDS.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3">Solved Issues ({completedIDS.length})</h4>
              <div className="space-y-2">
                {completedIDS.map((ids) => (
                  <div key={ids.issue.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-sm font-medium">{ids.issue.title}</span>
                    <span className="text-xs text-green-600">{ids.todos.length} to-dos created</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}