'use client'

import { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Select, 
  LoadingSpinner, 
  ErrorAlert 
} from '@ganger/ui';
import { Search, User, Stethoscope } from 'lucide-react';
import { PatientInfo, ProviderInfo } from '../types';

interface PatientSearchProps {
  onPatientSelect: (patient: PatientInfo | null) => void;
  onProviderSelect: (provider: ProviderInfo | null) => void;
  selectedPatient: PatientInfo | null;
}

export default function PatientSearch({
  onPatientSelect,
  onProviderSelect,
  selectedPatient
}: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientInfo[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load providers on component mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (!response.ok) throw new Error('Failed to load providers');
      const data = await response.json();
      setProviders(data.data || []);
    } catch (err) {
      console.error('Error loading providers:', err);
      setError('Failed to load providers');
    }
  };

  const searchPatients = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (err) {
      console.error('Patient search error:', err);
      setError('Failed to search patients');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Debounce search
    const searchTimeout = setTimeout(() => {
      searchPatients(value);
    }, 300);

    return () => clearTimeout(searchTimeout);
  };

  const handlePatientSelect = (patient: PatientInfo) => {
    onPatientSelect(patient);
    setSearchQuery(patient.name);
    setSearchResults([]);
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProviderId(providerId);
    const provider = providers.find(p => p.id === providerId);
    onProviderSelect(provider || null);
  };

  const clearSelection = () => {
    onPatientSelect(null);
    onProviderSelect(null);
    setSearchQuery('');
    setSelectedProviderId('');
    setSearchResults([]);
  };

  return (
    <div className="space-y-4">
      {error && (
        <ErrorAlert 
          message={error} 
          onDismiss={() => setError(null)} 
        />
      )}

      {/* Patient Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Search Patient
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search by name, DOB, or MRN..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="pl-10"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm">
            {searchResults.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
              >
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-500">
                      DOB: {new Date(patient.dob).toLocaleDateString()} | MRN: {patient.mrn}
                    </div>
                    {patient.insurance && (
                      <div className="text-xs text-blue-600">
                        Insurance: {patient.insurance}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Patient Info */}
      {selectedPatient && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">{selectedPatient.name}</h3>
                <p className="text-sm text-blue-700">
                  DOB: {new Date(selectedPatient.dob).toLocaleDateString()} | 
                  MRN: {selectedPatient.mrn}
                </p>
                {selectedPatient.insurance && (
                  <p className="text-sm text-blue-600">
                    Insurance: {selectedPatient.insurance}
                    {selectedPatient.copay && ` | Copay: $${selectedPatient.copay}`}
                  </p>
                )}
                {selectedPatient.balance && selectedPatient.balance > 0 && (
                  <p className="text-sm text-red-600 font-medium">
                    Outstanding Balance: ${selectedPatient.balance}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Provider
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Stethoscope className="h-5 w-5 text-gray-400" />
          </div>
          <Select
            value={selectedProviderId}
            onChange={handleProviderSelect}
            className="pl-10"
          >
            <option value="">Select a provider...</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name} - {provider.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Mock patient for testing
            const mockPatient: PatientInfo = {
              id: 'test-patient-1',
              name: 'John Smith',
              dob: new Date('1985-06-15'),
              mrn: 'MRN123456',
              insurance: 'Blue Cross Blue Shield',
              copay: 25,
              balance: 150,
              phone: '(555) 123-4567'
            };
            handlePatientSelect(mockPatient);
          }}
        >
          Use Test Patient
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Auto-select Dr. Ganger if available
            const drGanger = providers.find(p => 
              p.name.toLowerCase().includes('ganger') || 
              p.name.toLowerCase().includes('anand')
            );
            if (drGanger) {
              handleProviderSelect(drGanger.id);
            }
          }}
        >
          Select Dr. Ganger
        </Button>
      </div>
    </div>
  );
}