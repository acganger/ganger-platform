import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Team, Rock, Issue, Todo, L10Meeting } from '@/types/eos';
import { Database } from '@/types/database';
import { eosL10MigrationAdapter } from '@/lib/migration-adapter';

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

        // Load initial rocks data using migration adapter
        const rocksData = await eosL10MigrationAdapter.select(
          'rocks',
          '*',
          { team_id: currentTeamId },
          { orderBy: 'priority' }
        );

        // Load initial issues data using migration adapter
        const issuesData = await eosL10MigrationAdapter.select(
          'issues',
          '*',
          { team_id: currentTeamId },
          { orderBy: '-created_at' }
        );

        // Load initial todos data using migration adapter
        const todosData = await eosL10MigrationAdapter.select(
          'todos',
          '*',
          { team_id: currentTeamId },
          { orderBy: 'due_date' }
        );

        // Load initial meetings data using migration adapter
        const meetingsData = await eosL10MigrationAdapter.select(
          'l10_meetings',
          '*',
          { team_id: currentTeamId },
          { orderBy: '-scheduled_date' }
        );

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
      // Subscribe to rocks changes (migration-aware)
      rocksSubscription = supabase
        .channel(`l10_rocks-${currentTeamId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: process.env.MIGRATION_USE_NEW_SCHEMA === 'true' ? 'l10_rocks' : 'rocks',
            filter: `team_id=eq.${currentTeamId}`,
          },
          (payload) => {
            handleRockChange(payload);
          }
        )
        .subscribe();

      // Subscribe to issues changes (migration-aware)
      issuesSubscription = supabase
        .channel(`l10_issues-${currentTeamId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: process.env.MIGRATION_USE_NEW_SCHEMA === 'true' ? 'l10_issues' : 'issues',
            filter: `team_id=eq.${currentTeamId}`,
          },
          (payload) => {
            handleIssueChange(payload);
          }
        )
        .subscribe();

      // Subscribe to todos changes (migration-aware)
      todosSubscription = supabase
        .channel(`l10_todos-${currentTeamId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: process.env.MIGRATION_USE_NEW_SCHEMA === 'true' ? 'l10_todos' : 'todos',
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