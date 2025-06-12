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
          primary: 'rgb(var(--handouts-primary) / <alpha-value>)',
          secondary: 'rgb(var(--handouts-secondary) / <alpha-value>)',
          accent: 'rgb(var(--handouts-accent) / <alpha-value>)',
          education: 'rgb(var(--handouts-education) / <alpha-value>)',
          treatment: 'rgb(var(--handouts-treatment) / <alpha-value>)',
          medication: 'rgb(var(--handouts-medication) / <alpha-value>)',
          procedure: 'rgb(var(--handouts-procedure) / <alpha-value>)'
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