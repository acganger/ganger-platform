import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { auditLogger } from '../../../../lib/audit-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the original print job
    const { data: originalJob, error: fetchError } = await supabase
      .from('checkout_slip_print_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !originalJob) {
      return NextResponse.json(
        { success: false, error: 'Print job not found' },
        { status: 404 }
      );
    }

    // Create a new print job based on the original
    const { data: newJob, error: createError } = await supabase
      .from('checkout_slip_print_jobs')
      .insert({
        patient_name: originalJob.patient_name,
        patient_mrn: originalJob.patient_mrn,
        provider_name: originalJob.provider_name,
        slip_type: originalJob.slip_type,
        slip_content: originalJob.slip_content,
        printer_id: originalJob.printer_id,
        location: originalJob.location,
        status: 'pending',
        printed_by: 'system-reprint', // In real app, get from auth context
        metadata: {
          ...originalJob.metadata,
          isReprint: true,
          originalJobId: jobId
        }
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Log reprint action
    await auditLogger.logPrintJobReprint(jobId, newJob.id, request);

    // In a real implementation, you would trigger the actual print job here
    // For now, we'll simulate immediate success
    setTimeout(async () => {
      await supabase
        .from('checkout_slip_print_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', newJob.id);
    }, 2000);

    return NextResponse.json({
      success: true,
      data: {
        jobId: newJob.id,
        message: 'Reprint job created successfully'
      }
    });
  } catch (error) {
    console.error('Error reprinting job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reprint job' 
      },
      { status: 500 }
    );
  }
}