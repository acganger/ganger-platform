import React from 'react';
import SafeLink from '@/components/ui/SafeLink';
import { L10Meeting } from '@/types/eos';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface UpcomingMeetingsProps {
  meetings: L10Meeting[];
  loading: boolean;
}

export default function UpcomingMeetings({ meetings, loading }: UpcomingMeetingsProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Upcoming Meetings</h3>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="skeleton w-10 h-10 rounded-lg mr-3"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 mb-2"></div>
                  <div className="skeleton h-3 w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">Upcoming Meetings</h3>
          <SafeLink 
            href="/meetings"
            className="text-sm text-eos-600 hover:text-eos-700 font-medium"
          >
            View all
          </SafeLink>
        </div>
      </div>
      <div className="card-content">
        {meetings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No upcoming meetings scheduled</p>
            <SafeLink
              href="/meetings/new"
              className="inline-flex items-center mt-4 text-sm text-eos-600 hover:text-eos-700"
            >
              Schedule a meeting
              <ArrowRight className="h-4 w-4 ml-1" />
            </SafeLink>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <SafeLink
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-eos-100 p-2 rounded-lg mr-3">
                    <Calendar className="h-5 w-5 text-eos-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {meeting.title}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(meeting.scheduled_date).toLocaleDateString()} at{' '}
                      {meeting.start_time}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </SafeLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}