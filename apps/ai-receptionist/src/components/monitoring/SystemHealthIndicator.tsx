import { useState } from 'react';
import { Badge, Button, Modal } from '@ganger/ui';
import { SystemHealth } from '@/types';

interface SystemHealthIndicatorProps {
  health: SystemHealth;
}

export const SystemHealthIndicator = ({ health }: SystemHealthIndicatorProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getOverallHealth = () => {
    const systems = [health.ai_engine, health.communication_hub, health.database, health.real_time_sync];
    const healthyCount = systems.filter(Boolean).length;
    const totalSystems = systems.length;

    if (healthyCount === totalSystems) return 'healthy';
    if (healthyCount >= totalSystems * 0.75) return 'degraded';
    return 'critical';
  };

  const overallHealth = getOverallHealth();
  const hasIssues = health.issues.length > 0;

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? '✅' : '❌';
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'critical':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`relative ${getHealthColor(overallHealth)} hover:opacity-80`}
        onClick={() => setShowDetails(true)}
      >
        <span className="mr-2">{getHealthIcon(overallHealth)}</span>
        System Health
        {hasIssues && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>

      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="System Health Status"
      >
        <div className="space-y-6">
          {/* Overall Status */}
          <div className="text-center">
            <div className="text-4xl mb-2">{getHealthIcon(overallHealth)}</div>
            <h3 className="text-lg font-medium text-slate-900 capitalize">
              System Status: {overallHealth}
            </h3>
            <p className="text-sm text-slate-600">
              Last checked: {new Date(health.last_check).toLocaleString()}
            </p>
          </div>

          {/* Individual Systems */}
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900">Component Status</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(health.ai_engine)}</span>
                  <div>
                    <div className="font-medium text-slate-900">AI Engine</div>
                    <div className="text-xs text-slate-600">
                      AWS Bedrock Claude 3.5 Sonnet
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={health.ai_engine ? 'text-green-600' : 'text-red-600'}
                >
                  {health.ai_engine ? 'Online' : 'Offline'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(health.communication_hub)}</span>
                  <div>
                    <div className="font-medium text-slate-900">Communication Hub</div>
                    <div className="text-xs text-slate-600">
                      Twilio MCP Integration
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={health.communication_hub ? 'text-green-600' : 'text-red-600'}
                >
                  {health.communication_hub ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(health.database)}</span>
                  <div>
                    <div className="font-medium text-slate-900">Database</div>
                    <div className="text-xs text-slate-600">
                      Supabase PostgreSQL
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={health.database ? 'text-green-600' : 'text-red-600'}
                >
                  {health.database ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(health.real_time_sync)}</span>
                  <div>
                    <div className="font-medium text-slate-900">Real-time Sync</div>
                    <div className="text-xs text-slate-600">
                      Live call monitoring
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={health.real_time_sync ? 'text-green-600' : 'text-red-600'}
                >
                  {health.real_time_sync ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Issues */}
          {hasIssues && (
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 flex items-center">
                <span className="mr-2">⚠️</span>
                Active Issues ({health.issues.length})
              </h4>
              
              <div className="space-y-2">
                {health.issues.map((issue, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div className="text-sm text-orange-900">{issue}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900">Performance Metrics</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-600">AI Response Time</div>
                <div className="font-medium text-slate-900">1.2s avg</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-600">Call Processing</div>
                <div className="font-medium text-slate-900">0.3s avg</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-600">Database Latency</div>
                <div className="font-medium text-slate-900">45ms avg</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-600">Uptime</div>
                <div className="font-medium text-slate-900">99.8%</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Auto-refresh every 10 seconds
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDetails(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};