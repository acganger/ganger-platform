export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TimeOffRequestForm } from '@/components/forms/TimeOffRequestForm';
import { TimeOffRequestFormData } from '@/types';
import { LoadingSpinner } from '@ganger/ui-catalyst';
import { ArrowLeft, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function TimeOffRequestPage() {
  const { authUser, isAuthenticated, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTimeOffSubmit = async (data: TimeOffRequestFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // TODO: Implement API call to submit time off request
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Time off request submitted:', {
        user: authUser?.email,
        startDate: data.dateRange.startDate,
        endDate: data.dateRange.endDate,
        type: data.ptoElection,
        reason: data.reason,
        submittedAt: new Date().toISOString()
      });
      
      setSubmitStatus('success');
      
    } catch (error) {
      console.error('Error submitting time off request:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit time off request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // Authentication loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading..." center />
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    window.location.href = '/auth/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Staff Portal
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {authUser?.name || 'Staff Member'}
              </span>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Time Off Request
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Submit your vacation, sick leave, or unpaid leave request
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  Request Submitted Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your time off request has been submitted for manager approval.</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>You will receive an email confirmation shortly</li>
                    <li>Your manager will be notified to review the request</li>
                    <li>Check your email for approval status updates</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">
                  Submission Failed
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  {errorMessage}
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Off Request Form */}
        {submitStatus !== 'success' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <TimeOffRequestForm 
                onSubmit={handleTimeOffSubmit}
                loading={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Clock className="h-6 w-6 text-blue-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-800">
                Need Help with Your Request?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Contact your direct manager for questions about approval</li>
                  <li>For urgent requests, follow up via email or Slack</li>
                  <li>Check the staff handbook for detailed PTO policies</li>
                  <li>IT support: Use the Support Tickets form for technical issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
