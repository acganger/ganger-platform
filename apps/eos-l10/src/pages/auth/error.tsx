import { useRouter } from 'next/router';
import { AlertCircle } from 'lucide-react';

export default function AuthError() {
  const router = useRouter();
  const { message } = router.query;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Error
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message || 'There was a problem signing you in.'}
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-eos-600 hover:bg-eos-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
            >
              Try Again
            </button>
            
            <p className="text-xs text-gray-500">
              If you continue to have problems, contact your team administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
// Force SSR to prevent auth context issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
}
export const runtime = 'edge';
