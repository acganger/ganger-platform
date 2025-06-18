// Cloudflare Workers Edge Runtime
export const runtime = 'edge';

/**
 * Landing Page
 * Professional pharmaceutical scheduling landing page
 */

import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Calendar, 
  MapPin, 
  CheckCircle, 
  Clock,
  Users,
  ArrowRight,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';

const LandingPage: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/locations');
  };

  return (
    <>
      <Head>
        <title>Pharmaceutical Scheduling | Ganger Dermatology</title>
        <meta 
          name="description" 
          content="Schedule your educational lunch presentation with Ganger Dermatology. Professional pharmaceutical representative booking system for Michigan locations." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PublicLayout>
        {/* Hero Section */}
        <section className="medical-gradient py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Schedule Your
                <span className="text-blue-600 block">
                  Educational Lunch Presentation
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                Partner with Ganger Dermatology to educate our medical staff about your 
                innovative pharmaceutical solutions. Book a convenient lunch presentation 
                time at one of our three Michigan locations.
              </p>

              {/* CTA Button */}
              <div className="mb-12">
                <button
                  className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={handleGetStarted}
                >
                  Schedule Your Presentation
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Real-time Availability
                  </h3>
                  <p className="text-gray-600">
                    See available times instantly with our live calendar integration
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Three Locations
                  </h3>
                  <p className="text-gray-600">
                    Ann Arbor, Wixom, and Plymouth locations available
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Professional Process
                  </h3>
                  <p className="text-gray-600">
                    Streamlined approval process with immediate confirmation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Overview */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our streamlined process makes scheduling your educational presentation simple and efficient
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Choose Location
                </h3>
                <p className="text-gray-600">
                  Select from our Ann Arbor, Wixom, or Plymouth locations
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select Time
                </h3>
                <p className="text-gray-600">
                  View real-time availability and choose your preferred time slot
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Provide Details
                </h3>
                <p className="text-gray-600">
                  Enter your information and presentation details
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  ✓
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Get Confirmed
                </h3>
                <p className="text-gray-600">
                  Receive immediate confirmation and calendar invite
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  What to Expect
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        45-Minute Presentations
                      </h3>
                      <p className="text-gray-600">
                        Professional setting with dedicated time for your educational content
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Engaged Medical Staff
                      </h3>
                      <p className="text-gray-600">
                        Lunch provided for attending dermatology professionals and staff
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Professional Setup
                      </h3>
                      <p className="text-gray-600">
                        Presentation equipment and comfortable meeting space provided
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Quality Assurance
                      </h3>
                      <p className="text-gray-600">
                        Approval process ensures appropriate audience and timing
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onClick={handleGetStarted}
                  >
                    Start Scheduling
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>

              <div className="lg:pl-8">
                <Card>
                  <CardHeader className="pb-4 mb-4">
                    <CardTitle>Ready to Get Started?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">
                          Available Monday - Friday, 11:30 AM - 2:00 PM
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">
                          Book up to 12 weeks in advance
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">
                          Perfect for groups of 5-15 staff members
                        </span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={handleGetStarted}
                      >
                        Schedule Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Need Assistance?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our team is here to help with your scheduling needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardContent>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Phone Support
                </h3>
                <p className="text-gray-600 mb-4">
                  Call our scheduling team for assistance
                </p>
                <p className="text-lg font-medium text-blue-600">
                  (734) 996-8767
                </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Monday - Friday, 8:00 AM - 5:00 PM
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email Support
                </h3>
                <p className="text-gray-600 mb-4">
                  Send us your questions or special requests
                </p>
                <p className="text-lg font-medium text-green-600">
                  scheduling@gangerdermatology.com
                </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Response within 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </PublicLayout>
    </>
  );
};

export default LandingPage;