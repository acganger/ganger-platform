import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface MeetingTimerProps {
  startTime: string;
  className?: string;
}

export default function MeetingTimer({ startTime, className = '' }: MeetingTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedTime(elapsed);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const minutes = Math.floor(elapsedTime / 60);
    if (minutes >= 90) return 'text-red-600'; // Over 90 minutes
    if (minutes >= 75) return 'text-yellow-600'; // 75-90 minutes
    return 'text-green-600'; // Under 75 minutes
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="h-4 w-4 text-gray-400" />
      <span className={`font-mono text-sm font-medium ${getTimerColor()}`}>
        {formatTime(elapsedTime)}
      </span>
    </div>
  );
}