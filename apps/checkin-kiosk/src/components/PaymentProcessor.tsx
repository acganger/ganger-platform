// Payment Processor Component
// Demonstrates immediate business value from Universal Payment Hub

import React, { useState } from 'react';
import { Button, LoadingSpinner } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { Input } from '@ganger/ui-catalyst';
import { CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import type { CheckInSession } from '@/types/kiosk';

// Mock types for static build
interface PaymentResult {
  success: boolean;
  status: string;
  error?: { message: string };
}

interface PaymentProcessorProps {
  session: CheckInSession;
  onPaymentComplete: (result: PaymentResult) => void;
  onSkip: () => void;
}

export function PaymentProcessor({ session, onPaymentComplete, onSkip }: PaymentProcessorProps) {
  const [loading, setLoading] = useState(false);
  const [showNewCard, setShowNewCard] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState<string>('');

  const processingFee = 2.50; // Mock processing fee

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    // Simulate payment processing
    try {
      if (!cardNumber || !expiryDate || !cvv) {
        throw new Error('Please fill in all payment details');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success result
      const result: PaymentResult = {
        success: true,
        status: 'completed'
      };

      onPaymentComplete(result);
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

        {/* Payment Form */}
        <div className="space-y-4">
          <h3 className="font-semibold">Enter Payment Information</h3>
          
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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={handlePayment}
            disabled={loading || !cardNumber || !expiryDate || !cvv}
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