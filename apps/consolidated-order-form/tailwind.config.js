/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@ganger/config/tailwind')],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}