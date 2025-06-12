import React, { createContext, useContext, useEffect, useRef } from 'react';
import { EnhancedPaymentHub } from '../payments/enhanced-payment-hub';

interface PaymentContextType {
  paymentHub: EnhancedPaymentHub | null;
}

const PaymentContext = createContext<PaymentContextType>({
  paymentHub: null,
});

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

interface PaymentProviderProps {
  children: React.ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({
  children,
}) => {
  const hubRef = useRef<EnhancedPaymentHub | null>(null);

  useEffect(() => {
    // Initialize the payment hub
    hubRef.current = new EnhancedPaymentHub(true); // MCP enabled

    return () => {
      // Cleanup subscriptions when component unmounts
      // Note: Enhanced hubs handle cleanup internally
    };
  }, []);

  const contextValue = {
    paymentHub: hubRef.current,
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
};