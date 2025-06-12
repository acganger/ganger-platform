import { format, parseISO, isValid } from 'date-fns';

// Text formatting utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const titleCase = (str: string): string => {
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

export const camelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

export const kebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

export const snakeCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
};

export const truncate = (str: string, length: number, suffix = '...'): string => {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

export const parsePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// SSN formatting
export const formatSSN = (ssn: string): string => {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return ssn;
};

export const maskSSN = (ssn: string): string => {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `XXX-XX-${cleaned.slice(5)}`;
  }
  return ssn;
};

// Currency formatting
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};

// Date formatting
export const formatDate = (date: string | Date, formatStr = 'MM/dd/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    return 'Invalid Date';
  }
  
  return format(dateObj, formatStr);
};

export const formatDateTime = (date: string | Date, formatStr = 'MM/dd/yyyy h:mm a'): string => {
  return formatDate(date, formatStr);
};

export const formatTime = (date: string | Date, formatStr = 'h:mm a'): string => {
  return formatDate(date, formatStr);
};

export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    return minutes <= 1 ? 'just now' : `${minutes} minutes ago`;
  }
  
  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  
  if (diffInDays < 7) {
    const days = Math.floor(diffInDays);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  
  return formatDate(dateObj, 'MM/dd/yyyy');
};

// Medical formatting
export const formatMRN = (mrn: string): string => {
  const cleaned = mrn.replace(/\D/g, '');
  // Format as XXX-XXX-XXXX if 10 digits
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return mrn;
};

export const formatDOB = (dob: string): string => {
  return formatDate(dob, 'MM/dd/yyyy');
};

export const calculateAge = (dob: string): number => {
  const birthDate = typeof dob === 'string' ? parseISO(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Address formatting
export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): string => {
  const parts = [];
  
  if (address.street) parts.push(address.street);
  
  const cityState = [];
  if (address.city) cityState.push(address.city);
  if (address.state) cityState.push(address.state);
  if (cityState.length > 0) parts.push(cityState.join(', '));
  
  if (address.zipCode) parts.push(address.zipCode);
  
  return parts.join(', ');
};

// Name formatting
export const formatName = (firstName?: string, lastName?: string, middleName?: string): string => {
  const parts = [];
  
  if (firstName) parts.push(firstName);
  if (middleName) parts.push(middleName);
  if (lastName) parts.push(lastName);
  
  return parts.join(' ');
};

export const formatNameLastFirst = (firstName?: string, lastName?: string, middleName?: string): string => {
  if (!lastName && !firstName) return '';
  
  const parts = [];
  if (lastName) parts.push(lastName + ',');
  if (firstName) parts.push(firstName);
  if (middleName) parts.push(middleName);
  
  return parts.join(' ');
};

export const getInitials = (firstName?: string, lastName?: string): string => {
  const initials = [];
  if (firstName) initials.push(firstName.charAt(0).toUpperCase());
  if (lastName) initials.push(lastName.charAt(0).toUpperCase());
  return initials.join('');
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// URL formatting
export const ensureHttps = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url.replace(/^http:\/\//, 'https://');
};

export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(ensureHttps(url));
    return urlObj.hostname;
  } catch {
    return url;
  }
};

// Template formatting
export const replaceTemplateVariables = (template: string, variables: Record<string, string>): string => {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};

export const extractTemplateVariables = (template: string): string[] => {
  const regex = /{{\s*([^}]+)\s*}}/g;
  const variables = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1].trim());
  }
  
  return [...new Set(variables)];
};