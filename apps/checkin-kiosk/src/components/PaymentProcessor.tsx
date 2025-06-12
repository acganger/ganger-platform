// Payment Processor Component
// Demonstrates immediate business value from Universal Payment Hub

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, LoadingSpinner, Input } from '@ganger/ui';
import { CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { kioskPaymentService } from '@/lib/payment-service';
import { PaymentResult, PaymentMethod } from '@ganger/integrations';
import type { CheckInSession } from '@/types/kiosk';

interface PaymentProcessorProps {
  session: CheckInSession;
  onPaymentComplete: (result: PaymentResult) => void;
  onSkip: () => void;
}

export function PaymentProcessor({ session, onPaymentComplete, onSkip }: PaymentProcessorProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [processingFee, setProcessingFee] = useState(0);
  const [showNewCard, setShowNewCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState<string>('');

  const loadPaymentMethods = useCallback(async () => {
    try {
      const methods = await kioskPaymentService.getPatientPaymentMethods(session.patient.id);
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedPaymentMethod(methods.find(m => m.is_default)?.id || methods[0].id);
      }
    } catch {
      setError('Failed to load payment methods. Please try again.');
    }
  }, [session.patient.id]);

  const calculateProcessingFee = useCallback(() => {
    const fee = kioskPaymentService.calculateProcessingFee(session.copay_amount);
    setProcessingFee(fee);
  }, [session.copay_amount]);

  useEffect(() => {
    loadPaymentMethods();
    calculateProcessingFee();
  }, [loadPaymentMethods, calculateProcessingFee]);

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      let paymentMethodId = selectedPaymentMethod;

      // If using new card, save it first
      if (showNewCard && cardNumber) {
        const newPaymentMethod = await kioskPaymentService.savePaymentMethod(
          session.patient.id,
          {
            card_number: cardNumber,
            exp_month: parseInt(expiryDate.split('/')[0]),
            exp_year: parseInt('20' + expiryDate.split('/')[1]),
            cvv: cvv,
            last_four: cardNumber.slice(-4),
          }
        );

        if (newPaymentMethod) {
          paymentMethodId = newPaymentMethod.id;
        } else {
          throw new Error('Failed to save payment method');
        }
      }

      const result = await kioskPaymentService.processCopayPayment(
        session.patient.id,
        session.appointment.id,
        session.copay_amount,
        `${session.provider.first_name} ${session.provider.last_name}`,
        new Date(session.appointment.appointment_date),
        paymentMethodId
      );

      if (result.success) {
        onPaymentComplete(result);
      } else {
        setError(result.error?.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment processing error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!session.copay_required) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Payment Required</h3>
        <p className="text-gray-600 mb-6">
          Your insurance covers the full cost of today&apos;s visit.
        </p>
        <Button onClick={() => onPaymentComplete({ success: true, status: 'completed' })}>
          Continue Check-in
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-semibold">Payment Required</h2>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Today&apos;s Visit</h3>
          <div className="flex justify-between items-center text-blue-800">
            <span>Copay for {session.provider.first_name} {session.provider.last_name}</span>
            <span className="font-bold">{formatCurrency(session.copay_amount)}</span>
          </div>
          {processingFee > 0 && (
            <div className="flex justify-between items-center text-blue-600 text-sm mt-1">
              <span>Processing fee</span>
              <span>{formatCurrency(processingFee)}</span>
            </div>
          )}
          <hr className="my-2 border-blue-200" />
          <div className="flex justify-between items-center text-blue-900 font-bold">
            <span>Total</span>
            <span>{formatCurrency(session.copay_amount + processingFee)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold">Select Payment Method</h3>
          
          {/* Saved Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={(e) => {
                      setSelectedPaymentMethod(e.target.value);
                      setShowNewCard(false);
                    }}
                    className="text-blue-500"
                  />
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span>
                    {method.brand?.toUpperCase()} ending in {method.last_four}
                    {method.is_default && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* New Card Option */}
          <label
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              showNewCard
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={showNewCard}
              onChange={() => {
                setShowNewCard(true);
                setSelectedPaymentMethod('');
              }}
              className="text-blue-500"
            />
            <CreditCard className="w-5 h-5 text-gray-400" />
            <span>Use a new card</span>
          </label>

          {/* New Card Form */}
          {showNewCard && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <Input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
                  maxLength={16}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <Input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <Input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={handlePayment}
            disabled={loading || (!selectedPaymentMethod && !showNewCard)}
            className="flex-1"
          >
            {loading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay {formatCurrency(session.copay_amount + processingFee)}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={loading}
          >
            Pay at Front Desk
          </Button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Payments are processed securely through Stripe.</p>
          <p>Your payment information is encrypted and protected.</p>
        </div>
      </Card>
    </div>
  );
}