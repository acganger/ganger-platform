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
        inventory: {
          primary: '#22c55e',   // Maps to success-500 from base config (green for inventory)
          secondary: '#3b82f6', // Maps to primary-500 from base config
          accent: '#f59e0b',    // Maps to warning-500 from base config
          success: '#22c55e',
          warning: '#f59e0b', 
          error: '#ef4444',
          info: '#3b82f6'
        }
      },
      animation: {
        'barcode-scan': 'scan 2s ease-in-out infinite',
        'stock-update': 'pulse 1.5s ease-in-out infinite'
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