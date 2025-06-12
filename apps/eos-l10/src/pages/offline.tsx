import Head from 'next/head';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <>
      <Head>
        <title>Offline - EOS L10 Platform</title>
        <meta name="description" content="You are currently offline" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="h-8 w-8 text-gray-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You're Offline
            </h1>
            
            <p className="text-gray-600 mb-6">
              It looks like you don't have an internet connection. Some features may not be available, but you can still view your cached data.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleRetry}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-eos-600 hover:bg-eos-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
              >
                Go Back
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              What you can do offline:
            </h2>
            
            <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                View your recent teams and data
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Access cached meeting notes
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Create new items (will sync later)
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                Real-time collaboration (requires connection)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}