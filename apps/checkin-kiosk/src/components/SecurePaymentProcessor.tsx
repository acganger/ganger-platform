import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button, LoadingSpinner } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import type { CheckInSession } from '@/types/kiosk';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentResult {
  success: boolean;
  status: string;
  error?: { message: string };
}

interface SecurePaymentProcessorProps {
  session: CheckInSession;
  onPaymentComplete: (result: PaymentResult) => void;
  onSkip: () => void;
}

// Inner component that uses Stripe hooks
function PaymentForm({ session, onPaymentComplete, onSkip }: SecurePaymentProcessorProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  
  const processingFee = 2.50;
  const totalAmount = session.copay_amount + processingFee;

  // Create payment intent on mount
  useEffect(() => {
    if (!session.copay_required) return;

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100), // Convert to cents
            description: `Copay for appointment with ${session.provider.first_name} ${session.provider.last_name}`,
            patient_id: session.patient.id,
            appointment_id: session.appointment_id,
            metadata: {
              provider_id: session.provider.id,
              provider_name: `${session.provider.first_name} ${session.provider.last_name}`,
              location_id: session.location_id,
              appointment_date: session.appointment_date,
              copay_amount: session.copay_amount,
              processing_fee: processingFee
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError('Failed to initialize payment. Please try again.');
        console.error('Payment intent error:', err);
      }
    };

    createPaymentIntent();
  }, [session, totalAmount]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Confirm the payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: `${session.patient.first_name} ${session.patient.last_name}`,
            email: session.patient.email,
          },
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onPaymentComplete({
          success: true,
          status: 'completed'
        });
      }
    } catch (err) {
      setError('Payment processing error. Please try again.');
      console.error('Payment error:', err);
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
          Your insurance covers the full cost of today's visit.
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
          <h3 className="font-semibold text-blue-900 mb-2">Today's Visit</h3>
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
            <span>{formatCurrency(totalAmount)}</span>
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

        <form onSubmit={handlePayment} className="space-y-4">
          <h3 className="font-semibold">Enter Payment Information</h3>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>

          <div className="flex gap-4 mt-8">
            <Button
              type="submit"
              disabled={!stripe || loading || !clientSecret}
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
                  Pay {formatCurrency(totalAmount)}
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              disabled={loading}
            >
              Pay at Front Desk
            </Button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Payments are processed securely through Stripe.</p>
          <p>Your payment information is encrypted and never stored on our servers.</p>
        </div>
      </Card>
    </div>
  );
}

// Main component that wraps with Elements provider
export function SecurePaymentProcessor(props: SecurePaymentProcessorProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}