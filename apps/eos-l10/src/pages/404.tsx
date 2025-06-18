import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | EOS L10 Platform</title>
        <meta name="description" content="The page you're looking for could not be found." />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md w-full text-center">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <span className="text-2xl font-bold text-red-600">404</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Page Not Found
            </h1>
            
            <p className="text-gray-600 mb-8">
              Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
            </p>
            
            <div className="space-y-4">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-eos-600 hover:bg-eos-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

