import React from 'react';
import { useRouter } from 'next/router';
import { Calendar, Rocket } from 'lucide-react';

export default function ComingSoon() {
  const router = useRouter();
  const { app } = router.query;

  const appNames: Record<string, string> = {
    'eos-l10': 'EOS L10 Team Management',
    'batch-closeout': 'Batch Closeout',
    'integration-status': 'Integration Status',
    'pharma-scheduling': 'Pharma Scheduling',
    'socials-reviews': 'Socials & Reviews',
    'ai-receptionist': 'AI Receptionist',
    'call-center-ops': 'Call Center Operations',
    'medication-auth': 'Medication Authorization',
    'component-showcase': 'Component Showcase',
  };

  const appName = app && typeof app === 'string' ? appNames[app] || app : 'This application';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <Rocket className="w-16 h-16 mx-auto text-indigo-600 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Coming Soon!
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          <span className="font-semibold text-indigo-600">{appName}</span> is currently being deployed and will be available shortly.
        </p>
        
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <Calendar className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
          <p className="text-sm text-gray-700">
            Expected availability: Within 24-48 hours
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            This is a BETA release. Your feedback is valuable!
          </p>
          <p className="text-xs text-gray-400">
            If you need immediate access, please contact IT support.
          </p>
        </div>
        
        <button
          onClick={() => router.push('/')}
          className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
