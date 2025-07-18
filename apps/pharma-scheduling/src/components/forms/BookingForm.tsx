/**
 * Booking Form Component
 * Professional pharmaceutical rep information capture form
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Building2, Phone, Mail, FileText, Users, MessageSquare, Check } from 'lucide-react';
import { Button, Badge, useToast } from '@ganger/ui';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@ganger/ui-catalyst';
import { CheckboxLegacy as Checkbox, Input } from '@ganger/ui-catalyst';
import { useBookingSubmission } from '@/hooks';
import type { TimeSlot, Location, BookingRequest } from '@/types';

// Validation schema
const bookingFormSchema = z.object({
  // Representative Information
  repFirstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  repLastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  repEmail: z.string().email('Invalid email address'),
  repPhone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  companyName: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  
  // Presentation Details
  participantCount: z.number().min(1, 'At least 1 participant required').max(20, 'Maximum 20 participants'),
  presentationTopic: z.string().min(1, 'Presentation topic is required').max(200, 'Topic too long'),
  
  // Additional Information
  specialRequests: z.string().max(500, 'Special requests too long').optional().or(z.literal('')),
  cateringPreferences: z.string().max(200, 'Catering preferences too long').optional().or(z.literal('')),
  
  // Consent and Communication
  marketingConsent: z.boolean(),
  emailConsent: z.boolean(),
  smsConsent: z.boolean(),
  phoneConsent: z.boolean()
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  selectedSlot: TimeSlot;
  location: Location;
  onSubmit: (data: BookingRequest) => void;
  onCancel: () => void;
  className?: string;
}

const BookingForm: React.FC<BookingFormProps> = ({
  selectedSlot,
  location,
  onSubmit,
  onCancel,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { submitBooking, loading, error } = useBookingSubmission();
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      participantCount: 1,
      marketingConsent: false,
      emailConsent: true,
      smsConsent: false,
      phoneConsent: false
    },
    mode: 'onChange'
  });

  const watchedValues = watch();

  const handleFormSubmit = async (data: BookingFormData) => {
    try {
      const bookingRequest: BookingRequest = {
        // Representative information
        repEmail: data.repEmail,
        repFirstName: data.repFirstName,
        repLastName: data.repLastName,
        repPhone: data.repPhone || undefined,
        companyName: data.companyName,
        
        // Appointment details
        location: location.name,
        appointmentDate: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        participantCount: data.participantCount,
        
        // Additional information
        specialRequests: data.specialRequests || undefined,
        presentationTopic: data.presentationTopic,
        cateringPreferences: data.cateringPreferences || undefined,
        
        // Marketing consent
        marketingConsent: data.marketingConsent,
        communicationPreferences: {
          email: data.emailConsent,
          sms: data.smsConsent,
          phone: data.phoneConsent
        }
      };

      const response = await submitBooking(bookingRequest);
      addToast({
        title: 'Success',
        message: 'Booking submitted successfully!',
        type: 'success'
      });
      onSubmit(bookingRequest);
    } catch (err) {
      addToast({
        title: 'Error',
        message: error || 'Failed to submit booking. Please try again.',
        type: 'error'
      });
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = currentStep === 1 
      ? ['repFirstName', 'repLastName', 'repEmail', 'companyName']
      : ['participantCount', 'presentationTopic'];
    
    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Booking</CardTitle>
          <div className="text-sm text-gray-600">
            Step {currentStep} of 3
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Appointment Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Selected Appointment
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Location:</span>
                <div className="text-blue-800">{location.name}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Date:</span>
                <div className="text-blue-800">{selectedSlot.date}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Time:</span>
                <div className="text-blue-800">
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Duration:</span>
                <div className="text-blue-800">{selectedSlot.duration} minutes</div>
              </div>
            </div>
          </div>

          {/* Step 1: Representative Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <User className="w-5 h-5" />
                <span>Representative Information</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('repFirstName')}
                    type="text"
                    placeholder="John"
                  />
                  {errors.repFirstName?.message && (
                    <p className="text-sm text-red-600">{errors.repFirstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('repLastName')}
                    type="text"
                    placeholder="Smith"
                  />
                  {errors.repLastName?.message && (
                    <p className="text-sm text-red-600">{errors.repLastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('repEmail')}
                  type="email"
                  placeholder="john.smith@pharmaceutical.com"
                />
                {errors.repEmail?.message && (
                  <p className="text-sm text-red-600">{errors.repEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input
                  {...register('repPhone')}
                  type="tel"
                  placeholder="(555) 123-4567"
                />
                {errors.repPhone?.message && (
                  <p className="text-sm text-red-600">{errors.repPhone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('companyName')}
                  type="text"
                  placeholder="Pharmaceutical Company Inc."
                />
                {errors.companyName?.message && (
                  <p className="text-sm text-red-600">{errors.companyName.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Presentation Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <FileText className="w-5 h-5" />
                <span>Presentation Details</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Expected Participant Count <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('participantCount', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="20"
                  placeholder="8"
                />
                <p className="text-sm text-gray-500">How many staff members do you expect to attend?</p>
                {errors.participantCount?.message && (
                  <p className="text-sm text-red-600">{errors.participantCount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Presentation Topic <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('presentationTopic')}
                  type="text"
                  placeholder="New Dermatological Treatment Options"
                />
                <p className="text-sm text-gray-500">Brief description of your educational presentation topic</p>
                {errors.presentationTopic?.message && (
                  <p className="text-sm text-red-600">{errors.presentationTopic.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Special Requests
                </label>
                <textarea
                  {...register('specialRequests')}
                  rows={3}
                  placeholder="Projector setup, dietary restrictions, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500">Any special requirements for your presentation?</p>
                {errors.specialRequests?.message && (
                  <p className="text-sm text-red-600">{errors.specialRequests.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Catering Preferences
                </label>
                <textarea
                  {...register('cateringPreferences')}
                  rows={2}
                  placeholder="Vegetarian options, allergies, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500">Any specific lunch preferences or dietary requirements?</p>
                {errors.cateringPreferences?.message && (
                  <p className="text-sm text-red-600">{errors.cateringPreferences.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Consent and Communication */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <MessageSquare className="w-5 h-5" />
                <span>Communication Preferences</span>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    How would you like to receive updates about your appointment?
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <Checkbox
                        {...register('emailConsent')}
                        className="mt-0.5"
                        aria-describedby="email-consent-description"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Email notifications</div>
                        <div id="email-consent-description" className="text-sm text-gray-600">
                          Booking confirmations, reminders, and updates
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <Checkbox
                        {...register('smsConsent')}
                        className="mt-0.5"
                        aria-describedby="sms-consent-description"
                      />
                      <div>
                        <div className="font-medium text-gray-900">SMS notifications</div>
                        <div id="sms-consent-description" className="text-sm text-gray-600">
                          Appointment reminders via text message
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <Checkbox
                        {...register('phoneConsent')}
                        className="mt-0.5"
                        aria-describedby="phone-consent-description"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Phone contact</div>
                        <div id="phone-consent-description" className="text-sm text-gray-600">
                          Phone calls for urgent updates or changes
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <Checkbox
                      {...register('marketingConsent')}
                      className="mt-0.5"
                      aria-describedby="marketing-consent-description"
                    />
                    <div>
                      <div className="font-medium text-blue-900">
                        Educational content and updates
                      </div>
                      <div id="marketing-consent-description" className="text-sm text-blue-700">
                        Receive information about future educational opportunities, 
                        medical updates, and relevant dermatology news from Ganger Dermatology.
                        You can unsubscribe at any time.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3">
                  Booking Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Representative:</span>
                    <span className="text-green-800 font-medium">
                      {watchedValues.repFirstName} {watchedValues.repLastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Company:</span>
                    <span className="text-green-800 font-medium">
                      {watchedValues.companyName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Topic:</span>
                    <span className="text-green-800 font-medium">
                      {watchedValues.presentationTopic}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Participants:</span>
                    <span className="text-green-800 font-medium">
                      {watchedValues.participantCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={loading}
              >
                Previous
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          <div>
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={loading}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!isValid || loading}
              >
                <Check className="w-4 h-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Booking'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </form>
  );
};

export default BookingForm;