import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface HandoutTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: number;
  digitalDeliveryEnabled: boolean;
}

interface GeneratedHandout {
  id: string;
  patientMRN: string;
  templateIds: string[];
  generatedAt: string;
  deliveryMethods: string[];
  status: 'generating' | 'completed' | 'failed';
  pdfUrl?: string;
  deliveryStatus: {
    print: boolean;
    email?: 'pending' | 'sent' | 'delivered' | 'failed';
    sms?: 'pending' | 'sent' | 'delivered' | 'failed';
  };
}

interface HandoutState {
  templates: HandoutTemplate[];
  recentHandouts: GeneratedHandout[];
  currentGeneration: GeneratedHandout | null;
  isLoading: boolean;
}

type HandoutAction =
  | { type: 'SET_TEMPLATES'; payload: HandoutTemplate[] }
  | { type: 'SET_RECENT_HANDOUTS'; payload: GeneratedHandout[] }
  | { type: 'START_GENERATION'; payload: GeneratedHandout }
  | { type: 'COMPLETE_GENERATION'; payload: { id: string; pdfUrl: string } }
  | { type: 'FAIL_GENERATION'; payload: { id: string; error: string } }
  | { type: 'UPDATE_DELIVERY_STATUS'; payload: { id: string; method: string; status: string } }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: HandoutState = {
  templates: [],
  recentHandouts: [],
  currentGeneration: null,
  isLoading: false
};

function handoutReducer(state: HandoutState, action: HandoutAction): HandoutState {
  switch (action.type) {
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    
    case 'SET_RECENT_HANDOUTS':
      return { ...state, recentHandouts: action.payload };
    
    case 'START_GENERATION':
      return { 
        ...state, 
        currentGeneration: action.payload,
        isLoading: true 
      };
    
    case 'COMPLETE_GENERATION':
      return {
        ...state,
        currentGeneration: state.currentGeneration ? {
          ...state.currentGeneration,
          status: 'completed',
          pdfUrl: action.payload.pdfUrl
        } : null,
        isLoading: false,
        recentHandouts: state.currentGeneration ? 
          [{ ...state.currentGeneration, status: 'completed', pdfUrl: action.payload.pdfUrl }, ...state.recentHandouts.slice(0, 9)] : 
          state.recentHandouts
      };
    
    case 'FAIL_GENERATION':
      return {
        ...state,
        currentGeneration: state.currentGeneration ? {
          ...state.currentGeneration,
          status: 'failed'
        } : null,
        isLoading: false
      };
    
    case 'UPDATE_DELIVERY_STATUS':
      return {
        ...state,
        recentHandouts: state.recentHandouts.map(handout =>
          handout.id === action.payload.id
            ? {
                ...handout,
                deliveryStatus: {
                  ...handout.deliveryStatus,
                  [action.payload.method]: action.payload.status
                }
              }
            : handout
        )
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    default:
      return state;
  }
}

interface HandoutContextType {
  state: HandoutState;
  dispatch: React.Dispatch<HandoutAction>;
  loadTemplates: () => Promise<void>;
  loadRecentHandouts: () => Promise<void>;
}

const HandoutContext = createContext<HandoutContextType | undefined>(undefined);

export function HandoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(handoutReducer, initialState);

  const loadTemplates = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load templates using the TemplateLoader
      const { TemplateLoader } = await import('./template-loader');
      const dbTemplates = await TemplateLoader.loadAllTemplates();
      
      // Convert to the format expected by the context
      const templates: HandoutTemplate[] = dbTemplates.map(template => ({
        id: template.id,
        name: template.template_name,
        category: template.category,
        description: template.description || '',
        complexity: template.complexity_level === 3 ? 'complex' : 
                   template.complexity_level === 2 ? 'moderate' : 'simple',
        estimatedTime: template.estimated_completion_time,
        digitalDeliveryEnabled: template.digital_delivery_enabled
      }));
      
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (error) {
      console.error('Error loading templates:', error);
      // Set empty array on error to avoid showing stale data
      dispatch({ type: 'SET_TEMPLATES', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadRecentHandouts = async () => {
    try {
      // Fetch recent handouts from API
      const params = new URLSearchParams({ dateRange: '7d' });
      const response = await fetch(`/api/handouts/history?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent handouts');
      }
      
      const { data } = await response.json();
      
      // Transform API data to match GeneratedHandout interface
      const handouts: GeneratedHandout[] = (data || []).map((handout: any) => ({
        id: handout.id,
        patientMRN: handout.patientMRN,
        templateIds: handout.templates,
        generatedAt: handout.generatedAt,
        deliveryMethods: handout.deliveryMethods,
        status: handout.status,
        pdfUrl: handout.pdfUrl || undefined,
        deliveryStatus: {
          print: handout.deliveryMethods.includes('print'),
          email: handout.emailStatus,
          sms: handout.smsStatus
        }
      }));
      
      dispatch({ type: 'SET_RECENT_HANDOUTS', payload: handouts });
    } catch (error) {
      console.error('Error loading recent handouts:', error);
      // Set empty array on error
      dispatch({ type: 'SET_RECENT_HANDOUTS', payload: [] });
    }
  };

  return (
    <HandoutContext.Provider value={{
      state,
      dispatch,
      loadTemplates,
      loadRecentHandouts
    }}>
      {children}
    </HandoutContext.Provider>
  );
}

export function useHandoutContext() {
  const context = useContext(HandoutContext);
  if (context === undefined) {
    throw new Error('useHandoutContext must be used within a HandoutProvider');
  }
  return context;
}