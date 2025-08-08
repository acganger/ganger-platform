// Call Center Operations Utility Functions

// Re-export formatPhoneNumber from @ganger/utils
export { formatPhoneNumber } from '@ganger/utils';

// App-specific utility functions
export function formatCallDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

export function getPerformanceColor(score: number): string {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function getPerformanceLevel(score: number): 'excellent' | 'good' | 'average' | 'below' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'average';
  if (score >= 60) return 'below';
  return 'poor';
}

export function getCallStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'transferred':
      return 'bg-purple-100 text-purple-800';
    case 'abandoned':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getCallOutcomeColor(outcome: string): string {
  switch (outcome) {
    case 'appointment_scheduled':
      return 'bg-green-100 text-green-800';
    case 'information_provided':
      return 'bg-blue-100 text-blue-800';
    case 'transfer_required':
      return 'bg-purple-100 text-purple-800';
    case 'callback_scheduled':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getJournalStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'reviewed':
      return 'bg-blue-100 text-blue-800';
    case 'submitted':
      return 'bg-yellow-100 text-yellow-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function calculateGoalProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
}

export function getGoalProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-green-600';
  if (progress >= 80) return 'bg-blue-600';
  if (progress >= 60) return 'bg-amber-600';
  return 'bg-red-600';
}


export function getTimeOfDay(dateString: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date(dateString).getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function calculateUtilization(
  talkTime: number, 
  afterCallWork: number, 
  availableTime: number
): number {
  if (availableTime === 0) return 0;
  return ((talkTime + afterCallWork) / availableTime) * 100;
}

export function calculateCallsPerHour(calls: number, timeInSeconds: number): number {
  if (timeInSeconds === 0) return 0;
  const hours = timeInSeconds / 3600;
  return calls / hours;
}

export function getAgentStatusColor(status: string): string {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'on_call':
      return 'bg-blue-100 text-blue-800';
    case 'break':
      return 'bg-yellow-100 text-yellow-800';
    case 'training':
      return 'bg-purple-100 text-purple-800';
    case 'offline':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function formatWaitTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getQueuePriorityColor(waitTime: number): string {
  // Wait time in seconds
  if (waitTime > 300) return 'bg-red-50 border-red-200'; // > 5 minutes
  if (waitTime > 180) return 'bg-amber-50 border-amber-200'; // > 3 minutes
  if (waitTime > 60) return 'bg-blue-50 border-blue-200'; // > 1 minute
  return 'bg-green-50 border-green-200'; // < 1 minute
}

export function getQueueWaitTimeColor(waitTime: number): string {
  if (waitTime > 300) return 'text-red-900'; // > 5 minutes
  if (waitTime > 180) return 'text-amber-900'; // > 3 minutes
  if (waitTime > 60) return 'text-blue-900'; // > 1 minute
  return 'text-green-900'; // < 1 minute
}

export interface PerformanceThresholds {
  excellent: number;
  good: number;
  average: number;
  below: number;
}

export const defaultThresholds: PerformanceThresholds = {
  excellent: 90,
  good: 80,
  average: 70,
  below: 60
};

export function getPerformanceTier(
  score: number, 
  thresholds: PerformanceThresholds = defaultThresholds
): 'excellent' | 'good' | 'average' | 'below' | 'poor' {
  if (score >= thresholds.excellent) return 'excellent';
  if (score >= thresholds.good) return 'good';
  if (score >= thresholds.average) return 'average';
  if (score >= thresholds.below) return 'below';
  return 'poor';
}

export function formatMetricValue(value: number, type: 'percentage' | 'currency' | 'time' | 'count'): string {
  switch (type) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    case 'time':
      return formatCallDuration(value);
    case 'count':
      return value.toLocaleString();
    default:
      return value.toString();
  }
}

export function getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    case 'neutral':
      return '➡️';
    default:
      return '➡️';
  }
}

export function getTrendColor(trend: 'up' | 'down' | 'neutral', isGoodWhenUp: boolean = true): string {
  if (trend === 'neutral') return 'text-neutral-600';
  
  const isPositive = isGoodWhenUp ? trend === 'up' : trend === 'down';
  return isPositive ? 'text-green-600' : 'text-red-600';
}

// Real-time data utilities
export function isRecentUpdate(timestamp: string, thresholdMinutes: number = 5): boolean {
  const now = new Date();
  const updateTime = new Date(timestamp);
  const diffMinutes = (now.getTime() - updateTime.getTime()) / (1000 * 60);
  return diffMinutes <= thresholdMinutes;
}

export function getUpdateFreshness(timestamp: string): 'fresh' | 'recent' | 'stale' {
  const now = new Date();
  const updateTime = new Date(timestamp);
  const diffMinutes = (now.getTime() - updateTime.getTime()) / (1000 * 60);
  
  if (diffMinutes <= 2) return 'fresh';
  if (diffMinutes <= 10) return 'recent';
  return 'stale';
}

// Chart utilities
export function generateChartColors(count: number): string[] {
  const baseColors = [
    'rgb(59, 130, 246)',   // blue
    'rgb(16, 185, 129)',   // green
    'rgb(245, 158, 11)',   // amber
    'rgb(239, 68, 68)',    // red
    'rgb(139, 92, 246)',   // purple
    'rgb(6, 182, 212)',    // cyan
    'rgb(251, 113, 133)',  // pink
    'rgb(34, 197, 94)'     // emerald
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]!);
  }
  
  return colors;
}

export function generateChartBackgroundColors(count: number, opacity: number = 0.1): string[] {
  const baseColors = [
    `rgba(59, 130, 246, ${opacity})`,   // blue
    `rgba(16, 185, 129, ${opacity})`,   // green
    `rgba(245, 158, 11, ${opacity})`,   // amber
    `rgba(239, 68, 68, ${opacity})`,    // red
    `rgba(139, 92, 246, ${opacity})`,   // purple
    `rgba(6, 182, 212, ${opacity})`,    // cyan
    `rgba(251, 113, 133, ${opacity})`,  // pink
    `rgba(34, 197, 94, ${opacity})`     // emerald
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]!);
  }
  
  return colors;
}

// Validation utilities
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateTimeRange(start: string, end: string): boolean {
  if (!start || !end) return false;
  return new Date(start) < new Date(end);
}

// Data transformation utilities
export function groupCallsByPeriod(
  calls: any[], 
  period: 'hour' | 'day' | 'week' | 'month'
): { [key: string]: any[] } {
  const groups: { [key: string]: any[] } = {};
  
  calls.forEach(call => {
    const date = new Date(call.call_start_time);
    let key: string;
    
    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0]!;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
      default:
        key = date.toISOString().split('T')[0]!;
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key]!.push(call);
  });
  
  return groups;
}

export function calculateAverageFromArray(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}