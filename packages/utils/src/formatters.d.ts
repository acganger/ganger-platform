/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale to use for formatting (default: en-US)
 * @returns Formatted currency string
 */
export declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
/**
 * Format a number as a percentage
 * @param value - The value to format (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export declare function formatPercentage(value: number, decimals?: number): string;
/**
 * Format a number with thousands separators
 * @param value - The number to format
 * @param locale - The locale to use for formatting (default: en-US)
 * @returns Formatted number string
 */
export declare function formatNumber(value: number, locale?: string): string;
/**
 * Format bytes to human readable format
 * @param bytes - The number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Format a date to a readable string
 * @param date - The date to format (string, number, or Date)
 * @param options - Intl.DateTimeFormatOptions or a preset format
 * @returns Formatted date string
 */
export declare function formatDate(date: string | number | Date, options?: Intl.DateTimeFormatOptions | 'short' | 'medium' | 'long' | 'full'): string;
/**
 * Format a date to relative time (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export declare function formatRelativeTime(date: string | number | Date): string;
