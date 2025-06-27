import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateZPL } from '../../lib/zpl-generator';
import { auditLogger } from '../../lib/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slipData, printerId, metadata } = body;

    if (!slipData || !printerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get printer information
    const { data: printer, error: printerError } = await supabase
      .from('checkout_slip_printers')
      .select('*')
      .eq('id', printerId)
      .single();

    if (printerError || !printer) {
      return NextResponse.json(
        { success: false, error: 'Printer not found' },
        { status: 404 }
      );
    }

    // Log patient access for audit trail
    await auditLogger.logPatientAccess(
      slipData.patient.mrn,
      slipData.patient.name,
      request
    );

    // Log slip generation
    await auditLogger.logSlipGeneration(slipData, request);

    // Generate ZPL code for the slip
    const zplCode = generateZPL(slipData);

    // Create print job record
    const { data: printJob, error: jobError } = await supabase
      .from('checkout_slip_print_jobs')
      .insert({
        patient_name: slipData.patient.name,
        patient_mrn: slipData.patient.mrn,
        provider_name: slipData.provider.name,
        slip_type: slipData.slipType,
        slip_content: slipData.content,
        printer_id: printerId,
        location: slipData.location,
        status: 'pending',
        printed_by: metadata?.printedBy || 'unknown',
        zpl_code: zplCode,
        metadata: {
          ...metadata,
          printerModel: printer.model,
          printerIp: printer.ip_address
        }
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    // Log print job creation
    await auditLogger.logPrintJob(printJob.id, slipData, printerId, request);

    // Send to printer (simulated)
    try {
      // In a real implementation, you would send the ZPL to the printer
      // For now, we'll simulate the print process
      await simulatePrintJob(printJob.id, printer.ip_address, zplCode);
      
      // Update job status to printing
      await supabase
        .from('checkout_slip_print_jobs')
        .update({ 
          status: 'printing',
          started_at: new Date().toISOString() 
        })
        .eq('id', printJob.id);

      // Simulate completion after a delay
      setTimeout(async () => {
        await supabase
          .from('checkout_slip_print_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', printJob.id);
        
        // Log completion
        await auditLogger.logPrintJobCompletion(printJob.id, 'completed', undefined, request);
      }, 3000);

    } catch (printError) {
      // Update job status to failed
      const errorMessage = printError instanceof Error ? printError.message : 'Print failed';
      
      await supabase
        .from('checkout_slip_print_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', printJob.id);

      // Log failure
      await auditLogger.logPrintJobCompletion(printJob.id, 'failed', errorMessage, request);

      throw printError;
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: printJob.id,
        message: 'Print job submitted successfully'
      }
    });
  } catch (error) {
    console.error('Error submitting print job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit print job'
      },
      { status: 500 }
    );
  }
}

async function simulatePrintJob(jobId: string, printerIp: string, zplCode: string) {
  // In a real implementation, this would:
  // 1. Establish connection to printer via TCP/IP (usually port 9100)
  // 2. Send ZPL code to printer
  // 3. Wait for printer confirmation
  // 4. Handle any errors
  
  console.log(`Simulating print to ${printerIp}:`, {
    jobId,
    zplLength: zplCode.length,
    preview: zplCode.substring(0, 100) + '...'
  });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 5% chance of failure for testing
  if (Math.random() < 0.05) {
    throw new Error('Printer communication timeout');
  }
}