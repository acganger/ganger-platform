import React, { useState, useEffect } from 'react';
import { Button, LoadingSpinner } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { Input } from '@ganger/ui-catalyst';
import { Search, Pill, Info } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  ndcNumber: string;
  therapeuticClass: string;
  indication: string;
  isFormulary: boolean;
  requiresPA: boolean;
}

interface MedicationSelectorProps {
  onMedicationSelect: (medication: Medication) => void;
  selectedMedication?: Medication;
}

export function MedicationSelector({ onMedicationSelect, selectedMedication }: MedicationSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Search for medications when search term changes
  const searchMedications = async (term: string) => {
    if (!term || term.length < 2) {
      setFilteredMedications([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/medications/search?search=${encodeURIComponent(term)}`);
      if (!response.ok) {
        throw new Error('Failed to search medications');
      }
      
      const data = await response.json();
      setMedications(data.medications || []);
      setFilteredMedications(data.medications || []);
    } catch (error) {
      console.error('Error searching medications:', error);
      setFilteredMedications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      if (searchTerm.length > 1) {
        searchMedications(searchTerm);
        setShowSuggestions(true);
      } else {
        setFilteredMedications([]);
        setShowSuggestions(false);
      }
    }, 300);

    setSearchDebounceTimer(timer);

    // Cleanup
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleMedicationSelect = (medication: Medication) => {
    setSearchTerm(medication.name);
    setShowSuggestions(false);
    onMedicationSelect(medication);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Pill className="w-6 h-6 text-blue-500" />
        <h3 className="text-xl font-semibold">Select Medication</h3>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by medication name, generic name, or indication..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Suggestions */}
          {showSuggestions && filteredMedications.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {filteredMedications.map((medication) => (
                <button
                  key={medication.id}
                  onClick={() => handleMedicationSelect(medication)}
                  className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{medication.name}</p>
                      <p className="text-sm text-gray-600">
                        {medication.genericName} • {medication.strength} • {medication.dosageForm}
                      </p>
                      <p className="text-xs text-gray-500">{medication.indication}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {medication.requiresPA && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Requires PA
                        </span>
                      )}
                      {medication.isFormulary ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Formulary
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Non-Formulary
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Medication Display */}
        {selectedMedication && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">{selectedMedication.name}</h4>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <p><span className="font-medium">Generic:</span> {selectedMedication.genericName}</p>
                    <p><span className="font-medium">Strength:</span> {selectedMedication.strength}</p>
                    <p><span className="font-medium">Form:</span> {selectedMedication.dosageForm}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Manufacturer:</span> {selectedMedication.manufacturer}</p>
                    <p><span className="font-medium">NDC:</span> {selectedMedication.ndcNumber}</p>
                    <p><span className="font-medium">Class:</span> {selectedMedication.therapeuticClass}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {selectedMedication.isFormulary ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Formulary Medication
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Non-Formulary
                    </span>
                  )}
                  {selectedMedication.requiresPA && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Prior Authorization Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {searchTerm && filteredMedications.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No medications found for "{searchTerm}"</p>
            <p className="text-sm">Try searching by brand name, generic name, or indication</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <LoadingSpinner className="w-8 h-8 mx-auto mb-3" />
            <p className="text-gray-500">Searching medications...</p>
          </div>
        )}
      </div>
    </Card>
  );
}