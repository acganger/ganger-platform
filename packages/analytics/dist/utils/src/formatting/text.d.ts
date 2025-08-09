import { type ClassValue } from 'clsx';
/**
 * Combine class names with tailwind-merge to handle conflicts
 * @param inputs - Class values to combine
 * @returns Combined class string
 */
export declare function cn(...inputs: ClassValue[]): string;
export declare const capitalize: (str: string) => string;
export declare const titleCase: (str: string) => string;
export declare const camelCase: (str: string) => string;
export declare const kebabCase: (str: string) => string;
export declare const snakeCase: (str: string) => string;
export declare const truncate: (str: string, length: number, suffix?: string) => string;
export declare const stripHtml: (html: string) => string;
export declare const slugify: (str: string) => string;
export declare const formatPhoneNumber: (phone: string) => string;
export declare const parsePhoneNumber: (phone: string) => string;
export declare const formatSSN: (ssn: string) => string;
export declare const maskSSN: (ssn: string) => string;
export declare const formatCurrency: (amount: number, currency?: string) => string;
export declare const parseCurrency: (currencyString: string) => number;
export declare const formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
export declare const formatDateTime: (date: string | Date) => string;
export declare const formatTime: (time: string | Date) => string;
export declare const formatRelativeTime: (date: string | Date) => string;
export declare const formatMRN: (mrn: string) => string;
export declare const formatDOB: (dob: string) => string;
export declare const calculateAge: (dob: string | Date) => number;
export declare const formatAddress: (address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}) => string;
export declare const formatName: (firstName?: string, lastName?: string, middleName?: string) => string;
export declare const formatNameLastFirst: (firstName?: string, lastName?: string, middleName?: string) => string;
export declare const getInitials: (firstName?: string, lastName?: string) => string;
export declare const formatFileSize: (bytes: number) => string;
export declare const ensureHttps: (url: string) => string;
export declare const extractDomain: (url: string) => string;
export declare const replaceTemplateVariables: (template: string, variables: Record<string, string>) => string;
export declare const extractTemplateVariables: (template: string) => string[];
/**
 * Capitalize first letter (simple version)
 */
export declare const capitalizeFirst: (str: string) => string;
/**
 * Convert kebab-case to Title Case
 */
export declare const kebabToTitle: (str: string) => string;
/**
 * Format time ago in a concise format
 */
export declare const formatTimeAgo: (date: string | Date) => string;
/**
 * Truncate text with ellipsis
 */
export declare const truncateText: (text: string, maxLength: number) => string;
/**
 * Generate avatar background color from name
 */
export declare const getAvatarColor: (name: string) => string;
