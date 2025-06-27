import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: printJobs, error } = await supabase
      .from('checkout_slip_print_jobs')
      .select(`
        *,
        checkout_slip_printers!inner(name, location)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Transform the data to match our PrintJob interface
    const transformedJobs = (printJobs || []).map(job => ({
      id: job.id,
      patientName: job.patient_name,
      providerName: job.provider_name,
      slipType: job.slip_type,
      printerName: job.checkout_slip_printers.name,
      location: job.checkout_slip_printers.location,
      status: job.status,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      errorMessage: job.error_message
    }));

    return NextResponse.json({
      success: true,
      data: transformedJobs
    });
  } catch (error) {
    console.error('Error fetching print jobs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch print jobs' 
      },
      { status: 500 }
    );
  }
}