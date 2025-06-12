import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-eos';
import { MessageSquare, Clock, CheckCircle, ThumbsUp, Heart } from 'lucide-react';

interface MeetingSegueProps {
  onComplete: () => void;
  duration: number;
}

interface SegueItem {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  type: 'personal' | 'business';
  timestamp: string;
}

export default function MeetingSegue({ onComplete, duration }: MeetingSegueProps) {
  const teamMembers: any[] = []; // Fix team members access
  const { user } = useAuth();
  const [segueItems, setSegueItems] = useState<SegueItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [itemType, setItemType] = useState<'personal' | 'business'>('personal');
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

  const startSegue = () => {
    setIsStarted(true);
  };

  const addSegueItem = () => {
    if (!newItem.trim() || !user) return;

    const item: SegueItem = {
      id: Date.now().toString(),
      user_id: user?.id || '',
      user_name: user?.user_metadata?.full_name || user?.email || 'User',
      content: newItem.trim(),
      type: itemType,
      timestamp: new Date().toISOString()
    };

    setSegueItems(prev => [...prev, item]);
    setNewItem('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Segue</h2>
            <p className="text-sm text-gray-600">Share good news & personal/business highlights</p>
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
              onClick={startSegue}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Start Segue</span>
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
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to start the Segue?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Take {duration} minutes for everyone to share good news and highlights from their 
            personal and business life. This helps connect the team and start on a positive note.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-blue-900 mb-2">Segue Guidelines:</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Share personal good news or wins</li>
              <li>• Mention business accomplishments</li>
              <li>• Keep it positive and brief</li>
              <li>• Everyone should participate</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add new segue item */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Share your good news:</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setItemType('personal')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    itemType === 'personal'
                      ? 'bg-pink-100 text-pink-700 border border-pink-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className="h-3 w-3 inline mr-1" />
                  Personal
                </button>
                <button
                  onClick={() => setItemType('business')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    itemType === 'business'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ThumbsUp className="h-3 w-3 inline mr-1" />
                  Business
                </button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSegueItem()}
                placeholder={`Share your ${itemType} good news...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addSegueItem}
                disabled={!newItem.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          {/* Segue items */}
          <div className="space-y-3">
            {segueItems.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === 'personal' 
                        ? 'bg-pink-100 text-pink-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {item.type === 'personal' ? (
                        <Heart className="h-4 w-4" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{item.user_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.type === 'personal'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{item.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {segueItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                <p>No items shared yet. Be the first to share some good news!</p>
              </div>
            )}
          </div>

          {/* Team participation status */}
          {teamMembers && teamMembers.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Team Participation</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {teamMembers.map((member) => {
                  const hasShared = segueItems.some(item => item.user_id === member.user_id);
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
        </div>
      )}
    </div>
  );
}