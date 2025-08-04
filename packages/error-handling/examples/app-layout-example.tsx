import { ErrorBoundary, ErrorProvider } from '@ganger/error-handling';
import { AuthProvider } from '@ganger/auth/client';

/**
 * Example root layout for Ganger Platform applications
 * Shows how to integrate error handling with authentication
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <ErrorProvider 
          maxErrors={10}
          onError={(error) => {
            // In production, this could send to monitoring service
            console.error('Global error:', error);
          }}
        >
          <ErrorBoundary
            showDetails={process.env.NODE_ENV === 'development'}
            onError={(error, errorInfo) => {
              // Log to monitoring service
              console.error('Error boundary caught:', error, errorInfo);
            }}
          >
            <AuthProvider>
              <main id="main-content">
                {children}
              </main>
            </AuthProvider>
          </ErrorBoundary>
        </ErrorProvider>
      </body>
    </html>
  );
}