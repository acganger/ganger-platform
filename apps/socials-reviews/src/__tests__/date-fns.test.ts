import { describe, it, expect } from '@jest/globals';
import { formatDistanceToNow } from 'date-fns';

describe('date-fns dependency', () => {
  it('should be available and working', () => {
    const testDate = new Date('2025-07-01');
    const result = formatDistanceToNow(testDate);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain('ago');
  });

  it('should format dates correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const hourResult = formatDistanceToNow(oneHourAgo);
    const dayResult = formatDistanceToNow(oneDayAgo);
    
    expect(hourResult).toContain('hour');
    expect(dayResult).toContain('day');
  });
});