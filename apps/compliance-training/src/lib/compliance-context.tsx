'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ComplianceAPIClient } from './api-client';
// Commented out unused imports to pass linting
// import { useErrorHandler } from '@/hooks/useErrorHandler';
// import { useApiRetry } from '@/hooks/useRetry';
// import { commonRecoveryStrategies, withAutoRecovery } from '@/utils/error-recovery';
import type { 
  ComplianceDashboardState, 
  FilterOptions, 
  Employee, 
  TrainingModule, 
  TrainingCompletion 
} from '@/types/compliance';

// Context types
interface ComplianceContextType {
  state: ComplianceDashboardState;
  actions: {
    loadDashboardData: (filters?: FilterOptions) => Promise<void>;
    updateFilters: (filters: FilterOptions) => void;
    triggerSync: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
  };
}

// Action types
type ComplianceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DASHBOARD_DATA'; payload: { employees: Employee[]; trainings: TrainingModule[]; completions: TrainingCompletion[]; lastSync: Date } }
  | { type: 'UPDATE_FILTERS'; payload: FilterOptions }
  | { type: 'UPDATE_COMPLETIONS'; payload: TrainingCompletion[] }
  | { type: 'SET_LAST_SYNC'; payload: Date };

// Initial state
const initialState: ComplianceDashboardState = {
  employees: [],
  trainings: [],
  completions: [],
  filters: {
    status: 'all',
    department: 'all',
    location: 'all',
    timeRange: 'current'
  },
  loading: false,
  error: null,
  lastSync: null
};

// Reducer
function complianceReducer(state: ComplianceDashboardState, action: ComplianceAction): ComplianceDashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_DASHBOARD_DATA':
      return {
        ...state,
        employees: action.payload.employees,
        trainings: action.payload.trainings,
        completions: action.payload.completions,
        lastSync: action.payload.lastSync,
        loading: false,
        error: null
      };
    
    case 'UPDATE_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'UPDATE_COMPLETIONS':
      return { ...state, completions: action.payload };
    
    case 'SET_LAST_SYNC':
      return { ...state, lastSync: action.payload };
    
    default:
      return state;
  }
}

// Context creation
const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

// Provider component
export function ComplianceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(complianceReducer, initialState);

  // Actions
  const loadDashboardData = async (filters?: FilterOptions) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const dashboardData = await ComplianceAPIClient.getDashboardData(filters);
      
      dispatch({
        type: 'SET_DASHBOARD_DATA',
        payload: {
          employees: dashboardData.matrix.employees,
          trainings: dashboardData.matrix.trainings,
          completions: Object.values(dashboardData.matrix.completions),
          lastSync: dashboardData.lastSync
        }
      });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load dashboard data' 
      });
    }
  };

  const updateFilters = (filters: FilterOptions) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
    // Automatically reload data with new filters
    loadDashboardData(filters);
  };

  const triggerSync = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const syncResponse = await ComplianceAPIClient.triggerSync();
      
      if (syncResponse.success) {
        dispatch({ type: 'SET_LAST_SYNC', payload: syncResponse.lastSync });
        // Reload data after successful sync
        await loadDashboardData(state.filters);
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to sync data' 
      });
    }
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Load initial data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const contextValue: ComplianceContextType = {
    state,
    actions: {
      loadDashboardData,
      updateFilters,
      triggerSync,
      setLoading,
      setError,
      clearError
    }
  };

  return (
    <ComplianceContext.Provider value={contextValue}>
      {children}
    </ComplianceContext.Provider>
  );
}

// Hook to use compliance context
export function useCompliance(): ComplianceContextType {
  const context = useContext(ComplianceContext);
  
  if (context === undefined) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  
  return context;
}