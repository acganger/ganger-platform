/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // AI-specific colors from PRD
        'ai-active': '#10b981',      // emerald-500 - AI handling calls
        'ai-confident': '#3b82f6',   // blue-500 - High confidence
        'ai-uncertain': '#eab308',   // yellow-500 - Low confidence
        'human-transfer': '#f97316', // orange-500 - Transferred to human
      },
      animation: {
        'pulse-call': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  // Ensure all default colors including slate are available
  presets: [require('tailwindcss/defaultConfig')],
}