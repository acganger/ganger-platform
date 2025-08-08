import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Star, MessageSquare, CheckSquare, Users } from 'lucide-react';

interface MeetingConcludeProps {
  meetingId: string;
  onComplete: () => void;
  duration: number;
}

interface ConclusionItem {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  type: 'recap' | 'action' | 'feedback';
  timestamp: string;
}

export default function MeetingConclude({ meetingId: _meetingId, onComplete, duration }: MeetingConcludeProps) {
  const user = { id: 'anonymous', full_name: 'Anonymous User' }; // TODO: Get from auth
  const [conclusions, setConclusions] = useState<ConclusionItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [itemType, setItemType] = useState<'recap' | 'action' | 'feedback'>('recap');
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isStarted, setIsStarted] = useState(false);
  const [meetingRating, setMeetingRating] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, timeRemaining]);

  const startConclude = () => {
    setIsStarted(true);
  };

  const addItem = () => {
    if (!newItem.trim() || !user) return;

    const item: ConclusionItem = {
      id: Date.now().toString(),
      user_id: (user as any)?.id || 'anonymous',
      user_name: (user as any)?.full_name || 'Anonymous User',
      content: newItem.trim(),
      type: itemType,
      timestamp: new Date().toISOString()
    };

    setConclusions(prev => [...prev, item]);
    setNewItem('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const recapItems = conclusions.filter(c => c.type === 'recap');
  const actionItems = conclusions.filter(c => c.type === 'action');
  const feedbackItems = conclusions.filter(c => c.type === 'feedback');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Conclude</h2>
            <p className="text-sm text-gray-600">Wrap up the meeting and plan next steps</p>
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
              onClick={startConclude}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Start Conclude</span>
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2 text-lg font-medium"
            >
              <CheckCircle className="h-5 w-5" />
              <span>End Meeting</span>
            </button>
          )}
        </div>
      </div>

      {!isStarted ? (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to conclude the meeting?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Take {duration} minutes to recap key decisions, confirm action items, 
            and rate the meeting effectiveness.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-gray-900 mb-2">Conclude Checklist:</h4>
            <ul className="text-sm text-gray-700 space-y-1 text-left">
              <li>• Recap key decisions made</li>
              <li>• Confirm all action items</li>
              <li>• Review next week's focus</li>
              <li>• Rate meeting effectiveness (1-10)</li>
              <li>• Schedule next meeting</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Meeting Rating */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-yellow-900 mb-3">Rate This Meeting</h3>
            <p className="text-sm text-yellow-800 mb-4">
              How effective was this Level 10 meeting? (1 = Poor, 10 = Excellent)
            </p>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMeetingRating(rating)}
                  className={`w-8 h-8 rounded-full border-2 transition-colors ${
                    rating <= meetingRating
                      ? 'bg-yellow-500 border-yellow-500 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            {meetingRating > 0 && (
              <div className="mt-2">
                <Star className="inline h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium text-yellow-900">
                  {meetingRating}/10 - {
                    meetingRating >= 9 ? 'Excellent!' :
                    meetingRating >= 7 ? 'Good meeting' :
                    meetingRating >= 5 ? 'Room for improvement' :
                    'Needs significant improvement'
                  }
                </span>
              </div>
            )}
          </div>

          {/* Add conclusion items */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Add conclusion item:</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setItemType('recap')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    itemType === 'recap'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <MessageSquare className="h-3 w-3 inline mr-1" />
                  Recap
                </button>
                <button
                  onClick={() => setItemType('action')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    itemType === 'action'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CheckSquare className="h-3 w-3 inline mr-1" />
                  Action
                </button>
                <button
                  onClick={() => setItemType('feedback')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    itemType === 'feedback'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Users className="h-3 w-3 inline mr-1" />
                  Feedback
                </button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
                placeholder={`Add ${itemType} item...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <button
                onClick={addItem}
                disabled={!newItem.trim()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          {/* Conclusion sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recap Items */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Key Decisions</h3>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                  {recapItems.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {recapItems.map((item) => (
                  <div key={item.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-3 w-3 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-blue-800">{item.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-blue-600">{item.user_name}</span>
                          <span className="text-xs text-blue-600">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {recapItems.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <MessageSquare className="mx-auto h-6 w-6 mb-2" />
                    <p className="text-sm">No key decisions recorded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Items */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckSquare className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Action Items</h3>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                  {actionItems.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckSquare className="h-3 w-3 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-green-800">{item.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-green-600">{item.user_name}</span>
                          <span className="text-xs text-green-600">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {actionItems.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <CheckSquare className="mx-auto h-6 w-6 mb-2" />
                    <p className="text-sm">No action items confirmed</p>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Items */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">Feedback</h3>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                  {feedbackItems.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {feedbackItems.map((item) => (
                  <div key={item.id} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-3 w-3 text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-purple-800">{item.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-purple-600">{item.user_name}</span>
                          <span className="text-xs text-purple-600">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {feedbackItems.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Users className="mx-auto h-6 w-6 mb-2" />
                    <p className="text-sm">No feedback shared</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meeting Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Meeting Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{recapItems.length}</div>
                <div className="text-sm text-gray-600">Key Decisions</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{actionItems.length}</div>
                <div className="text-sm text-gray-600">Action Items</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{feedbackItems.length}</div>
                <div className="text-sm text-gray-600">Feedback Items</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{meetingRating}/10</div>
                <div className="text-sm text-gray-600">Meeting Rating</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-eos-50 border border-eos-200 rounded-lg p-4">
            <h4 className="font-medium text-eos-900 mb-2">Before you go:</h4>
            <ul className="text-sm text-eos-800 space-y-1">
              <li>• Confirm next week's meeting time</li>
              <li>• Review all action items with owners</li>
              <li>• Send meeting summary to the team</li>
              <li>• Schedule any follow-up meetings needed</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}