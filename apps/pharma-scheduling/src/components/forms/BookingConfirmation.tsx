/**
 * Booking Confirmation Component
 * Professional confirmation display for pharmaceutical scheduling
 */

import React from 'react';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Building2, 
  Mail,
  Phone,
  Download,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
// import { Button } from '@ganger/ui'; // Replaced with native HTML elements
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@ganger/ui'; // Replaced with native HTML elements
import type { BookingResponse, Location, TimeSlot } from '@/types';

interface BookingConfirmationProps {
  booking: BookingResponse;
  location: Location;
  slot: TimeSlot;
  repInfo: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
  };
  onNewBooking: () => void;
  className?: string;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  location,
  slot,
  repInfo,
  onNewBooking,
  className
}) => {
  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusMessage = () => {
    switch (booking.status) {
      case 'confirmed':
        return {
          title: 'Booking Confirmed!',
          message: 'Your presentation has been approved and confirmed.',
          color: 'green'
        };
      case 'pending_approval':
        return {
          title: 'Booking Submitted!',
          message: 'Your presentation request is pending approval from our medical staff.',
          color: 'blue'
        };
      case 'rejected':
        return {
          title: 'Booking Not Approved',
          message: 'Unfortunately, your presentation request could not be approved at this time.',
          color: 'red'
        };
      default:
        return {
          title: 'Booking Received',
          message: 'Your booking request has been received and is being processed.',
          color: 'gray'
        };
    }
  };

  const statusInfo = getStatusMessage();

  const handleDownloadCalendar = () => {
    if (booking.calendarEvent?.icsUrl) {
      window.open(booking.calendarEvent.icsUrl, '_blank');
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (booking.calendarEvent?.googleCalendarUrl) {
      window.open(booking.calendarEvent.googleCalendarUrl, '_blank');
    }
  };

  return (
    <div className={className}>
      {/* Success Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
        <div className="pt-0 text-center py-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            statusInfo.color === 'green' ? 'bg-green-100' :
            statusInfo.color === 'blue' ? 'bg-blue-100' :
            statusInfo.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <CheckCircle className={`w-8 h-8 ${
              statusInfo.color === 'green' ? 'text-green-600' :
              statusInfo.color === 'blue' ? 'text-blue-600' :
              statusInfo.color === 'red' ? 'text-red-600' : 'text-gray-600'
            }`} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {statusInfo.title}
          </h1>
          
          <p className="text-lg text-gray-600 mb-4">
            {statusInfo.message}
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 inline-block">
            <div className="text-sm text-gray-500">Confirmation Number</div>
            <div className="text-xl font-bold text-gray-900">
              {booking.confirmationNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col space-y-1.5 pb-4 mb-4">
          <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900">Appointment Details</h3>
        </div>
        <div className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Date & Time</div>
                  <div className="text-gray-600">
                    {formatDate(booking.appointmentDetails.date)}
                  </div>
                  <div className="text-gray-600">
                    {booking.appointmentDetails.time} ({booking.appointmentDetails.duration} minutes)
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Location</div>
                  <div className="text-gray-600">{location.name}</div>
                  <div className="text-gray-600 text-sm">{location.address}</div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Representative</div>
                  <div className="text-gray-600">
                    {repInfo.firstName} {repInfo.lastName}
                  </div>
                  <div className="text-gray-600 text-sm">{repInfo.email}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Company</div>
                  <div className="text-gray-600">{repInfo.company}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col space-y-1.5 pb-4 mb-4">
          <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900">What Happens Next?</h3>
        </div>
        <div className="pt-0">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <div className="font-medium text-gray-900">Approval Process</div>
                <div className="text-gray-600 text-sm">
                  {booking.approvalProcess.estimatedResponseTime}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <div className="font-medium text-gray-900">Confirmation</div>
                <div className="text-gray-600 text-sm">
                  You'll receive email confirmation once approved by {booking.approvalProcess.contactPerson}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <div className="font-medium text-gray-900">Presentation Day</div>
                <div className="text-gray-600 text-sm">
                  Arrive 10 minutes early for setup. Lunch will be provided for attending staff.
                </div>
              </div>
            </div>
          </div>

          {booking.approvalProcess.nextSteps.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Additional Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {booking.approvalProcess.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Integration */}
      {booking.calendarEvent && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col space-y-1.5 pb-4 mb-4">
            <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900">Add to Your Calendar</h3>
          </div>
          <div className="pt-0">
            <p className="text-gray-600 mb-4">
              Add this appointment to your calendar to receive reminders.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={handleDownloadCalendar}
              >
                <Download className="w-4 h-4 mr-2" />
                Download .ics File
              </button>
              <button
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={handleAddToGoogleCalendar}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Add to Google Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col space-y-1.5 pb-4 mb-4">
          <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900">Need to Make Changes?</h3>
        </div>
        <div className="pt-0">
          <p className="text-gray-600 mb-4">
            If you need to modify or cancel your appointment, please contact our scheduling team.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">(734) 996-8767</div>
                <div className="text-sm text-gray-600">Monday - Friday, 8:00 AM - 5:00 PM</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">scheduling@gangerdermatology.com</div>
                <div className="text-sm text-gray-600">Response within 24 hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onClick={onNewBooking}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Schedule Another Presentation
        </button>
        <button
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={() => window.print()}
        >
          <Download className="w-4 h-4 mr-2" />
          Print Confirmation
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;