import { useQuery } from '@tanstack/react-query';
import { medicationAuthAPI } from '@/lib/api/client';
import type { Patient } from '@/types';

// Query Keys
export const patientKeys = {
  all: ['patients'] as const,
  searches: () => [...patientKeys.all, 'search'] as const,
  search: (query: string) => [...patientKeys.searches(), query] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
};

// Hooks for Patient Management
export function usePatientSearch(query: string) {
  return useQuery({
    queryKey: patientKeys.search(query),
    queryFn: () => medicationAuthAPI.searchPatients(query),
    enabled: query.length >= 2, // Only search when query is at least 2 characters
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => medicationAuthAPI.getPatient(id),
    enabled: !!id,
    staleTime: 300000, // 5 minutes - patient data doesn't change frequently
    gcTime: 600000, // 10 minutes
  });
}

// Custom hook for debounced patient search
import { useState, useEffect } from 'react';

export function useDebouncedPatientSearch(query: string, delay = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [query, delay]);

  return usePatientSearch(debouncedQuery);
}