import { NextApiRequest, NextApiResponse } from 'next';
import { MedicalPaymentService } from '@ganger/integrations';
import { getSupabaseClient } from '@ganger/auth';
import { z } from 'zod';

// Input validation schema
const PaymentIntentSchema = z.object({
  amount: z.number().positive(),
  description: z.string(),
  patient_id: z.string(),
  appointment_id: z.string(),
  metadata: z.object({
    provider_id: z.string(),
    provider_name: z.string(),
    location_id: z.string(),
    appointment_date: z.string(),
    copay_amount: z.number(),
    processing_fee: z.number()
  })
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate input
    const validatedData = PaymentIntentSchema.parse(req.body);

    // Initialize payment service
    const paymentService = new MedicalPaymentService({
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
    });

    // Create payment intent via secure server-side processing
    const paymentResult = await paymentService.processPayment({
      patient_id: validatedData.patient_id,
      amount: validatedData.amount,
      payment_type: 'copay',
      description: validatedData.description,
      payment_method_id: 'card',
      metadata: {
        provider_id: validatedData.metadata.provider_id,
        provider_name: validatedData.metadata.provider_name,
        location_id: validatedData.metadata.location_id,
        appointment_date: validatedData.metadata.appointment_date,
        copay_amount: validatedData.metadata.copay_amount.toString(),
        processing_fee: validatedData.metadata.processing_fee.toString()
      }
    });

    // Return only the client secret, not sensitive payment details
    return res.status(200).json({
      clientSecret: paymentResult.client_secret,
      paymentIntentId: paymentResult.stripe_payment_intent_id || paymentResult.payment_id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }

    return res.status(500).json({ 
      error: 'Failed to create payment intent' 
    });
  }
}