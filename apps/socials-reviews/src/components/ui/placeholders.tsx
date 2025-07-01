'use client'

import React from 'react';

// Placeholder implementations for missing UI components

export const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange = () => {} 
}: any) => (
  <div className="flex items-center space-x-2">
    <button 
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage <= 1}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Previous
    </button>
    <span>Page {currentPage} of {totalPages}</span>
    <button 
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage >= totalPages}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
);

export const Alert = ({ children, variant = 'info' }: any) => (
  <div className={`p-4 rounded-lg ${variant === 'error' ? 'bg-red-50 text-red-900' : 'bg-blue-50 text-blue-900'}`}>
    {children}
  </div>
);

export const DropdownMenu = ({ children }: any) => (
  <div className="relative">{children}</div>
);

export const Tabs = ({ children, defaultValue }: any) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue || '');
  return (
    <div>
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

export const TabsList = ({ children, activeTab, setActiveTab }: any) => (
  <div className="flex space-x-2 border-b">
    {React.Children.map(children, child => 
      React.cloneElement(child, { activeTab, setActiveTab })
    )}
  </div>
);

export const TabsTrigger = ({ value, children, activeTab, setActiveTab }: any) => (
  <button
    onClick={() => setActiveTab(value)}
    className={`px-4 py-2 ${activeTab === value ? 'border-b-2 border-blue-500' : ''}`}
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children, activeTab }: any) => (
  activeTab === value ? <div className="py-4">{children}</div> : null
);

export const DatePicker = ({ value, onChange }: any) => (
  <input 
    type="date" 
    value={value} 
    onChange={(e) => onChange(e.target.value)}
    className="px-3 py-2 border rounded"
  />
);

export const Tooltip = ({ children }: any) => <>{children}</>;

export const Checkbox = ({ checked, onChange, label }: any) => (
  <label className="flex items-center space-x-2">
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={onChange}
      className="w-4 h-4"
    />
    {label && <span>{label}</span>}
  </label>
);

export const Input = ({ ...props }: any) => (
  <input className="px-3 py-2 border rounded w-full" {...props} />
);

export const TextArea = ({ ...props }: any) => (
  <textarea className="px-3 py-2 border rounded w-full" {...props} />
);

export const Textarea = TextArea; // Alias for compatibility

export const Slider = ({ value = 0, onChange, min = 0, max = 100 }: any) => (
  <input 
    type="range" 
    value={value} 
    onChange={(e) => onChange(Number(e.target.value))}
    min={min}
    max={max}
    className="w-full"
  />
);