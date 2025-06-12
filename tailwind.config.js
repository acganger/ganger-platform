/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/*/src/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/*/src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ganger Platform Brand Colors
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',  // blue-500
          600: '#2563eb',  // blue-600
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f0fdf4',
          500: '#22c55e',  // green-500
          600: '#16a34a',  // green-600
          700: '#15803d',
        },
        accent: {
          50: '#faf5ff',
          500: '#a855f7',  // purple-500
          600: '#9333ea',  // purple-600
          700: '#7c3aed',
        },
        // Handouts-specific colors
        'handouts-primary': '#3b82f6',
        'handouts-secondary': '#22c55e',
        'handouts-education': '#06b6d4',
        'handouts-treatment': '#f59e0b',
        'handouts-medication': '#ef4444',
        'handouts-procedure': '#8b5cf6',
        // Inventory-specific colors
        'inventory-primary': '#3b82f6',
        'inventory-secondary': '#22c55e'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}