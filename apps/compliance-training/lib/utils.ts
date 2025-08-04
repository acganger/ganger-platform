/**
 * Utility functions for the compliance training app
 */

// Re-export common utilities from @ganger/utils
export { 
  cn, 
  formatDate, 
  formatPercentage,
  capitalize,
  generateId,
  debounce,
  deepClone as deepMerge // Note: @ganger/utils has deepClone, not deepMerge
} from '@ganger/utils';