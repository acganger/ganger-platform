/**
 * Mock data generators for testing
 */

export const mockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@gangerdermatology.com',
  name: 'Test User',
  role: 'staff',
  department: 'clinical',
  locations: ['main'],
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const mockPatient = (overrides = {}) => ({
  id: 'patient-123',
  mrn: 'MRN123456',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '(555) 123-4567',
  dateOfBirth: '1980-01-01',
  ...overrides
});

export const mockTicket = (overrides = {}) => ({
  id: 'ticket-123',
  title: 'Test Ticket',
  description: 'This is a test ticket description',
  status: 'open',
  priority: 'medium',
  form_type: 'support_ticket',
  submitter: mockUser(),
  assigned_to: null,
  location: 'Main Office',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  comments: [],
  attachments: [],
  ...overrides
});

export const mockIntegration = (overrides = {}) => ({
  id: 'integration-123',
  name: 'test-integration',
  display_name: 'Test Integration',
  description: 'Test integration for testing',
  service_type: 'api',
  health_status: 'healthy',
  base_url: 'https://api.test.com',
  auth_type: 'bearer_token',
  environment: 'test',
  is_active: true,
  last_health_check: new Date().toISOString(),
  last_successful_check: new Date().toISOString(),
  next_health_check: new Date(Date.now() + 300000).toISOString(),
  health_check_interval: 300,
  config: {
    timeout: 5000,
    retry_attempts: 3,
    monitoring_enabled: true
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'test@gangerdermatology.com',
  ...overrides
});

export const mockStaffMember = (overrides = {}) => ({
  id: 'staff-123',
  name: 'Jane Smith',
  role: 'medical_assistant',
  email: 'jane.smith@gangerdermatology.com',
  phone: '(555) 987-6543',
  locations: ['main', 'satellite'],
  availability_start_time: '08:00',
  availability_end_time: '17:00',
  skills: ['phlebotomy', 'injections', 'EKG'],
  certifications: ['CMA', 'CPR'],
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});