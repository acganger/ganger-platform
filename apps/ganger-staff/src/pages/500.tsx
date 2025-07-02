import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-2">500</h1>
        <p className="text-xl text-gray-600 mb-8">Something went wrong</p>
        <Link 
          href="/" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}