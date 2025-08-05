import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
/**
 * Combine class names with tailwind-merge to handle conflicts
 * @param inputs - Class values to combine
 * @returns Combined class string
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// Text formatting utilities
export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
export const titleCase = (str) => {
    return str
        .split(' ')
        .map(word => capitalize(word))
        .join(' ');
};
export const camelCase = (str) => {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
        .replace(/\s+/g, '');
};
export const kebabCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
};
export const snakeCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
};
export const truncate = (str, length, suffix = '...') => {
    if (str.length <= length)
        return str;
    return str.substring(0, length - suffix.length) + suffix;
};
export const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, '');
};
export const slugify = (str) => {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
// Phone number formatting
export const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
};
export const parsePhoneNumber = (phone) => {
    return phone.replace(/\D/g, '');
};
// SSN formatting
export const formatSSN = (ssn) => {
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return ssn;
};
export const maskSSN = (ssn) => {
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
        return `XXX-XX-${cleaned.slice(5)}`;
    }
    return ssn;
};
// Currency formatting
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};
export const parseCurrency = (currencyString) => {
    const cleaned = currencyString.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
};
// Date formatting (without date-fns dependency)
export const formatDate = (date, options) => {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }
    // Default format: MM/dd/yyyy
    const defaultOptions = {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    };
    return dateObj.toLocaleDateString('en-US', options || defaultOptions);
};
export const formatDateTime = (date) => {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }
    return dateObj.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};
export const formatTime = (time) => {
    if (typeof time === 'string' && !time.includes('T') && time.includes(':')) {
        // Handle time in HH:MM format
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours || '0', 10), parseInt(minutes || '0', 10));
        time = date;
    }
    const dateObj = new Date(time);
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Time';
    }
    return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};
export const formatRelativeTime = (date) => {
    const dateObj = new Date(date);
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
    return formatDate(dateObj);
};
// Medical formatting
export const formatMRN = (mrn) => {
    const cleaned = mrn.replace(/\D/g, '');
    // Format as XXX-XXX-XXXX if 10 digits
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return mrn;
};
export const formatDOB = (dob) => {
    return formatDate(dob);
};
export const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
// Address formatting
export const formatAddress = (address) => {
    const parts = [];
    if (address.street)
        parts.push(address.street);
    const cityState = [];
    if (address.city)
        cityState.push(address.city);
    if (address.state)
        cityState.push(address.state);
    if (cityState.length > 0)
        parts.push(cityState.join(', '));
    if (address.zipCode)
        parts.push(address.zipCode);
    return parts.join(', ');
};
// Name formatting
export const formatName = (firstName, lastName, middleName) => {
    const parts = [];
    if (firstName)
        parts.push(firstName);
    if (middleName)
        parts.push(middleName);
    if (lastName)
        parts.push(lastName);
    return parts.join(' ');
};
export const formatNameLastFirst = (firstName, lastName, middleName) => {
    if (!lastName && !firstName)
        return '';
    const parts = [];
    if (lastName)
        parts.push(lastName + ',');
    if (firstName)
        parts.push(firstName);
    if (middleName)
        parts.push(middleName);
    return parts.join(' ');
};
export const getInitials = (firstName, lastName) => {
    const initials = [];
    if (firstName)
        initials.push(firstName.charAt(0).toUpperCase());
    if (lastName)
        initials.push(lastName.charAt(0).toUpperCase());
    return initials.join('');
};
// File size formatting
export const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0)
        return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};
// URL formatting
export const ensureHttps = (url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url.replace(/^http:\/\//, 'https://');
};
export const extractDomain = (url) => {
    try {
        const urlObj = new URL(ensureHttps(url));
        return urlObj.hostname;
    }
    catch {
        return url;
    }
};
// Template formatting
export const replaceTemplateVariables = (template, variables) => {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        result = result.replace(regex, value);
    });
    return result;
};
export const extractTemplateVariables = (template) => {
    const regex = /{{\s*([^}]+)\s*}}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
        if (match[1]) {
            variables.push(match[1].trim());
        }
    }
    return [...new Set(variables)];
};
// Additional utilities from apps
/**
 * Capitalize first letter (simple version)
 */
export const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
/**
 * Convert kebab-case to Title Case
 */
export const kebabToTitle = (str) => {
    return str
        .split('-')
        .map(word => capitalizeFirst(word))
        .join(' ');
};
/**
 * Format time ago in a concise format
 */
export const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (diffInSeconds < 60)
        return 'just now';
    if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(date);
};
/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength) + '...';
};
/**
 * Generate avatar background color from name
 */
export const getAvatarColor = (name) => {
    const colors = [
        'bg-red-500',
        'bg-yellow-500',
        'bg-green-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-purple-500',
        'bg-pink-500',
    ];
    const hash = name.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length] || 'bg-gray-500';
};
