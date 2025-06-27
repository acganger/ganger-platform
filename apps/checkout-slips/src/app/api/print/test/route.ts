import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { auditLogger } from '../../lib/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { printerId } = body;

    if (!printerId) {
      return NextResponse.json(
        { success: false, error: 'Printer ID required' },
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

    // Generate test ZPL
    const testZPL = generateTestZPL(printer.name);

    // Create test print job record
    const { data: printJob, error: jobError } = await supabase
      .from('checkout_slip_print_jobs')
      .insert({
        patient_name: 'TEST PATIENT',
        patient_mrn: 'TEST001',
        provider_name: 'System Test',
        slip_type: 'medical',
        slip_content: { test: true },
        printer_id: printerId,
        location: printer.location,
        status: 'pending',
        printed_by: 'system-test',
        zpl_code: testZPL,
        metadata: {
          isTestPrint: true,
          printerModel: printer.model,
          printerIp: printer.ip_address
        }
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    // Log test print
    await auditLogger.logTestPrint(printerId, request);

    // Send test print
    try {
      await simulateTestPrint(printer.ip_address, testZPL);
      
      // Update job status
      await supabase
        .from('checkout_slip_print_jobs')
        .update({ 
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', printJob.id);

    } catch (printError) {
      await supabase
        .from('checkout_slip_print_jobs')
        .update({
          status: 'failed',
          error_message: printError instanceof Error ? printError.message : 'Test print failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', printJob.id);

      throw printError;
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: printJob.id,
        message: 'Test print sent successfully'
      }
    });
  } catch (error) {
    console.error('Error sending test print:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send test print'
      },
      { status: 500 }
    );
  }
}

function generateTestZPL(printerName: string): string {
  return `^XA
^FO50,50^A0N,30,30^FDGanger Dermatology^FS
^FO50,100^A0N,25,25^FDPrinter Test Page^FS
^FO50,150^A0N,20,20^FDPrinter: ${printerName}^FS
^FO50,180^A0N,20,20^FDTime: ${new Date().toLocaleString()}^FS
^FO50,220^A0N,15,15^FDThis is a test print to verify^FS
^FO50,240^A0N,15,15^FDprinter connectivity and alignment.^FS
^FO50,280^A0N,15,15^FDIf you can read this, the printer^FS
^FO50,300^A0N,15,15^FDis working correctly.^FS
^XZ`;
}

async function simulateTestPrint(printerIp: string, zplCode: string) {
  console.log(`Simulating test print to ${printerIp}:`, {
    zplLength: zplCode.length
  });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate 2% chance of failure for testing
  if (Math.random() < 0.02) {
    throw new Error('Test print failed - printer not responding');
  }
}