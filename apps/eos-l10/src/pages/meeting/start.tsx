import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth-eos';
import { supabase } from '@/lib/supabase';
import { L10Meeting, L10Agenda, MeetingParticipant } from '@/types/eos';
import { 
  PlayCircle,
  Clock,
  Users,
  CheckCircle,
  ChevronRight,
  Target,
  BarChart3,
  AlertCircle,
  CheckSquare,
  MessageSquare,
  Pause,
  Play,
  Square,
  User,
  Calendar
} from 'lucide-react';
import MeetingTimer from '@/components/meeting/MeetingTimer';
import MeetingParticipants from '@/components/meeting/MeetingParticipants';
import MeetingAgenda from '@/components/meeting/MeetingAgenda';
import MeetingSegue from '@/components/meeting/MeetingSegue';
import MeetingScorecard from '@/components/meeting/MeetingScorecard';
import MeetingRockReview from '@/components/meeting/MeetingRockReview';
import MeetingHeadlines from '@/components/meeting/MeetingHeadlines';
import MeetingTodoReview from '@/components/meeting/MeetingTodoReview';
import MeetingIDS from '@/components/meeting/MeetingIDS';
import MeetingConclude from '@/components/meeting/MeetingConclude';

const defaultAgenda: L10Agenda = {
  segue: { duration: 5, completed: false },
  scorecard: { duration: 5, completed: false },
  rock_review: { duration: 5, completed: false },
  customer_employee_headlines: { duration: 5, completed: false },
  todo_review: { duration: 5, completed: false },
  ids: { duration: 60, completed: false },
  conclude: { duration: 5, completed: false }
};

export default function StartMeetingPage() {
  const router = useRouter();
  const { user, activeTeam, userRole } = useAuth();
  const teamId = activeTeam?.id;
  const [meeting, setMeeting] = useState<L10Meeting | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [currentSegment, setCurrentSegment] = useState<keyof L10Agenda>('segue');
  const [totalDuration, setTotalDuration] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing meeting
  useEffect(() => {
    if (!teamId) return;

    const checkExistingMeeting = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('l10_meetings')
          .select('*')
          .eq('team_id', teamId)
          .eq('scheduled_date', today)
          .in('status', ['scheduled', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          setMeeting(data[0] as L10Meeting);
          if (data[0].status === 'in_progress') {
            // Find current segment based on completion status
            const agenda = data[0].agenda as L10Agenda;
            const segments = Object.keys(agenda) as (keyof L10Agenda)[];
            const currentSeg = segments.find(seg => !agenda[seg].completed) || 'conclude';
            setCurrentSegment(currentSeg);
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    checkExistingMeeting();
  }, [teamId]);

  // Real-time participants subscription
  useEffect(() => {
    if (!meeting?.id) return;

    const channel = supabase
      .channel(`meeting:${meeting.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_participants',
          filter: `meeting_id=eq.${meeting.id}`
        },
        () => {
          fetchParticipants();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'l10_meetings',
          filter: `id=eq.${meeting.id}`
        },
        (payload) => {
          setMeeting(payload.new as L10Meeting);
        }
      )
      .subscribe();

    fetchParticipants();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meeting?.id]);

  // Update total duration when agenda changes
  useEffect(() => {
    if (meeting?.agenda) {
      const total = Object.values(meeting.agenda).reduce((sum, segment) => sum + segment.duration, 0);
      setTotalDuration(total);
    }
  }, [meeting?.agenda]);

  const fetchParticipants = async () => {
    if (!meeting?.id) return;

    try {
      const { data, error } = await supabase
        .from('meeting_participants')
        .select(`
          *,
          user:users(id, full_name, email, avatar_url)
        `)
        .eq('meeting_id', meeting.id)
        .is('left_at', null);

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
    }
  };

  const startMeeting = async () => {
    if (!teamId || !user) return;

    setIsStarting(true);
    try {
      const today = new Date();
      const meetingData = {
        team_id: teamId,
        title: `${activeTeam?.name} L10 Meeting - ${today.toLocaleDateString()}`,
        scheduled_date: today.toISOString().split('T')[0],
        start_time: today.toISOString(),
        status: 'in_progress' as const,
        facilitator_id: user.id,
        agenda: defaultAgenda
      };

      const { data, error } = await supabase
        .from('l10_meetings')
        .insert([meetingData])
        .select()
        .single();

      if (error) throw error;

      // Join the meeting as a participant
      await supabase
        .from('meeting_participants')
        .insert([{
          meeting_id: data.id,
          user_id: user.id,
          status: 'online' as const
        }]);

      setMeeting(data as L10Meeting);
      setCurrentSegment('segue');
    } catch (error) {
    } finally {
      setIsStarting(false);
    }
  };

  const joinMeeting = async () => {
    if (!meeting?.id || !user) return;

    try {
      // Check if already participating
      const { data: existing } = await supabase
        .from('meeting_participants')
        .select('id')
        .eq('meeting_id', meeting.id)
        .eq('user_id', user.id)
        .is('left_at', null)
        .single();

      if (!existing) {
        await supabase
          .from('meeting_participants')
          .insert([{
            meeting_id: meeting.id,
            user_id: user.id,
            status: 'online' as const
          }]);
      }
    } catch (error) {
    }
  };

  const updateMeetingAgenda = async (updates: Partial<L10Agenda>) => {
    if (!meeting?.id) return;

    try {
      const newAgenda = { ...meeting.agenda, ...updates };
      const { error } = await supabase
        .from('l10_meetings')
        .update({ agenda: newAgenda, updated_at: new Date().toISOString() })
        .eq('id', meeting.id);

      if (error) throw error;
    } catch (error) {
    }
  };

  const completeSegment = async (segment: keyof L10Agenda) => {
    if (!meeting) return;

    const updates = {
      [segment]: { ...meeting.agenda[segment], completed: true }
    };

    await updateMeetingAgenda(updates);

    // Move to next segment
    const segments = Object.keys(meeting.agenda) as (keyof L10Agenda)[];
    const currentIndex = segments.indexOf(segment);
    const nextSegment = segments[currentIndex + 1];
    
    if (nextSegment) {
      setCurrentSegment(nextSegment);
    } else {
      // Meeting complete
      await completeMeeting();
    }
  };

  const completeMeeting = async () => {
    if (!meeting?.id) return;

    try {
      await supabase
        .from('l10_meetings')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', meeting.id);

      // Mark all participants as left
      await supabase
        .from('meeting_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('meeting_id', meeting.id)
        .is('left_at', null);

      router.push('/');
    } catch (error) {
    }
  };

  // Auto-join if meeting exists and user isn't participating
  useEffect(() => {
    if (meeting && user && !participants.find(p => p.user_id === user.id)) {
      joinMeeting();
    }
  }, [meeting, user, participants]);

  if (!teamId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please select a team</h2>
          <button
            onClick={() => router.push('/')}
            className="bg-eos-600 text-white px-6 py-3 rounded-lg hover:bg-eos-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-eos-200 border-t-eos-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // No meeting exists - show start meeting interface
  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <PlayCircle className="mx-auto h-16 w-16 text-eos-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Level 10 Meeting</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start your weekly Level 10 meeting with your team. Follow the structured EOS agenda 
              to maximize productivity and ensure every meeting is effective.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Meeting Agenda (90 minutes)</h2>
            <div className="space-y-4">
              {Object.entries(defaultAgenda).map(([key, segment], index) => {
                const icons = {
                  segue: MessageSquare,
                  scorecard: BarChart3,
                  rock_review: Target,
                  customer_employee_headlines: Users,
                  todo_review: CheckSquare,
                  ids: AlertCircle,
                  conclude: CheckCircle
                };
                
                const titles = {
                  segue: 'Segue',
                  scorecard: 'Scorecard Review',
                  rock_review: 'Rock Review',
                  customer_employee_headlines: 'Customer & Employee Headlines',
                  todo_review: 'To-Do List Review',
                  ids: 'Issues (IDS)',
                  conclude: 'Conclude'
                };

                const Icon = icons[key as keyof typeof icons];
                
                return (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-eos-100 rounded-lg">
                        <span className="text-sm font-medium text-eos-700">{index + 1}</span>
                      </div>
                      <Icon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {titles[key as keyof typeof titles]}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{segment.duration} min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            {userRole === 'viewer' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  You have viewer access. Only team leaders and members can start meetings.
                </p>
              </div>
            ) : (
              <button
                onClick={startMeeting}
                disabled={isStarting}
                className="bg-eos-600 text-white px-8 py-4 rounded-lg hover:bg-eos-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto text-lg font-medium"
              >
                {isStarting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Starting Meeting...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-6 w-6" />
                    <span>Start Level 10 Meeting</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Meeting in progress - show meeting interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Meeting Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900">LIVE</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{meeting.title}</h1>
                <p className="text-sm text-gray-600">
                  {new Date(meeting.start_time).toLocaleTimeString()} • {totalDuration} minutes total
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <MeetingParticipants participants={participants} />
              <MeetingTimer startTime={meeting.start_time} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentSegment === 'segue' && (
              <MeetingSegue
                onComplete={() => completeSegment('segue')}
                duration={meeting.agenda.segue.duration}
              />
            )}
            {currentSegment === 'scorecard' && (
              <MeetingScorecard
                teamId={teamId}
                onComplete={() => completeSegment('scorecard')}
                duration={meeting.agenda.scorecard.duration}
              />
            )}
            {currentSegment === 'rock_review' && (
              <MeetingRockReview
                teamId={teamId}
                onComplete={() => completeSegment('rock_review')}
                duration={meeting.agenda.rock_review.duration}
              />
            )}
            {currentSegment === 'customer_employee_headlines' && (
              <MeetingHeadlines
                onComplete={() => completeSegment('customer_employee_headlines')}
                duration={meeting.agenda.customer_employee_headlines.duration}
              />
            )}
            {currentSegment === 'todo_review' && (
              <MeetingTodoReview
                teamId={teamId}
                onComplete={() => completeSegment('todo_review')}
                duration={meeting.agenda.todo_review.duration}
              />
            )}
            {currentSegment === 'ids' && (
              <MeetingIDS
                teamId={teamId}
                meetingId={meeting.id}
                onComplete={() => completeSegment('ids')}
                duration={meeting.agenda.ids.duration}
              />
            )}
            {currentSegment === 'conclude' && (
              <MeetingConclude
                meetingId={meeting.id}
                onComplete={completeMeeting}
                duration={meeting.agenda.conclude.duration}
              />
            )}
          </div>

          {/* Sidebar - Agenda Progress */}
          <div className="lg:col-span-1">
            <MeetingAgenda
              agenda={meeting.agenda}
              currentSegment={currentSegment}
              onSegmentClick={setCurrentSegment}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Force SSR to prevent auth context issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
