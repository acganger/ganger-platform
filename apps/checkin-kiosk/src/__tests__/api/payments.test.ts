import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/create-payment-intent';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe');

describe('/api/create-payment-intent', () => {
  let mockStripe: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Stripe mock
    mockStripe = {
      paymentIntents: {
        create: jest.fn()
      }
    };
    
    (Stripe as unknown as jest.Mock).mockImplementation(() => mockStripe);
  });

  describe('POST /api/create-payment-intent', () => {
    it('should create a payment intent for valid session', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_test',
        amount: 15000,
        currency: 'usd'
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: {
          sessionId: 'sess_123',
          amount: 15000,
          patientEmail: 'patient@example.com',
          patientName: 'John Doe'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        clientSecret: 'pi_test123_secret_test'
      });
      
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 15000,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          sessionId: 'sess_123',
          patientEmail: 'patient@example.com',
          patientName: 'John Doe',
          source: 'checkin-kiosk'
        }
      });
    });

    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required sessionId
          amount: 15000
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('should validate amount is positive', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          sessionId: 'sess_123',
          amount: -100
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid amount'
      });
    });

    it('should handle Stripe errors gracefully', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Card declined')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          sessionId: 'sess_123',
          amount: 15000,
          patientEmail: 'patient@example.com'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Payment processing failed'
      });
    });

    it('should reject non-POST requests', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed'
      });
    });

    it('should handle missing Stripe key gracefully', async () => {
      // Mock missing env variable
      const originalEnv = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          sessionId: 'sess_123',
          amount: 15000
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Payment system not configured'
      });

      // Restore env
      process.env.STRIPE_SECRET_KEY = originalEnv;
    });
  });

  describe('Security', () => {
    it('should not expose sensitive error details', async () => {
      const sensitiveError = new Error('Invalid API Key: sk_test_12345');
      mockStripe.paymentIntents.create.mockRejectedValue(sensitiveError);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          sessionId: 'sess_123',
          amount: 15000
        }
      });

      await handler(req, res);

      const response = JSON.parse(res._getData());
      expect(response.error).not.toContain('sk_test');
      expect(response.error).toBe('Payment processing failed');
    });

    it('should include security headers', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test',
        client_secret: 'secret'
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          sessionId: 'sess_123',
          amount: 15000
        }
      });

      await handler(req, res);

      expect(res._getHeaders()).toMatchObject({
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY'
      });
    });
  });
});