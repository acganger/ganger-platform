/**
 * Locations Page
 * Professional location selection for pharmaceutical presentations
 */

import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeft, CheckCircle, MapPin } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import LocationCard from '@/components/ui/LocationCard';
import { LoadingSpinner, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useLocations } from '@/hooks';
import type { Location } from '@/types';

const LocationsPage: React.FC = () => {
  const router = useRouter();
  const { locations, loading, error } = useLocations();

  const handleLocationSelect = (location: Location) => {
    router.push(`/book/${location.slug}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  if (error) {
    return (
      <PublicLayout>
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Unable to Load Locations
              </h2>
              <p className="text-red-700 mb-4">
                {error}
              </p>
              <button
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Choose Location | Pharmaceutical Scheduling | Ganger Dermatology</title>
        <meta 
          name="description" 
          content="Select your preferred Ganger Dermatology location for your pharmaceutical presentation. Ann Arbor, Wixom, and Plymouth locations available." 
        />
      </Head>

      <PublicLayout>
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <button
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-transparent border-0 rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 mb-6"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </button>
              
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Choose Your Presentation Location
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Select the Ganger Dermatology location most convenient for your 
                  educational lunch presentation. Each location offers a professional 
                  setting with dedicated staff attendance.
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading locations...</span>
              </div>
            )}

            {/* Location Cards */}
            {!loading && locations.length > 0 && (
              <div className="location-grid mb-12">
                {locations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    onSelect={handleLocationSelect}
                    className="fade-in"
                  />
                ))}
              </div>
            )}

            {/* No Locations Available */}
            {!loading && locations.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Locations Available
                </h3>
                <p className="text-gray-600 mb-4">
                  We're currently updating our location availability. Please check back soon.
                </p>
                <button 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={() => router.push('/')}
                >
                  Return Home
                </button>
              </div>
            )}

            {/* Information Section */}
            {!loading && locations.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* What to Expect */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                  <div className="flex flex-col space-y-1.5 pb-4 mb-4">
                    <h3 className="text-lg font-semibold leading-none tracking-tight text-blue-900">
                      What to Expect at Your Presentation
                    </h3>
                  </div>
                  <div className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          45-minute educational lunch presentation time slot
                        </span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          Lunch provided for attending medical staff
                        </span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          Professional presentation setup and equipment
                        </span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          Approval process ensures appropriate audience
                        </span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          Dedicated parking and easy access to facility
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scheduling Guidelines */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                  <div className="flex flex-col space-y-1.5 pb-4 mb-4">
                    <h3 className="text-lg font-semibold leading-none tracking-tight text-purple-900">
                      Scheduling Guidelines
                    </h3>
                  </div>
                  <div className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          Available Hours
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Monday - Friday: 11:30 AM - 2:00 PM<br />
                          No presentations on weekends or holidays
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          Advance Booking
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Schedule up to 12 weeks in advance<br />
                          Minimum 24-hour notice required
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          Cancellation Policy
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Cancel or reschedule at least 24 hours prior<br />
                          Emergency cancellations accepted with approval
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          Group Size
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Typical attendance: 5-15 medical professionals<br />
                          Includes physicians, PAs, nurses, and clinical staff
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Support */}
            <div className="mt-12 text-center">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Need Assistance with Location Selection?
                </h3>
                <p className="text-gray-600 mb-4">
                  Our scheduling team is available to help you choose the best location 
                  for your presentation and answer any questions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    Call (734) 996-8767
                  </button>
                  <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    Email scheduling@gangerdermatology.com
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    </>
  );
};

export default LocationsPage;