import { useState } from 'react';
import { Button, Card, Badge } from '@ganger/ui';

interface EmployeeRecognitionDemoProps {
  onRunDemo: (phone: string, name: string) => void;
}

const DEMO_EMPLOYEES = [
  {
    name: 'Dr. Anand Ganger',
    title: 'Practice Owner & Dermatologist',
    phone: '+1 (734) 555-0101',
    department: 'Medical',
    icon: '👨‍⚕️'
  },
  {
    name: 'Sarah Williams',
    title: 'Physician Assistant',
    phone: '+1 (734) 555-0102',
    department: 'Medical',
    icon: '👩‍⚕️'
  },
  {
    name: 'Jessica Martinez',
    title: 'Practice Manager',
    phone: '+1 (248) 555-0103',
    department: 'Administration',
    icon: '👩‍💼'
  },
  {
    name: 'Michael Johnson',
    title: 'Medical Assistant',
    phone: '+1 (734) 555-0104',
    department: 'Medical',
    icon: '👨‍⚕️'
  }
];

export const EmployeeRecognitionDemo = ({ onRunDemo }: EmployeeRecognitionDemoProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  return (
    <Card title="🏢 Employee Recognition Demo" className="mb-6">
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">Z</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Zenefits Integration Active</h4>
              <p className="text-sm text-blue-700 mt-1">
                When employees call from their registered phone numbers, the AI will recognize them 
                instantly and provide a personalized greeting with their name and appropriate access level.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_EMPLOYEES.map((employee) => (
            <div
              key={employee.phone}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedEmployee === employee.phone
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedEmployee(employee.phone)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{employee.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{employee.name}</h4>
                  <p className="text-sm text-slate-600">{employee.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" size="sm">{employee.department}</Badge>
                    <span className="text-xs text-slate-500">{employee.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedEmployee && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Simulate call from {DEMO_EMPLOYEES.find(e => e.phone === selectedEmployee)?.name}
                </p>
                <p className="text-xs text-slate-600">
                  The AI will recognize the employee and provide a personalized greeting
                </p>
              </div>
              <Button
                onClick={() => {
                  const employee = DEMO_EMPLOYEES.find(e => e.phone === selectedEmployee);
                  if (employee) {
                    onRunDemo(employee.phone, employee.name);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Employee Call Demo
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Ready for Production: Connect to real Zenefits API
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Demo uses mock employee data. In production, this will query your actual Zenefits employee directory.
          </p>
        </div>
      </div>
    </Card>
  );
};