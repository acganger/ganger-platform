import { useState, useEffect } from 'react';
import { LiveCallUpdate, SystemHealth } from '@/types';

export const useRealtimeCallUpdates = () => {
  const [liveUpdates, setLiveUpdates] = useState<LiveCallUpdate[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    ai_engine: true,
    communication_hub: true,
    database: true,
    real_time_sync: true,
    last_check: new Date().toISOString(),
    issues: []
  });

  useEffect(() => {
    // Simulate real-time call updates
    const updateInterval = setInterval(() => {
      const mockUpdates: LiveCallUpdate[] = [
        {
          call_id: 'call_001',
          status: 'active',
          current_turn: 5,
          ai_confidence: 0.92 + (Math.random() - 0.5) * 0.1,
          intent: 'appointment_scheduling',
          sentiment: 0.3 + Math.random() * 0.4,
          duration: Math.floor((Date.now() - (Date.now() - 180000)) / 1000),
          last_activity: new Date().toISOString()
        },
        {
          call_id: 'call_002',
          status: 'active',
          current_turn: 3,
          ai_confidence: 0.76 + (Math.random() - 0.5) * 0.15,
          intent: 'billing_inquiry',
          sentiment: 0.1 + Math.random() * 0.3,
          duration: Math.floor((Date.now() - (Date.now() - 90000)) / 1000),
          last_activity: new Date().toISOString()
        }
      ];

      setLiveUpdates(mockUpdates);
    }, 2000);

    // Simulate system health checks
    const healthInterval = setInterval(() => {
      const issues: string[] = [];
      
      // Randomly simulate some minor issues for demo
      if (Math.random() < 0.05) { // 5% chance
        issues.push('High response latency detected');
      }
      
      if (Math.random() < 0.03) { // 3% chance
        issues.push('Database connection pool saturation');
      }

      setSystemHealth({
        ai_engine: Math.random() > 0.02, // 98% uptime
        communication_hub: Math.random() > 0.01, // 99% uptime
        database: Math.random() > 0.005, // 99.5% uptime
        real_time_sync: Math.random() > 0.01, // 99% uptime
        last_check: new Date().toISOString(),
        issues
      });
    }, 10000);

    return () => {
      clearInterval(updateInterval);
      clearInterval(healthInterval);
    };
  }, []);

  return {
    liveUpdates,
    systemHealth
  };
};