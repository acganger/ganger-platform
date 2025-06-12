import { Card } from '@ganger/ui';

interface Patient {
  mrn: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

interface PatientInfoProps {
  patient: Patient;
}

export function PatientInfo({ patient }: PatientInfoProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return 'Not provided';
    
    // Basic phone formatting for US numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h3>
              <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Date of Birth</p>
              <p className="text-sm text-gray-600">{formatDate(patient.dateOfBirth)}</p>
            </div>
            
            <div className="space-y-2">
              {patient.email && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-600 truncate">{patient.email}</p>
                </div>
              )}
              
              {patient.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-sm text-gray-600">{formatPhone(patient.phone)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-green-400 rounded-full" title="Patient verified" />
        </div>
      </div>
    </Card>
  );
}