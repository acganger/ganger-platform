import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationAuthAPI } from '@/lib/api/client';
import type { 
  Authorization, 
  AuthorizationFilters, 
  AIRecommendation,
  ProcessingStatus 
} from '@/types';

// Query Keys
export const authorizationKeys = {
  all: ['authorizations'] as const,
  lists: () => [...authorizationKeys.all, 'list'] as const,
  list: (filters: AuthorizationFilters) => [...authorizationKeys.lists(), filters] as const,
  details: () => [...authorizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...authorizationKeys.details(), id] as const,
  status: (id: string) => [...authorizationKeys.detail(id), 'status'] as const,
  ai: (id: string) => [...authorizationKeys.detail(id), 'ai'] as const,
};

// Hooks for Authorization Management
export function useAuthorizations(
  filters: AuthorizationFilters = {},
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: authorizationKeys.list(filters),
    queryFn: () => medicationAuthAPI.getAuthorizations(filters, page, limit),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

export function useAuthorization(id: string) {
  return useQuery({
    queryKey: authorizationKeys.detail(id),
    queryFn: () => medicationAuthAPI.getAuthorization(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

export function useProcessingStatus(authorizationId: string) {
  return useQuery({
    queryKey: authorizationKeys.status(authorizationId),
    queryFn: () => medicationAuthAPI.getProcessingStatus(authorizationId),
    enabled: !!authorizationId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // 10 seconds
  });
}

export function useAIRecommendations(authorizationId: string) {
  return useQuery({
    queryKey: authorizationKeys.ai(authorizationId),
    queryFn: () => medicationAuthAPI.getAIRecommendations(authorizationId),
    enabled: !!authorizationId,
    staleTime: 30000,
  });
}

// Mutations for Authorization Actions
export function useCreateAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Authorization>) => 
      medicationAuthAPI.createAuthorization(data),
    onSuccess: () => {
      // Invalidate all authorization lists
      queryClient.invalidateQueries({ queryKey: authorizationKeys.lists() });
    },
  });
}

export function useUpdateAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Authorization> }) =>
      medicationAuthAPI.updateAuthorization(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific authorization and lists
      queryClient.invalidateQueries({ queryKey: authorizationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: authorizationKeys.lists() });
    },
  });
}

export function useDeleteAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => medicationAuthAPI.deleteAuthorization(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: authorizationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: authorizationKeys.lists() });
    },
  });
}

export function useRequestAISuggestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: medicationAuthAPI.requestAISuggestions,
    onSuccess: (_, variables) => {
      // Invalidate AI recommendations for this authorization
      queryClient.invalidateQueries({ 
        queryKey: authorizationKeys.ai(variables.authorization_id) 
      });
    },
  });
}

export function useApplyAIRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recommendationId: string) =>
      medicationAuthAPI.applyAIRecommendation(recommendationId),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: authorizationKeys.all });
    },
  });
}

export function useUpdateProcessingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      authorizationId, 
      status 
    }: { 
      authorizationId: string; 
      status: Partial<ProcessingStatus> 
    }) =>
      medicationAuthAPI.updateProcessingStatus(authorizationId, status),
    onSuccess: (_, { authorizationId }) => {
      // Invalidate status and authorization detail
      queryClient.invalidateQueries({ 
        queryKey: authorizationKeys.status(authorizationId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: authorizationKeys.detail(authorizationId) 
      });
    },
  });
}