import React, { createContext, useContext, useEffect, useRef } from 'react';
import { EnhancedCommunicationHub } from '../communication/enhanced-communication-hub';
import { CommunicationConfig } from '../communication/types';

interface CommunicationContextType {
  communicationHub: EnhancedCommunicationHub | null;
}

const CommunicationContext = createContext<CommunicationContextType>({
  communicationHub: null,
});

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};

interface CommunicationProviderProps {
  children: React.ReactNode;
  config?: Partial<CommunicationConfig>;
}

export const CommunicationProvider: React.FC<CommunicationProviderProps> = ({
  children,
  config = {},
}) => {
  const hubRef = useRef<EnhancedCommunicationHub | null>(null);

  useEffect(() => {
    // Initialize the communication hub
    const defaultConfig: CommunicationConfig = {
      twilio_account_sid: process.env.TWILIO_ACCOUNT_SID || '',
      twilio_auth_token: process.env.TWILIO_AUTH_TOKEN || '',
      twilio_api_key: process.env.TWILIO_API_KEY || '',
      twilio_api_secret: process.env.TWILIO_API_SECRET || '',
      twilio_phone_number: process.env.TWILIO_PHONE_NUMBER || '',
      encryption_key: process.env.ENCRYPTION_KEY || 'default-key',
      audit_retention_days: 90,
      ...config,
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseKey) {
      hubRef.current = new EnhancedCommunicationHub(
        defaultConfig,
        supabaseUrl,
        supabaseKey,
        true // MCP enabled
      );
    }

    return () => {
      // Cleanup subscriptions when component unmounts
      // Note: Enhanced hubs handle cleanup internally
    };
  }, [config]);

  const contextValue = {
    communicationHub: hubRef.current,
  };

  return (
    <CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>
  );
};