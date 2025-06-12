/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Call center specific colors
        callActive: '#10b981',     // emerald-500 - Active calls
        callWaiting: '#f59e0b',    // amber-500 - Waiting calls  
        callMissed: '#ef4444',     // red-500 - Missed calls
        callComplete: '#6b7280',   // gray-500 - Completed calls
        
        // Performance indicators
        performanceExcellent: '#059669', // emerald-600
        performanceGood: '#0891b2',      // cyan-600
        performanceAverage: '#ca8a04',   // yellow-600
        performanceNeedsImprovement: '#dc2626', // red-600
        
        // Goal achievement
        goalAchieved: '#16a34a',    // green-600
        goalOnTrack: '#2563eb',     // blue-600
        goalBehind: '#ea580c',      // orange-600
        goalCritical: '#dc2626',    // red-600
      },
    },
  },
  plugins: [],
};