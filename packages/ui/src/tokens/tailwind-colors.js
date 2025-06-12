/**
 * Tailwind CSS Color Configuration
 * 
 * This file provides color tokens for Tailwind CSS configuration
 * across all applications in the Ganger Platform.
 */

// Import colors from TypeScript file (will be transpiled)
const { tailwindColors } = require('./colors.js');

module.exports = {
  ...tailwindColors,
  
  // Alias commonly used colors for easier migration
  gray: tailwindColors.neutral,
  blue: tailwindColors.primary,
  green: tailwindColors.success,
  red: tailwindColors.error,
  yellow: tailwindColors.warning,
  purple: tailwindColors.accent,
  
  // Semantic aliases for better readability
  danger: tailwindColors.error,
  warn: tailwindColors.warning,
};