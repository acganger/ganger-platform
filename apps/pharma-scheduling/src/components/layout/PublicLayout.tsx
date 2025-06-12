/**
 * Public Layout Component
 * Professional layout for pharmaceutical representatives booking interface
 */

import React from 'react';
import { useRouter } from 'next/router';
import { Calendar, Phone, MapPin, ArrowLeft } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
  description?: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  showBackButton = false,
  title,
  description
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <a href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    Ganger Dermatology
                  </div>
                  <div className="text-xs text-gray-500">
                    Pharmaceutical Scheduling
                  </div>
                </div>
              </a>

              {/* Back Button */}
              {showBackButton && (
                <button
                  onClick={() => router.back()}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>
              )}
            </div>

            {/* Contact Info */}
            <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>(734) 996-8767</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>3 Michigan Locations</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Header */}
      {(title || description) && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-gray-600 max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">
                  Ganger Dermatology
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Michigan's premier dermatology practice, providing exceptional 
                care and education opportunities for pharmaceutical representatives.
              </p>
              <div className="text-sm text-gray-500">
                © 2025 Ganger Dermatology. All rights reserved.
              </div>
            </div>

            {/* Locations */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Our Locations</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <div className="font-medium text-gray-900">Ann Arbor</div>
                  <div>4140 East Morgan Road</div>
                  <div>Ann Arbor, MI 48108</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Plymouth</div>
                  <div>9500 S. Main Street</div>
                  <div>Plymouth, MI 48170</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Wixom</div>
                  <div>29531 Beck Road</div>
                  <div>Wixom, MI 48393</div>
                </div>
              </div>
            </div>

            {/* Contact & Support */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Contact & Support</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>(734) 996-8767</span>
                </div>
                <div>
                  <strong>Business Hours:</strong><br />
                  Monday - Friday: 8:00 AM - 5:00 PM<br />
                  Saturday: 9:00 AM - 2:00 PM
                </div>
                <div className="pt-2">
                  <a 
                    href="/support" 
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Booking Support →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;