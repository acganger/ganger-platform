import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UserIcon, CalendarIcon, PhoneIcon } from '@/components/icons';
import { useDebouncedPatientSearch } from '@/hooks/usePatients';
import { format } from 'date-fns';
import type { Patient } from '@/types';

interface PatientSelectorProps {
  data: { patient: Patient | null };
  onDataChange: (stepId: string, data: Patient | null) => void;
}

export function PatientSelector({ data, onDataChange }: PatientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(data.patient);
  const [showResults, setShowResults] = useState(false);

  const { data: searchResults, isLoading, error } = useDebouncedPatientSearch(searchQuery);

  useEffect(() => {
    onDataChange('patient', selectedPatient);
  }, [selectedPatient, onDataChange]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery(`${patient.first_name} ${patient.last_name}`);
    setShowResults(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(value.length >= 2);
    
    // Clear selected patient if search query changes significantly
    if (selectedPatient && !value.toLowerCase().includes(selectedPatient.last_name.toLowerCase())) {
      setSelectedPatient(null);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatInsuranceInfo = (patient: Patient) => {
    return `${patient.insurance_id}${patient.insurance_group ? ` (Group: ${patient.insurance_group})` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search for Patient
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, ID, or phone number..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowResults(searchQuery.length >= 2)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Searching patients...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-600">
                Error searching patients. Please try again.
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        DOB: {format(new Date(patient.date_of_birth), 'MMM d, yyyy')} 
                        ({calculateAge(patient.date_of_birth)} years old)
                      </div>
                      <div className="text-sm text-gray-500">
                        Insurance: {formatInsuranceInfo(patient)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {patient.id}
                    </div>
                  </div>
                </button>
              ))
            ) : searchQuery.length >= 2 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No patients found matching "{searchQuery}"
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Selected Patient Details */}
      {selectedPatient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h3>
                <p className="text-sm text-gray-500">Patient ID: {selectedPatient.id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPatient(null);
                setSearchQuery('');
                setShowResults(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Change Patient
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">DOB:</span>
                  <span className="ml-2 text-gray-900">
                    {format(new Date(selectedPatient.date_of_birth), 'MMM d, yyyy')} 
                    ({calculateAge(selectedPatient.date_of_birth)} years)
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2 text-gray-900">{selectedPatient.phone}</span>
                </div>
                {selectedPatient.email && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 text-gray-900">{selectedPatient.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Insurance Information</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Insurance ID:</span>
                  <span className="ml-2 text-gray-900">{selectedPatient.insurance_id}</span>
                </div>
                {selectedPatient.insurance_group && (
                  <div className="text-sm">
                    <span className="text-gray-600">Group:</span>
                    <span className="ml-2 text-gray-900">{selectedPatient.insurance_group}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Address</h4>
              <div className="text-sm text-gray-900">
                {selectedPatient.address.street}<br />
                {selectedPatient.address.city}, {selectedPatient.address.state} {selectedPatient.address.zip}
              </div>
            </div>

            {/* Medical History & Allergies */}
            {(selectedPatient.medical_history?.length || selectedPatient.allergies?.length || selectedPatient.current_medications?.length) && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Medical Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedPatient.medical_history && selectedPatient.medical_history.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Conditions</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {selectedPatient.medical_history.slice(0, 3).map((condition, index) => (
                          <li key={index}>{condition.condition}</li>
                        ))}
                        {selectedPatient.medical_history.length > 3 && (
                          <li className="text-gray-500">+{selectedPatient.medical_history.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Allergies</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {selectedPatient.allergies.slice(0, 3).map((allergy, index) => (
                          <li key={index}>{allergy}</li>
                        ))}
                        {selectedPatient.allergies.length > 3 && (
                          <li className="text-gray-500">+{selectedPatient.allergies.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {selectedPatient.current_medications && selectedPatient.current_medications.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Current Medications</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {selectedPatient.current_medications.slice(0, 3).map((medication, index) => (
                          <li key={index}>{medication}</li>
                        ))}
                        {selectedPatient.current_medications.length > 3 && (
                          <li className="text-gray-500">+{selectedPatient.current_medications.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      {!selectedPatient && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                Patient Selection Required
              </h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>
                  Start by searching for the patient who needs medication authorization. 
                  You can search by:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Patient name (first or last)</li>
                  <li>Patient ID</li>
                  <li>Phone number</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}