/**
 * Booking Page
 * Main pharmaceutical presentation booking interface with calendar
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import AvailabilityCalendar from '@/components/calendar/AvailabilityCalendar';
import { LoadingSpinner, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAvailability, useLocations } from '@/hooks';
import type { TimeSlot, Location } from '@/types';

const BookingPage: React.FC = () => {
  const router = useRouter();
  const { location: locationSlug } = router.query;
  
  const { locations } = useLocations();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingStep, setBookingStep] = useState<'calendar' | 'form' | 'confirmation'>('calendar');

  // Find the selected location
  useEffect(() => {
    if (locationSlug && locations.length > 0) {
      const location = locations.find(loc => loc.slug === locationSlug);
      setSelectedLocation(location || null);
    }
  }, [locationSlug, locations]);

  const { 
    availability, 
    calendarData, 
    loading: availabilityLoading, 
    error: availabilityError,
    refetch: refetchAvailability 
  } = useAvailability(selectedLocation?.name || '', 1, 12);

  const handleBack = () => {
    if (bookingStep === 'form' && selectedSlot) {
      setBookingStep('calendar');
      setSelectedSlot(null);
    } else {
      router.push('/locations');
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setBookingStep('form');
  };

  const handleBookingComplete = () => {
    setBookingStep('confirmation');
  };

  // Loading state
  if (!selectedLocation && locations.length > 0) {
    return (
      <PublicLayout>
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Location Not Found
              </h2>
              <p className="text-red-700 mb-4">
                The requested location could not be found.
              </p>
              <button
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={() => router.push('/locations')}
              >
                View Available Locations
              </button>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!selectedLocation) {
    return (
      <PublicLayout>
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading location...</span>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Book Appointment - {selectedLocation.name} | Pharmaceutical Scheduling</title>
        <meta 
          name="description" 
          content={`Schedule your pharmaceutical presentation at Ganger Dermatology ${selectedLocation.name}. View real-time availability and book instantly.`} 
        />
      </Head>

      <PublicLayout>
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <button
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-transparent border-0 rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 mb-6"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {bookingStep === 'form' ? 'Back to Calendar' : 'Back to Locations'}
              </button>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Schedule Appointment - {selectedLocation.name}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedLocation.address}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Available: {selectedLocation.availableDays.join(', ')}</span>
                    <span>•</span>
                    <span>{selectedLocation.timeRange}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${
                  bookingStep === 'calendar' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    bookingStep === 'calendar' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white'
                  }`}>
                    {bookingStep === 'calendar' ? '1' : <CheckCircle className="w-5 h-5" />}
                  </div>
                  <span className="font-medium">Select Time</span>
                </div>
                
                <div className={`h-0.5 w-16 ${
                  bookingStep !== 'calendar' ? 'bg-green-600' : 'bg-gray-300'
                }`} />
                
                <div className={`flex items-center space-x-2 ${
                  bookingStep === 'form' ? 'text-blue-600' : 
                  bookingStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    bookingStep === 'form' 
                      ? 'bg-blue-600 text-white'
                      : bookingStep === 'confirmation'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {bookingStep === 'confirmation' ? <CheckCircle className="w-5 h-5" /> : '2'}
                  </div>
                  <span className="font-medium">Enter Details</span>
                </div>
                
                <div className={`h-0.5 w-16 ${
                  bookingStep === 'confirmation' ? 'bg-green-600' : 'bg-gray-300'
                }`} />
                
                <div className={`flex items-center space-x-2 ${
                  bookingStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    bookingStep === 'confirmation' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {bookingStep === 'confirmation' ? <CheckCircle className="w-5 h-5" /> : '3'}
                  </div>
                  <span className="font-medium">Confirmation</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="booking-grid">
              {/* Calendar Section */}
              <div className="lg:col-span-3">
                {bookingStep === 'calendar' && (
                  <>
                    {availabilityError ? (
                      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Unable to Load Availability
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {availabilityError}
                          </p>
                          <button
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onClick={refetchAvailability}
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    ) : (
                      <AvailabilityCalendar
                        availability={availability}
                        selectedSlot={selectedSlot}
                        onSlotSelect={handleSlotSelect}
                        loading={availabilityLoading}
                      />
                    )}
                  </>
                )}

                {bookingStep === 'form' && selectedSlot && (
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                    <div className="flex flex-col space-y-1.5 pb-4 mb-4">
                      <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900">Booking Form Placeholder</h3>
                    </div>
                    <div className="pt-0">
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Booking Form Coming Soon
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Selected time: {selectedSlot.startTime} - {selectedSlot.endTime}
                        </p>
                        <button 
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          onClick={() => setBookingStep('calendar')}
                        >
                          Back to Calendar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {bookingStep === 'confirmation' && (
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                    <div className="flex flex-col space-y-1.5 pb-4 mb-4">
                      <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900">Confirmation Placeholder</h3>
                    </div>
                    <div className="pt-0">
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Booking Confirmed!
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Your presentation has been scheduled and is pending approval.
                        </p>
                        <button 
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          onClick={() => router.push('/')}
                        >
                          Schedule Another
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {bookingStep === 'calendar' && (
                  <BookingInstructions location={selectedLocation} />
                )}
                
                {selectedSlot && (
                  <SelectedSlotSummary 
                    slot={selectedSlot} 
                    location={selectedLocation}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    </>
  );
};

// Helper Components
interface BookingInstructionsProps {
  location: Location;
}

const BookingInstructions: React.FC<BookingInstructionsProps> = ({ location }) => (
  <Card className="sticky top-4">
    <CardHeader className="pb-4 mb-4">
      <CardTitle className="text-base">Booking Instructions</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Step 1: Select Date & Time</h4>
        <p className="text-sm text-gray-600">
          Choose an available date from the calendar, then select your preferred time slot.
        </p>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-2">What's Included</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 45-minute presentation time</li>
          <li>• Lunch for attending staff</li>
          <li>• Professional presentation setup</li>
          <li>• Up to {location.maxParticipants} attendees</li>
        </ul>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
        <p className="text-sm text-gray-600 mb-2">
          Contact our scheduling team:
        </p>
        <p className="text-sm text-blue-600">
          (734) 996-8767
        </p>
      </div>
    </CardContent>
  </Card>
);

interface SelectedSlotSummaryProps {
  slot: TimeSlot;
  location: Location;
}

const SelectedSlotSummary: React.FC<SelectedSlotSummaryProps> = ({ slot, location }) => (
  <Card className="mt-4 sticky top-4">
    <CardHeader className="pb-4 mb-4">
      <CardTitle className="text-base">Selected Appointment</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <div className="text-sm text-gray-500">Location</div>
        <div className="font-medium">{location.name}</div>
      </div>
      
      <div>
        <div className="text-sm text-gray-500">Date</div>
        <div className="font-medium">{slot.date}</div>
      </div>
      
      <div>
        <div className="text-sm text-gray-500">Time</div>
        <div className="font-medium">{slot.startTime} - {slot.endTime}</div>
      </div>
      
      <div>
        <div className="text-sm text-gray-500">Duration</div>
        <div className="font-medium">{slot.duration} minutes</div>
      </div>
      
      <div className="pt-3 border-t">
        <div className="text-xs text-gray-500 text-center">
          Click "Continue" to proceed with booking
        </div>
      </div>
    </CardContent>
  </Card>
);

export default BookingPage;