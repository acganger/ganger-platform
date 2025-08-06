'use client'

import React from 'react';
import { Button } from '../components/Button';

interface StaffLoginRedirectProps {
  appName: string;
  message?: string;
}

export function StaffLoginRedirect({ appName, message }: StaffLoginRedirectProps) {
  const handleLogin = () => {
    // In a real implementation, this would trigger the OAuth flow
    // For now, we'll show a placeholder
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Staff Authentication Required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {message || `Please sign in to access ${appName}`}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <Button 
              onClick={handleLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Google Workspace
            </Button>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">
              This application requires Ganger Dermatology staff credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}