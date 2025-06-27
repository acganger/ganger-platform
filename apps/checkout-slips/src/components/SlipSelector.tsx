'use client'

import { useState } from 'react';
import { 
  Select, 
  LoadingSpinner, 
  Badge 
} from '@ganger/ui';
import { Printer, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { SlipType, PrinterInfo } from '../types';

interface SlipSelectorProps {
  slipType: SlipType;
  onSlipTypeChange: (type: SlipType) => void;
  selectedPrinter: string;
  onPrinterChange: (printerId: string) => void;
  printers: PrinterInfo[];
  loading: boolean;
}

const SLIP_TYPES = [
  {
    value: 'medical' as SlipType,
    label: 'Medical Checkout',
    description: 'Standard medical visit checkout slip with follow-up instructions',
    icon: '🏥'
  },
  {
    value: 'cosmetic' as SlipType,
    label: 'Cosmetic Treatment',
    description: 'Cosmetic procedure slip with treatment details and product tracking',
    icon: '💉'
  },
  {
    value: 'self_pay' as SlipType,
    label: 'Self-Pay Pricing',
    description: 'Self-pay addendum with procedure pricing and payment information',
    icon: '💳'
  }
];

export default function SlipSelector({
  slipType,
  onSlipTypeChange,
  selectedPrinter,
  onPrinterChange,
  printers,
  loading
}: SlipSelectorProps) {
  const [refreshingPrinters, setRefreshingPrinters] = useState(false);

  const handleRefreshPrinters = async () => {
    setRefreshingPrinters(true);
    try {
      // Trigger printer status refresh
      await fetch('/api/printers/refresh', { method: 'POST' });
      // The parent component should reload printers
    } catch (error) {
      console.error('Failed to refresh printers:', error);
    } finally {
      setRefreshingPrinters(false);
    }
  };

  const getPrinterStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Printer className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPrinterStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="success">Online</Badge>;
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Slip Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Slip Type
        </label>
        
        <div className="grid grid-cols-1 gap-3">
          {SLIP_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => onSlipTypeChange(type.value)}
              className={`
                relative p-4 border-2 rounded-lg text-left transition-all
                ${slipType === type.value 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
                {slipType === type.value && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Printer Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Printer Selection
          </label>
          <button
            onClick={handleRefreshPrinters}
            disabled={refreshingPrinters}
            className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
          >
            {refreshingPrinters ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Refresh'
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : printers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Printer className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No printers configured</p>
          </div>
        ) : (
          <div className="space-y-2">
            {printers.map((printer) => (
              <button
                key={printer.id}
                onClick={() => onPrinterChange(printer.id)}
                className={`
                  w-full p-3 border rounded-lg text-left transition-all
                  ${selectedPrinter === printer.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${printer.status === 'offline' ? 'opacity-60' : ''}
                `}
                disabled={printer.status === 'error'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getPrinterStatusIcon(printer.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{printer.name}</h4>
                      <p className="text-sm text-gray-600">
                        {printer.location} | {printer.model} | {printer.ip}
                      </p>
                      {printer.lastSeen && (
                        <p className="text-xs text-gray-500">
                          Last seen: {new Date(printer.lastSeen).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPrinterStatusBadge(printer.status)}
                    {selectedPrinter === printer.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selection Summary */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Selection Summary</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Slip Type:</span>
            <span className="font-medium">
              {SLIP_TYPES.find(t => t.value === slipType)?.label || 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Printer:</span>
            <span className="font-medium">
              {selectedPrinter ? (
                printers.find(p => p.id === selectedPrinter)?.name || 'Unknown'
              ) : (
                'None selected'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Printer Status Legend */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium">Printer Status:</p>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Wifi className="h-3 w-3 text-green-500" />
            <span>Online</span>
          </div>
          <div className="flex items-center space-x-1">
            <WifiOff className="h-3 w-3 text-gray-400" />
            <span>Offline</span>
          </div>
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>Error</span>
          </div>
        </div>
      </div>
    </div>
  );
}