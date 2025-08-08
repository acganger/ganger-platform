import React, { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, User, Building } from 'lucide-react';

interface MeetingHeadlinesProps {
  onComplete: () => void;
  duration: number;
}

interface Headline {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  type: 'customer' | 'employee';
  timestamp: string;
}

export default function MeetingHeadlines({ onComplete, duration }: MeetingHeadlinesProps) {
  const teamMembers: any[] = []; // Fix team members access
  const user = null; // Fix user access
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [newHeadline, setNewHeadline] = useState('');
  const [headlineType, setHeadlineType] = useState<'customer' | 'employee'>('customer');
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, timeRemaining]);

  const startHeadlines = () => {
    setIsStarted(true);
  };

  const addHeadline = () => {
    if (!newHeadline.trim() || !user) return;

    const headline: Headline = {
      id: Date.now().toString(),
      user_id: (user as any)?.id || 'anonymous',
      user_name: (user as any)?.full_name || 'Anonymous User',
      content: newHeadline.trim(),
      type: headlineType,
      timestamp: new Date().toISOString()
    };

    setHeadlines(prev => [...prev, headline]);
    setNewHeadline('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const customerHeadlines = headlines.filter(h => h.type === 'customer');
  const employeeHeadlines = headlines.filter(h => h.type === 'employee');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
            <Users className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Headlines</h2>
            <p className="text-sm text-gray-600">Customer & employee updates and news</p>
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
              onClick={startHeadlines}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Start Headlines</span>
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
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to share Headlines?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Take {duration} minutes to share important customer feedback, employee updates, 
            wins, challenges, and any news that affects the team.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-orange-900 mb-2">Headlines Guidelines:</h4>
            <ul className="text-sm text-orange-800 space-y-1 text-left">
              <li>• Share customer feedback and wins</li>
              <li>• Report employee updates and changes</li>
              <li>• Mention competitive intelligence</li>
              <li>• Keep each headline brief</li>
              <li>• Focus on what impacts the team</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add new headline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Share a headline:</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setHeadlineType('customer')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    headlineType === 'customer'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <User className="h-3 w-3 inline mr-1" />
                  Customer
                </button>
                <button
                  onClick={() => setHeadlineType('employee')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    headlineType === 'employee'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Building className="h-3 w-3 inline mr-1" />
                  Employee
                </button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newHeadline}
                onChange={(e) => setNewHeadline(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHeadline()}
                placeholder={`Share ${headlineType} news or updates...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={addHeadline}
                disabled={!newHeadline.trim()}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          {/* Headlines Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Headlines */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Customer Headlines</h3>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                  {customerHeadlines.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {customerHeadlines.map((headline) => (
                  <div key={headline.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-blue-900">{headline.user_name}</h4>
                          <span className="text-xs text-blue-600">
                            {new Date(headline.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-blue-800 mt-1">{headline.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {customerHeadlines.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <User className="mx-auto h-6 w-6 mb-2" />
                    <p className="text-sm">No customer headlines yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Employee Headlines */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Employee Headlines</h3>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                  {employeeHeadlines.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {employeeHeadlines.map((headline) => (
                  <div key={headline.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Building className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-green-900">{headline.user_name}</h4>
                          <span className="text-xs text-green-600">
                            {new Date(headline.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-green-800 mt-1">{headline.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {employeeHeadlines.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Building className="mx-auto h-6 w-6 mb-2" />
                    <p className="text-sm">No employee headlines yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team participation status */}
          {teamMembers && teamMembers.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Team Participation</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {teamMembers.map((member) => {
                  const hasShared = headlines.some(h => h.user_id === member.user_id);
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center space-x-2 p-2 rounded ${
                        hasShared ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        hasShared ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span className="text-xs font-medium truncate">
                        {member.user.full_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">Examples of Good Headlines:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-orange-800">
              <div>
                <h5 className="font-medium mb-1">Customer:</h5>
                <ul className="space-y-1">
                  <li>• "ABC Corp renewed for 3 more years"</li>
                  <li>• "Customer complaint about delivery times"</li>
                  <li>• "New referral from satisfied client"</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-1">Employee:</h5>
                <ul className="space-y-1">
                  <li>• "Sarah completed her certification"</li>
                  <li>• "Marketing team launched new campaign"</li>
                  <li>• "IT resolved server issues"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}