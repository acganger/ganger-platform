import { useQuery } from '@tanstack/react-query';
import { medicationAuthAPI } from '@/lib/api/client';
import type { Medication } from '@/types';
import { useState, useEffect } from 'react';

// Query Keys
export const medicationKeys = {
  all: ['medications'] as const,
  searches: () => [...medicationKeys.all, 'search'] as const,
  search: (query: string) => [...medicationKeys.searches(), query] as const,
  details: () => [...medicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...medicationKeys.details(), id] as const,
};

// Hooks for Medication Management
export function useMedicationSearch(query: string) {
  return useQuery({
    queryKey: medicationKeys.search(query),
    queryFn: () => medicationAuthAPI.searchMedications(query),
    enabled: query.length >= 2, // Only search when query is at least 2 characters
    staleTime: 300000, // 5 minutes - medication data is relatively static
    gcTime: 600000, // 10 minutes
  });
}

export function useMedication(id: string) {
  return useQuery({
    queryKey: medicationKeys.detail(id),
    queryFn: () => medicationAuthAPI.getMedication(id),
    enabled: !!id,
    staleTime: 600000, // 10 minutes - medication details are very static
    gcTime: 1200000, // 20 minutes
  });
}

// Custom hook for debounced medication search
export function useDebouncedMedicationSearch(query: string, delay = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [query, delay]);

  return useMedicationSearch(debouncedQuery);
}