// Mock environment variables for testing
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.ZENEFITS_API_TOKEN = 'test-zenefits-token';
process.env.ZENEFITS_API_BASE_URL = 'https://api.zenefits.com/core';
process.env.GOOGLE_CLIENT_EMAIL = 'test@serviceaccount.com';
process.env.GOOGLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----';
process.env.GOOGLE_CLASSROOM_DOMAIN = 'gangerdermatology.com';
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});