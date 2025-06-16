import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-eos';
import { supabase } from '@/lib/supabase';
import { Team, Rock, Issue, Todo, L10Meeting } from '@/types/eos';
import { Database } from '@/types/database';

type Tables = Database['public']['Tables'];

export interface RealtimeTeamData {
  rocks: Rock[];
  issues: Issue[];
  todos: Todo[];
  meetings: L10Meeting[];
  loading: boolean;
  error: string | null;
}

export function useRealtimeData(teamId?: string): RealtimeTeamData {
  const { activeTeam } = useAuth();
  const currentTeamId = teamId || activeTeam?.id;
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const [rocks, setRocks] = useState<Rock[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [meetings, setMeetings] = useState<L10Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTeamId) {
      setLoading(false);
      return;
    }
    
    if (isDemoMode) {
      // Demo mode: Create sample data for testing
      const mockRocks: Rock[] = [
        {
          id: 'rock-1',
          team_id: currentTeamId,
          owner_id: 'demo-user-123',
          title: 'Implement Patient Portal Updates',
          description: 'Modernize patient portal with new booking system',
          quarter: 'Q2 2025',
          status: 'on_track',
          completion_percentage: 75,
          priority: 1,
          due_date: '2025-06-30',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          milestones: []
        },
        {
          id: 'rock-2',
          team_id: currentTeamId,
          owner_id: 'demo-user-123',
          title: 'Complete HIPAA Compliance Audit',
          description: 'Annual security and compliance review',
          quarter: 'Q2 2025',
          status: 'complete',
          completion_percentage: 100,
          priority: 2,
          due_date: '2025-05-15',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          milestones: []
        }
      ];

      const mockIssues: Issue[] = [
        {
          id: 'issue-1',
          team_id: currentTeamId,
          title: 'Staff Training Scheduling Conflicts',
          description: 'Multiple staff requesting same training dates',
          type: 'process',
          priority: 'medium',
          status: 'identified',
          created_by: 'demo-user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const mockTodos: Todo[] = [
        {
          id: 'todo-1',
          team_id: currentTeamId,
          title: 'Review Q2 Budget Reports',
          description: 'Analyze departmental spending vs projections',
          assigned_to: 'demo-user-123',
          created_by: 'demo-user-123',
          due_date: '2025-06-20',
          status: 'pending',
          priority: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const mockMeetings: L10Meeting[] = [
        {
          id: 'meeting-1',
          team_id: currentTeamId,
          title: 'Weekly Leadership Team L10',
          scheduled_date: '2025-06-18',
          start_time: '09:00',
          end_time: '10:30',
          status: 'scheduled',
          facilitator_id: 'demo-user-123',
          agenda: {
            segue: { duration: 5, completed: false },
            scorecard: { duration: 5, completed: false },
            rock_review: { duration: 5, completed: false },
            customer_employee_headlines: { duration: 5, completed: false },
            todo_review: { duration: 5, completed: false },
            ids: { duration: 60, completed: false },
            conclude: { duration: 5, completed: false }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setRocks(mockRocks);
      setIssues(mockIssues);
      setTodos(mockTodos);
      setMeetings(mockMeetings);
      setLoading(false);
      return;
    }

    let rocksSubscription: any;
    let issuesSubscription: any;
    let todosSubscription: any;
    let meetingsSubscription: any;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load initial rocks data
        const { data: rocksData, error: rocksError } = await supabase
          .from('rocks')
          .select('*')
          .eq('team_id', currentTeamId as any)
          .order('priority', { ascending: true });

        if (rocksError) throw rocksError;

        // Load initial issues data
        const { data: issuesData, error: issuesError } = await supabase
          .from('issues')
          .select('*')
          .eq('team_id', currentTeamId as any)
          .order('created_at', { ascending: false });

        if (issuesError) throw issuesError;

        // Load initial todos data
        const { data: todosData, error: todosError } = await supabase
          .from('todos')
          .select('*')
          .eq('team_id', currentTeamId as any)
          .order('due_date', { ascending: true });

        if (todosError) throw todosError;

        // Load initial meetings data
        const { data: meetingsData, error: meetingsError } = await supabase
          .from('l10_meetings')
          .select('*')
          .eq('team_id', currentTeamId as any)
          .order('scheduled_date', { ascending: false });

        if (meetingsError) throw meetingsError;

        // Transform database types to application types
        setRocks(rocksData.map((rock: any) => transformRockFromDB(rock)));
        setIssues(issuesData.map((issue: any) => transformIssueFromDB(issue)));
        setTodos(todosData.map((todo: any) => transformTodoFromDB(todo)));
        setMeetings(meetingsData.map((meeting: any) => transformMeetingFromDB(meeting)));

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    const setupSubscriptions = () => {
      // Subscribe to rocks changes
      rocksSubscription = supabase
        .channel(`rocks-${currentTeamId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rocks',
            filter: `team_id=eq.${currentTeamId}`,
          },
          (payload) => {
            handleRockChange(payload);
          }
        )
        .subscribe();

      // Subscribe to issues changes
      issuesSubscription = supabase
        .channel(`issues-${currentTeamId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'issues',
            filter: `team_id=eq.${currentTeamId}`,
          },
          (payload) => {
            handleIssueChange(payload);
          }
        )
        .subscribe();

      // Subscribe to todos changes
      todosSubscription = supabase
        .channel(`todos-${currentTeamId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'todos',
            filter: `team_id=eq.${currentTeamId}`,
          },
          (payload) => {
            handleTodoChange(payload);
          }
        )
        .subscribe();

      // Subscribe to meetings changes
      meetingsSubscription = supabase
        .channel(`meetings-${currentTeamId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'l10_meetings',
            filter: `team_id=eq.${currentTeamId}`,
          },
          (payload) => {
            handleMeetingChange(payload);
          }
        )
        .subscribe();
    };

    const handleRockChange = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setRocks(currentRocks => {
        switch (eventType) {
          case 'INSERT':
            const newRock = transformRockFromDB(newRecord);
            return [...currentRocks, newRock].sort((a, b) => a.priority - b.priority);
          
          case 'UPDATE':
            const updatedRock = transformRockFromDB(newRecord);
            return currentRocks
              .map(rock => rock.id === updatedRock.id ? updatedRock : rock)
              .sort((a, b) => a.priority - b.priority);
          
          case 'DELETE':
            return currentRocks.filter(rock => rock.id !== oldRecord.id);
          
          default:
            return currentRocks;
        }
      });
    };

    const handleIssueChange = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setIssues(currentIssues => {
        switch (eventType) {
          case 'INSERT':
            const newIssue = transformIssueFromDB(newRecord);
            return [newIssue, ...currentIssues];
          
          case 'UPDATE':
            const updatedIssue = transformIssueFromDB(newRecord);
            return currentIssues.map(issue => 
              issue.id === updatedIssue.id ? updatedIssue : issue
            );
          
          case 'DELETE':
            return currentIssues.filter(issue => issue.id !== oldRecord.id);
          
          default:
            return currentIssues;
        }
      });
    };

    const handleTodoChange = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setTodos(currentTodos => {
        switch (eventType) {
          case 'INSERT':
            const newTodo = transformTodoFromDB(newRecord);
            return [...currentTodos, newTodo].sort((a, b) => 
              new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            );
          
          case 'UPDATE':
            const updatedTodo = transformTodoFromDB(newRecord);
            return currentTodos
              .map(todo => todo.id === updatedTodo.id ? updatedTodo : todo)
              .sort((a, b) => 
                new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
              );
          
          case 'DELETE':
            return currentTodos.filter(todo => todo.id !== oldRecord.id);
          
          default:
            return currentTodos;
        }
      });
    };

    const handleMeetingChange = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setMeetings(currentMeetings => {
        switch (eventType) {
          case 'INSERT':
            const newMeeting = transformMeetingFromDB(newRecord);
            return [newMeeting, ...currentMeetings];
          
          case 'UPDATE':
            const updatedMeeting = transformMeetingFromDB(newRecord);
            return currentMeetings.map(meeting => 
              meeting.id === updatedMeeting.id ? updatedMeeting : meeting
            );
          
          case 'DELETE':
            return currentMeetings.filter(meeting => meeting.id !== oldRecord.id);
          
          default:
            return currentMeetings;
        }
      });
    };

    // Load data and setup subscriptions
    loadInitialData();
    setupSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      if (rocksSubscription) {
        supabase.removeChannel(rocksSubscription);
      }
      if (issuesSubscription) {
        supabase.removeChannel(issuesSubscription);
      }
      if (todosSubscription) {
        supabase.removeChannel(todosSubscription);
      }
      if (meetingsSubscription) {
        supabase.removeChannel(meetingsSubscription);
      }
    };
  }, [currentTeamId]);

  return {
    rocks,
    issues,
    todos,
    meetings,
    loading,
    error,
  };
}

// Transform functions to convert database types to application types
function transformRockFromDB(dbRock: Tables['rocks']['Row']): Rock {
  return {
    id: dbRock.id,
    team_id: dbRock.team_id,
    owner_id: dbRock.owner_id,
    title: dbRock.title,
    description: dbRock.description || undefined,
    quarter: dbRock.quarter,
    status: dbRock.status,
    completion_percentage: dbRock.completion_percentage,
    priority: dbRock.priority,
    due_date: dbRock.due_date,
    created_at: dbRock.created_at,
    updated_at: dbRock.updated_at,
    milestones: [],
  };
}

function transformIssueFromDB(dbIssue: Tables['issues']['Row']): Issue {
  return {
    id: dbIssue.id,
    team_id: dbIssue.team_id,
    title: dbIssue.title,
    description: dbIssue.description || undefined,
    type: dbIssue.type,
    priority: dbIssue.priority,
    status: dbIssue.status,
    owner_id: dbIssue.owner_id || undefined,
    created_by: dbIssue.created_by,
    created_at: dbIssue.created_at,
    updated_at: dbIssue.updated_at,
    solved_at: dbIssue.solved_at || undefined,
    solution: dbIssue.solution || undefined,
    meeting_id: dbIssue.meeting_id || undefined,
  };
}

function transformTodoFromDB(dbTodo: Tables['todos']['Row']): Todo {
  return {
    id: dbTodo.id,
    team_id: dbTodo.team_id,
    title: dbTodo.title,
    description: dbTodo.description || undefined,
    assigned_to: dbTodo.assigned_to,
    created_by: dbTodo.created_by,
    due_date: dbTodo.due_date,
    status: dbTodo.status,
    priority: dbTodo.priority,
    meeting_id: dbTodo.meeting_id || undefined,
    completed_at: dbTodo.completed_at || undefined,
    created_at: dbTodo.created_at,
    updated_at: dbTodo.updated_at,
  };
}

function transformMeetingFromDB(dbMeeting: Tables['l10_meetings']['Row']): L10Meeting {
  return {
    id: dbMeeting.id,
    team_id: dbMeeting.team_id,
    title: dbMeeting.title,
    scheduled_date: dbMeeting.scheduled_date,
    start_time: dbMeeting.start_time,
    end_time: dbMeeting.end_time || undefined,
    status: dbMeeting.status,
    facilitator_id: dbMeeting.facilitator_id,
    agenda: dbMeeting.agenda || {
      segue: { duration: 5, completed: false },
      scorecard: { duration: 5, completed: false },
      rock_review: { duration: 5, completed: false },
      customer_employee_headlines: { duration: 5, completed: false },
      todo_review: { duration: 5, completed: false },
      ids: { duration: 60, completed: false },
      conclude: { duration: 5, completed: false }
    },
    created_at: dbMeeting.created_at,
    updated_at: dbMeeting.updated_at,
  };
}