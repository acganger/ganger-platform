// Re-export common utilities from @ganger/utils
export { 
  cn, 
  formatDate, 
  formatFileSize, 
  getInitials, 
  formatRelativeTime as formatTimeAgo, 
  formatDateTime, 
  capitalizeFirst, 
  kebabToTitle, 
  truncateText, 
  getAvatarColor 
} from '@ganger/utils';

// App-specific validation helpers
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};