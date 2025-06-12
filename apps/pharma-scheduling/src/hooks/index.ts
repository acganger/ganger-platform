/**
 * Custom React Hooks for Pharmaceutical Scheduling
 * Data fetching, state management, and business logic hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { pharmaAPI } from '@/lib/api';
import type {
  Location,
  TimeSlot,
  BookingRequest,
  BookingResponse,
  Appointment,
  PendingApproval,
  AdminStats,
  CalendarDay,
  CalendarWeek,
  BookingFormData,
  BookingStep
} from '@/types';

// =====================================================
// PUBLIC BOOKING HOOKS
// =====================================================

/**
 * Hook for managing locations data
 */
export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await pharmaAPI.getLocations();
      if (response.success && response.data) {
        setLocations(response.data);
      } else {
        setError(response.error?.message || 'Failed to load locations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations
  };
};

/**
 * Hook for managing availability data
 */
export const useAvailability = (
  location: string,
  participantCount = 1,
  weeksAhead = 12
) => {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!location) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + weeksAhead * 7 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const response = await pharmaAPI.getAvailability(
        location,
        startDate,
        endDate,
        participantCount
      );

      if (response.success && response.data) {
        setAvailability(response.data);
      } else {
        setError(response.error?.message || 'Failed to load availability');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [location, participantCount, weeksAhead]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Group availability by calendar days/weeks
  const calendarData = useMemo(() => {
    if (!availability.length) return { days: [], weeks: [] };

    const daysMap = new Map<string, CalendarDay>();
    
    availability.forEach(slot => {
      const date = slot.date;
      if (!daysMap.has(date)) {
        const dayDate = new Date(date);
        daysMap.set(date, {
          date,
          dayOfWeek: dayDate.toLocaleDateString('en-US', { weekday: 'long' }),
          isToday: date === new Date().toISOString().split('T')[0],
          isAvailable: false,
          slots: [],
          totalSlots: 0,
          availableSlots: 0
        });
      }
      
      const day = daysMap.get(date)!;
      day.slots.push(slot);
      day.totalSlots++;
      if (slot.available) {
        day.availableSlots++;
        day.isAvailable = true;
      }
    });

    const days = Array.from(daysMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group into weeks
    const weeks: CalendarWeek[] = [];
    for (let i = 0; i < days.length; i += 7) {
      const weekDays = days.slice(i, i + 7);
      if (weekDays.length > 0) {
        weeks.push({
          weekOf: weekDays[0].date,
          days: weekDays
        });
      }
    }

    return { days, weeks };
  }, [availability]);

  return {
    availability,
    calendarData,
    loading,
    error,
    refetch: fetchAvailability
  };
};

/**
 * Hook for managing booking submission
 */
export const useBookingSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<BookingResponse | null>(null);

  const submitBooking = useCallback(async (bookingData: BookingRequest) => {
    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const result = await pharmaAPI.submitBooking(bookingData);
      
      if (result.success && result.data) {
        setResponse(result.data);
        return result.data;
      } else {
        const errorMessage = result.error?.message || 'Failed to submit booking';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResponse(null);
  }, []);

  return {
    submitBooking,
    loading,
    error,
    response,
    reset
  };
};

/**
 * Hook for managing booking lookup
 */
export const useBookingLookup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Appointment | null>(null);

  const lookupBooking = useCallback(async (confirmationNumber: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await pharmaAPI.getBookingDetails(confirmationNumber);
      
      if (response.success && response.data) {
        setBooking(response.data);
        return response.data;
      } else {
        const errorMessage = response.error?.message || 'Booking not found';
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (confirmationNumber: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await pharmaAPI.cancelBooking(confirmationNumber, reason);
      
      if (response.success) {
        // Refresh booking data
        await lookupBooking(confirmationNumber);
        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to cancel booking';
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [lookupBooking]);

  const reset = useCallback(() => {
    setBooking(null);
    setError(null);
  }, []);

  return {
    lookupBooking,
    cancelBooking,
    booking,
    loading,
    error,
    reset
  };
};

// =====================================================
// ADMIN HOOKS
// =====================================================

/**
 * Hook for admin dashboard statistics
 */
export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await pharmaAPI.getAdminStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error?.message || 'Failed to load admin stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

/**
 * Hook for managing pending approvals
 */
export const usePendingApprovals = () => {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await pharmaAPI.getPendingApprovals();
      
      if (response.success && response.data) {
        setApprovals(response.data);
      } else {
        setError(response.error?.message || 'Failed to load pending approvals');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveAppointment = useCallback(async (appointmentId: string, notes?: string) => {
    try {
      const response = await pharmaAPI.approveAppointment(appointmentId, notes);
      
      if (response.success) {
        // Refresh approvals list
        await fetchApprovals();
        return true;
      } else {
        setError(response.error?.message || 'Failed to approve appointment');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchApprovals]);

  const rejectAppointment = useCallback(async (appointmentId: string, reason: string) => {
    try {
      const response = await pharmaAPI.rejectAppointment(appointmentId, reason);
      
      if (response.success) {
        // Refresh approvals list
        await fetchApprovals();
        return true;
      } else {
        setError(response.error?.message || 'Failed to reject appointment');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchApprovals]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  return {
    approvals,
    loading,
    error,
    approveAppointment,
    rejectAppointment,
    refetch: fetchApprovals
  };
};

/**
 * Hook for managing appointments list
 */
export const useAppointments = (filters: {
  status?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
} = {}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchAppointments = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await pharmaAPI.getAppointments({
        ...filters,
        page: pageNum,
        limit: 20
      });
      
      if (response.success && response.data) {
        if (pageNum === 1) {
          setAppointments(response.data);
        } else {
          setAppointments(prev => [...prev, ...response.data!]);
        }
        setHasMore(response.pagination.hasMore);
        setPage(pageNum);
      } else {
        setError(response.error?.message || 'Failed to load appointments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchAppointments(page + 1);
    }
  }, [fetchAppointments, loading, hasMore, page]);

  useEffect(() => {
    fetchAppointments(1);
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchAppointments(1)
  };
};

// =====================================================
// FORM AND UI STATE HOOKS
// =====================================================

/**
 * Hook for managing booking form state
 */
export const useBookingForm = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    repEmail: '',
    repFirstName: '',
    repLastName: '',
    repPhone: '',
    companyName: '',
    selectedSlot: null,
    participantCount: 1,
    presentationTopic: '',
    specialRequests: '',
    cateringPreferences: '',
    marketingConsent: false,
    emailConsent: true,
    smsConsent: false,
    phoneConsent: false
  });

  const [currentStep, setCurrentStep] = useState<BookingStep>('location');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = useCallback((updates: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const setStep = useCallback((step: BookingStep) => {
    setCurrentStep(step);
  }, []);

  const validate = useCallback((step: BookingStep) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'form':
        if (!formData.repEmail) newErrors.repEmail = 'Email is required';
        if (!formData.repFirstName) newErrors.repFirstName = 'First name is required';
        if (!formData.repLastName) newErrors.repLastName = 'Last name is required';
        if (!formData.companyName) newErrors.companyName = 'Company name is required';
        if (!formData.selectedSlot) newErrors.selectedSlot = 'Please select a time slot';
        if (!formData.presentationTopic) newErrors.presentationTopic = 'Presentation topic is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      repEmail: '',
      repFirstName: '',
      repLastName: '',
      repPhone: '',
      companyName: '',
      selectedSlot: null,
      participantCount: 1,
      presentationTopic: '',
      specialRequests: '',
      cateringPreferences: '',
      marketingConsent: false,
      emailConsent: true,
      smsConsent: false,
      phoneConsent: false
    });
    setCurrentStep('location');
    setErrors({});
  }, []);

  return {
    formData,
    currentStep,
    errors,
    updateFormData,
    setStep,
    validate,
    reset
  };
};

/**
 * Hook for managing local storage state
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
};