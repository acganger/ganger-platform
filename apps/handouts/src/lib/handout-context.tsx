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
      
      // Fallback to mock data if template loading fails
      const mockTemplates: HandoutTemplate[] = [
        {
          id: 'acne-handout-kf',
          name: 'Acne Treatment Plan',
          category: 'treatment',
          description: 'Comprehensive acne treatment with medication options',
          complexity: 'complex',
          estimatedTime: 5,
          digitalDeliveryEnabled: true
        },
        {
          id: 'sun-protection',
          name: 'Sun Protection Guidelines',
          category: 'education',
          description: 'UV protection and skin cancer prevention',
          complexity: 'simple',
          estimatedTime: 1,
          digitalDeliveryEnabled: true
        },
        {
          id: 'patch-testing',
          name: 'Patch Testing Instructions',
          category: 'pre_procedure',
          description: 'Pre-procedure preparation for allergy testing',
          complexity: 'simple',
          estimatedTime: 2,
          digitalDeliveryEnabled: true
        }
      ];
      
      dispatch({ type: 'SET_TEMPLATES', payload: mockTemplates });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadRecentHandouts = async () => {
    try {
      const mockHandouts: GeneratedHandout[] = [
        {
          id: '1',
          patientMRN: 'MRN001',
          templateIds: ['acne-handout-kf'],
          generatedAt: new Date().toISOString(),
          deliveryMethods: ['print', 'email'],
          status: 'completed',
          pdfUrl: '/generated/handout1.pdf',
          deliveryStatus: {
            print: true,
            email: 'delivered'
          }
        }
      ];
      
      dispatch({ type: 'SET_RECENT_HANDOUTS', payload: mockHandouts });
    } catch (error) {
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