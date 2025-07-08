/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale to use for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number as a percentage
 * @param value - The value to format (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a number with thousands separators
 * @param value - The number to format
 * @param locale - The locale to use for formatting (default: en-US)
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value)
}

/**
 * Format bytes to human readable format
 * @param bytes - The number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format a date to a readable string
 * @param date - The date to format (string, number, or Date)
 * @param options - Intl.DateTimeFormatOptions or a preset format
 * @returns Formatted date string
 */
export function formatDate(
  date: string | number | Date,
  options: Intl.DateTimeFormatOptions | 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const dateObj = new Date(date)
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  // Preset formats
  const presets: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  }

  const formatOptions = typeof options === 'string' ? presets[options] : options

  return dateObj.toLocaleDateString('en-US', formatOptions)
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | number | Date): string {
  const dateObj = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}