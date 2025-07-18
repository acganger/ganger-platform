// Jest setup for migration tests
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';

// Increase timeout for integration tests
jest.setTimeout(60000);