import Head from 'next/head';
import Link from 'next/link';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function Custom500() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <>
      <Head>
        <title>500 - Server Error | EOS L10 Platform</title>
        <meta name="description" content="An internal server error occurred." />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md w-full text-center">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Server Error
            </h1>
            
            <p className="text-gray-600 mb-8">
              We're experiencing some technical difficulties. Our team has been notified and is working to fix the issue.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleRetry}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-eos-600 hover:bg-eos-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-gray-500">
              Error Code: 500 - Internal Server Error
            </p>
            <p className="text-xs text-gray-400 mt-2">
              If this problem persists, please contact support with the timestamp: {new Date().toISOString()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

