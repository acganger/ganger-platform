'use client'

import { useState, useEffect } from 'react';
import { PrinterInfo } from '../types';

export function usePrinter() {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrinters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/printers');
      
      if (!response.ok) {
        throw new Error('Failed to load printers');
      }
      
      const data = await response.json();
      setPrinters(data.data || []);
    } catch (err) {
      console.error('Error loading printers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load printers');
      
      // Fallback to mock data for development
      setPrinters([
        {
          id: 'zebra-front-desk',
          name: 'Front Desk Zebra ZD621',
          model: 'ZD621',
          ip: '192.168.1.100',
          location: 'Front Desk',
          status: 'online',
          lastSeen: new Date().toISOString()
        },
        {
          id: 'zebra-checkout',
          name: 'Checkout Zebra ZD621',
          model: 'ZD621',
          ip: '192.168.1.101',
          location: 'Checkout Station',
          status: 'online',
          lastSeen: new Date().toISOString()
        },
        {
          id: 'zebra-ma-room',
          name: 'MA Room Zebra ZD421',
          model: 'ZD421',
          ip: '192.168.1.102',
          location: 'MA Room 1',
          status: 'offline',
          lastSeen: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrinters = async () => {
    await loadPrinters();
  };

  const getPrinterById = (id: string): PrinterInfo | undefined => {
    return printers.find(printer => printer.id === id);
  };

  const getOnlinePrinters = (): PrinterInfo[] => {
    return printers.filter(printer => printer.status === 'online');
  };

  const getPrintersByLocation = (location: string): PrinterInfo[] => {
    return printers.filter(printer => 
      printer.location.toLowerCase().includes(location.toLowerCase())
    );
  };

  useEffect(() => {
    loadPrinters();
  }, []);

  return {
    printers,
    loading,
    error,
    refreshPrinters,
    getPrinterById,
    getOnlinePrinters,
    getPrintersByLocation
  };
}