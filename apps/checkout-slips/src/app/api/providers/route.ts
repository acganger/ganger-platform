import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would fetch from your EHR or staff database
    // For now, return mock data
    const providers = [
      {
        id: 'dr-anand-ganger',
        name: 'Dr. Anand Ganger',
        title: 'Dermatologist',
        department: 'Dermatology',
        active: true
      },
      {
        id: 'pa-sarah-johnson',
        name: 'Sarah Johnson',
        title: 'Physician Assistant',
        department: 'Dermatology',
        active: true
      },
      {
        id: 'np-maria-rodriguez',
        name: 'Maria Rodriguez',
        title: 'Nurse Practitioner',
        department: 'Dermatology',
        active: true
      },
      {
        id: 'dr-jennifer-smith',
        name: 'Dr. Jennifer Smith',
        title: 'Dermatologist',
        department: 'Cosmetic Dermatology',
        active: true
      }
    ];

    return NextResponse.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch providers' 
      },
      { status: 500 }
    );
  }
}