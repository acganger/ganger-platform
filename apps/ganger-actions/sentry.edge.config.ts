import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is provided and not disabled
if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NEXT_PUBLIC_SENTRY_ENABLED !== 'false') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Adjust this value in production
    tracesSampleRate: 0.1,
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}