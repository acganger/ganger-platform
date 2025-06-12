// Client-safe formatting utilities

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toISOString().split('T')[0];
}

export function formatTime(time: string): string {
  if (!time) return '';
  
  // Handle time in HH:MM format
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);
  
  const date = new Date();
  date.setHours(hour, minute);
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(dateTime: Date | string): string {
  if (typeof dateTime === 'string') {
    dateTime = new Date(dateTime);
  }
  
  return dateTime.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return `${diffHours}h`;
}

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
};