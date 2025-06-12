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
          primary: 'rgb(var(--inventory-primary) / <alpha-value>)',
          secondary: 'rgb(var(--inventory-secondary) / <alpha-value>)',
          accent: 'rgb(var(--inventory-accent) / <alpha-value>)'
        }
      }
    }
  }
};