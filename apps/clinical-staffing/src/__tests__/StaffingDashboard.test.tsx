import { render, screen, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import StaffingDashboard from '@/components/layout/StaffingDashboard'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getLocations: jest.fn(() => Promise.resolve({
      success: true,
      data: [
        { id: '1', name: 'Main Office', address: '123 Main St', phone: '555-0001', timezone: 'EST', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' }
      ]
    })),
    getStaffMembers: jest.fn(() => Promise.resolve({
      success: true,
      data: [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'medical_assistant', certifications: [], availability_start_time: '08:00', availability_end_time: '17:00', location_preferences: [], skills: [], unavailable_dates: [], is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' }
      ]
    })),
    getProviders: jest.fn(() => Promise.resolve({
      success: true,
      data: [
        { id: '1', name: 'Dr. Smith', title: 'MD', specialty: 'Dermatology', location_id: '1', start_time: '09:00', end_time: '17:00', days_of_week: [1,2,3,4,5], requires_staff_count: 2, preferred_staff_roles: ['medical_assistant'], is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' }
      ]
    })),
    getSchedules: jest.fn(() => Promise.resolve({
      success: true,
      data: []
    }))
  }
}))

// Mock the realtime hook
jest.mock('@/hooks/useRealtimeStaffing', () => ({
  useRealtimeStaffing: jest.fn(() => ({
    schedules: [],
    setSchedules: jest.fn(),
    isConnected: true,
    connectionError: undefined,
    lastUpdate: undefined,
    reconnect: jest.fn(),
  }))
}))

describe('StaffingDashboard', () => {
  beforeEach(() => {
    // Mock authenticated user
    const mockUseAuth = require('@ganger/auth').useAuth
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      isLoading: false,
      error: null,
    })
  })

  it('renders the dashboard with header', async () => {
    render(<StaffingDashboard />)
    
    expect(screen.getByTestId('page-header')).toBeInTheDocument()
    expect(screen.getByText('Clinical Staffing')).toBeInTheDocument()
    expect(screen.getByText('Optimize support staff assignments across locations')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<StaffingDashboard />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders schedule builder and sidebar after loading', async () => {
    render(<StaffingDashboard />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Check that main content is rendered
    expect(screen.getByText('Available Staff')).toBeInTheDocument()
    expect(screen.getByText('Provider Schedules')).toBeInTheDocument()
  })

  it('shows login prompt when user is not authenticated', () => {
    // Mock unauthenticated state
    const mockUseAuth = require('@ganger/auth').useAuth
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    })

    render(<StaffingDashboard />)
    
    expect(screen.getByText('Please sign in to access Clinical Staffing')).toBeInTheDocument()
  })

  it('shows connection warning when real-time is disconnected', () => {
    // Mock disconnected state
    const mockUseRealtimeStaffing = require('@/hooks/useRealtimeStaffing').useRealtimeStaffing
    mockUseRealtimeStaffing.mockReturnValue({
      schedules: [],
      setSchedules: jest.fn(),
      isConnected: false,
      connectionError: undefined,
      lastUpdate: undefined,
      reconnect: jest.fn(),
    })

    render(<StaffingDashboard />)
    
    expect(screen.getByText(/Real-time updates disconnected/)).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    const mockApiClient = require('@/lib/api-client').apiClient
    mockApiClient.getLocations.mockRejectedValue(new Error('API Error'))

    render(<StaffingDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/Error: API Error/)).toBeInTheDocument()
    })
  })
})