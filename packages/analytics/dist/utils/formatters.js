import { format } from 'date-fns';
export function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}
export function formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}
export function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}
export function formatCompactNumber(value) {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
}
export function formatDate(date, formatStr = 'MMM d, yyyy') {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr);
}
export function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
