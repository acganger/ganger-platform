/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Compliance-specific status colors
        'compliance-completed': '#10b981',
        'compliance-overdue': '#ef4444',
        'compliance-in-progress': '#f59e0b',
        'compliance-not-started': '#9ca3af',
        'compliance-not-required': '#d1d5db',
      }
    },
  },
  plugins: [],
}