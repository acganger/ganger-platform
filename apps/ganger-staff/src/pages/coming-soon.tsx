import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ComingSoonPage() {
  const router = useRouter();
  const appName = router.query.app as string || 'This application';

  const appDisplay = appName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h1>
        <p className="text-gray-600 mb-8">
          {appDisplay} is currently being deployed and will be available shortly.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Applications
        </Link>
      </div>
    </div>
  );
}