/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  presets: [require('@ganger/config/tailwind')],
  theme: {
    extend: {
      colors: {
        handouts: {
          primary: '#3b82f6',  // Maps to primary-500 from base config
          secondary: '#a855f7', // Maps to accent-500 from base config  
          accent: '#ec4899',
          education: '#22c55e', // Maps to success-500 from base config
          treatment: '#f59e0b', // Maps to warning-500 from base config
          medication: '#a855f7',
          procedure: '#ef4444'  // Maps to error-500 from base config
        }
      },
      animation: {
        'scan': 'scan 2s ease-in-out infinite',
        'pdf-gen': 'pulse 1.5s ease-in-out infinite'
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' }
        }
      }
    }
  }
};