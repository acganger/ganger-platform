import { useState, useEffect } from 'react';
import { Button } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { Checkbox, Input } from '@ganger/ui-catalyst';
import { handoutsCommunication } from '../lib/communication-service';

interface Patient {
  id: string; // Added for communication service integration
  mrn: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

interface DeliveryOptions {
  print: boolean;
  email: boolean;
  sms: boolean;
}

interface DeliveryOptionsProps {
  patient: Patient | null;
  options: DeliveryOptions;
  onChange: (options: DeliveryOptions) => void;
  onGenerate: (deliveryDetails?: { 
    smsEnabled: boolean; 
    emailEnabled: boolean; 
    consentRecorded: boolean;
  }) => void;
}

export function DeliveryOptions({ patient, options, onChange, onGenerate }: DeliveryOptionsProps) {
  const [editingContact, setEditingContact] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: patient?.email || '',
    phone: patient?.phone || ''
  });
  const [consentGiven, setConsentGiven] = useState(false);
  const [existingConsent, setExistingConsent] = useState<{
    sms: boolean;
    email: boolean;
  }>({ sms: false, email: false });
  const [savingConsent, setSavingConsent] = useState(false);

  // Check existing consent when patient changes
  useEffect(() => {
    if (patient?.id) {
      checkExistingConsent();
    }
  }, [patient?.id]);

  const checkExistingConsent = async () => {
    if (!patient?.id) return;

    try {
      const [smsConsent, emailConsent] = await Promise.all([
        handoutsCommunication.hasPatientConsent(patient.id, 'sms'),
        handoutsCommunication.hasPatientConsent(patient.id, 'email')
      ]);

      setExistingConsent({ sms: smsConsent, email: emailConsent });
      
      // If patient already has consent, no need to ask again
      if ((options.sms && smsConsent) || (options.email && emailConsent)) {
        setConsentGiven(true);
      }
    } catch (error) {
    }
  };

  const handleOptionChange = (option: keyof DeliveryOptions, value: boolean) => {
    onChange({ ...options, [option]: value });
  };

  const handleContactSave = async () => {
    if (!patient?.id) return;

    setSavingConsent(true);
    try {
      // Update patient contact information via communication service
      const result = await handoutsCommunication.updatePatientContact(
        patient.id,
        contactInfo.phone,
        contactInfo.email,
        options.sms && options.email ? 'both' : (options.sms ? 'sms' : 'email')
      );

      if (result.success) {
        setEditingContact(false);
        // Recheck consent after updating contact info
        await checkExistingConsent();
      } else {
      }
    } catch (error) {
    } finally {
      setSavingConsent(false);
    }
  };

  // Updated logic to account for existing consent
  const canGenerate = options.print || 
    (options.email && contactInfo.email && (consentGiven || existingConsent.email)) || 
    (options.sms && contactInfo.phone && (consentGiven || existingConsent.sms));

  const digitalDeliverySelected = options.email || options.sms;
  const needsNewConsent = digitalDeliverySelected && 
    !((options.sms && existingConsent.sms) || (options.email && existingConsent.email));

  const handleGenerate = async () => {
    // Record new consent if needed
    if (needsNewConsent && consentGiven && patient?.id) {
      setSavingConsent(true);
      try {
        const consentType = options.sms && options.email ? 'both' : 
                          (options.sms ? 'sms' : 'email');
        
        await handoutsCommunication.recordPatientConsent(
          patient.id,
          consentType,
          true,
          undefined, // staffId - could be passed from auth context
          undefined, // ipAddress - could be captured
          navigator.userAgent
        );
      } catch (error) {
      } finally {
        setSavingConsent(false);
      }
    }

    // Call the original onGenerate with delivery details
    onGenerate({
      smsEnabled: options.sms && (consentGiven || existingConsent.sms),
      emailEnabled: options.email && (consentGiven || existingConsent.email),
      consentRecorded: !needsNewConsent || consentGiven
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Delivery Options</h3>
        
        {/* Print Option */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
            <Checkbox
              checked={options.print}
              onChange={(e) => handleOptionChange('print', e.target.checked)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <h4 className="font-medium">Print for Patient Pickup</h4>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Print handouts for immediate patient pickup at checkout
              </p>
            </div>
          </div>

          {/* Email Option */}
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
            <Checkbox
              checked={options.email}
              onChange={(e) => handleOptionChange('email', e.target.checked)}
              disabled={!contactInfo.email}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h4 className="font-medium">Email PDF Attachments</h4>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Send handouts as PDF attachments to patient email
              </p>
              {!contactInfo.email && (
                <p className="text-sm text-red-600 mt-1">
                  Email address required
                </p>
              )}
            </div>
          </div>

          {/* SMS Option */}
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
            <Checkbox
              checked={options.sms}
              onChange={(e) => handleOptionChange('sms', e.target.checked)}
              disabled={!contactInfo.phone}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h4 className="font-medium">SMS Download Link</h4>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Send secure download link via text message
              </p>
              {!contactInfo.phone && (
                <p className="text-sm text-red-600 mt-1">
                  Phone number required
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>
          {!editingContact && (
            <Button
              onClick={() => setEditingContact(true)}
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
          )}
        </div>

        {editingContact ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                placeholder="patient@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleContactSave} variant="primary" size="sm">
                Save Changes
              </Button>
              <Button 
                onClick={() => {
                  setEditingContact(false);
                  setContactInfo({
                    email: patient?.email || '',
                    phone: patient?.phone || ''
                  });
                }}
                variant="outline" 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600">
                {contactInfo.email || 'No email address'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm text-gray-600">
                {contactInfo.phone || 'No phone number'}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Digital Delivery Consent */}
      {needsNewConsent && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold mb-4 text-yellow-800">
            Digital Delivery Consent Required
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1"
              />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">
                  Patient consents to digital delivery of medical handouts
                </p>
                <p>
                  I authorize Ganger Dermatology to send my educational handouts 
                  via email and/or SMS. I understand that email and text messages 
                  are not secure forms of communication and there is a risk of 
                  interception. I accept this risk and consent to receive my 
                  handouts digitally.
                </p>
              </div>
            </div>
            
            {!consentGiven && needsNewConsent && (
              <p className="text-sm text-red-600">
                Patient consent is required for digital delivery options
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Existing Consent Notice */}
      {digitalDeliverySelected && !needsNewConsent && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-800 font-medium">
              Patient has previously consented to digital communications
            </p>
          </div>
        </Card>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate || savingConsent}
          variant="primary"
          size="lg"
          className="px-8"
        >
          {savingConsent ? 'Saving...' : 'Generate & Deliver Handouts'}
        </Button>
      </div>
      
      {!canGenerate && (
        <p className="text-sm text-gray-500 text-center">
          Please select at least one delivery method and provide required contact information
        </p>
      )}
    </div>
  );
}