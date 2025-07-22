import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,
  
  // This sets the sample rate to be 0%. You may want this to be 100% while in development and then sample at a lower rate in production
  replaysSessionSampleRate: 0,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    new Sentry.Replay({
      // Additional Replay configuration for HIPAA compliance
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out sensitive routes
  beforeSend(event, hint) {
    // Don't send events from auth callbacks
    if (event.request?.url?.includes('/auth/callback')) {
      return null;
    }
    return event;
  },
});