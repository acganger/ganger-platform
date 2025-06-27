import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // In a real implementation, this would search your EHR/patient database
    // For now, return mock data that matches the search query
    const mockPatients = [
      {
        id: 'patient-001',
        name: 'John Smith',
        dob: '1985-06-15',
        mrn: 'MRN001234',
        insurance: 'Blue Cross Blue Shield',
        copay: 25,
        balance: 150,
        phone: '(555) 123-4567'
      },
      {
        id: 'patient-002',
        name: 'Sarah Johnson',
        dob: '1978-03-22',
        mrn: 'MRN001235',
        insurance: 'Aetna',
        copay: 30,
        balance: 0,
        phone: '(555) 234-5678'
      },
      {
        id: 'patient-003',
        name: 'Michael Brown',
        dob: '1992-11-08',
        mrn: 'MRN001236',
        insurance: 'United Healthcare',
        copay: 20,
        balance: 75,
        phone: '(555) 345-6789'
      },
      {
        id: 'patient-004',
        name: 'Emily Davis',
        dob: '1965-09-14',
        mrn: 'MRN001237',
        insurance: 'Medicare',
        copay: 0,
        balance: 200,
        phone: '(555) 456-7890'
      },
      {
        id: 'patient-005',
        name: 'David Wilson',
        dob: '1988-12-01',
        mrn: 'MRN001238',
        insurance: null,
        copay: 0,
        balance: 350,
        phone: '(555) 567-8901'
      }
    ];

    // Filter patients based on search query
    const filteredPatients = mockPatients.filter(patient => {
      const searchTerm = query.toLowerCase();
      return (
        patient.name.toLowerCase().includes(searchTerm) ||
        patient.mrn.toLowerCase().includes(searchTerm) ||
        patient.dob.includes(searchTerm) ||
        (patient.phone && patient.phone.includes(searchTerm))
      );
    });

    // Convert string dates to Date objects for the response
    const patientsWithDates = filteredPatients.map(patient => ({
      ...patient,
      dob: new Date(patient.dob)
    }));

    return NextResponse.json({
      success: true,
      data: patientsWithDates.slice(0, 10) // Limit to 10 results
    });
  } catch (error) {
    console.error('Error searching patients:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search patients' 
      },
      { status: 500 }
    );
  }
}