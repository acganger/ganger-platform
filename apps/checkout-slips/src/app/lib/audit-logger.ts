import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface AuditLogEntry {
  action: string;
  resourceType: 'patient' | 'print_job' | 'printer' | 'slip';
  resourceId?: string;
  details?: Record<string, any>;
  patientMrn?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private supabase;

  constructor() {
    this.supabase = createRouteHandlerClient({ cookies });
  }

  async log(entry: AuditLogEntry, request?: Request): Promise<void> {
    try {
      // Get user information from session
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        console.warn('Audit log attempted without session');
        return;
      }

      // Get staff user information
      const { data: staffUser } = await this.supabase
        .from('staff_users')
        .select('id, email, role')
        .eq('email', session.user.email)
        .single();

      // Extract request metadata
      const ipAddress = request?.headers.get('x-forwarded-for') || 
                       request?.headers.get('x-real-ip') || 
                       'unknown';
      const userAgent = request?.headers.get('user-agent') || 'unknown';

      // Create audit log entry
      const auditEntry = {
        user_id: session.user.id,
        staff_id: staffUser?.id,
        user_email: session.user.email,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        patient_mrn: entry.patientMrn,
        details: entry.details || {},
        ip_address: entry.ipAddress || ipAddress,
        user_agent: entry.userAgent || userAgent,
        timestamp: new Date().toISOString(),
        application: 'checkout-slips'
      };

      // Insert into audit log table
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to write audit log:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Convenience methods for common actions
  async logPatientAccess(patientMrn: string, patientName: string, request?: Request) {
    await this.log({
      action: 'patient_access',
      resourceType: 'patient',
      patientMrn,
      details: { patientName }
    }, request);
  }

  async logSlipGeneration(slipData: any, request?: Request) {
    await this.log({
      action: 'slip_generated',
      resourceType: 'slip',
      patientMrn: slipData.patient?.mrn,
      details: {
        patientName: slipData.patient?.name,
        providerName: slipData.provider?.name,
        slipType: slipData.slipType,
        location: slipData.location
      }
    }, request);
  }

  async logPrintJob(printJobId: string, slipData: any, printerId: string, request?: Request) {
    await this.log({
      action: 'print_job_created',
      resourceType: 'print_job',
      resourceId: printJobId,
      patientMrn: slipData.patient?.mrn,
      details: {
        patientName: slipData.patient?.name,
        providerName: slipData.provider?.name,
        slipType: slipData.slipType,
        printerId,
        location: slipData.location
      }
    }, request);
  }

  async logPrintJobCompletion(printJobId: string, status: 'completed' | 'failed', errorMessage?: string, request?: Request) {
    await this.log({
      action: 'print_job_completed',
      resourceType: 'print_job',
      resourceId: printJobId,
      details: {
        status,
        errorMessage
      }
    }, request);
  }

  async logPrintJobReprint(originalJobId: string, newJobId: string, request?: Request) {
    await this.log({
      action: 'print_job_reprinted',
      resourceType: 'print_job',
      resourceId: newJobId,
      details: {
        originalJobId
      }
    }, request);
  }

  async logPrinterAccess(printerId: string, action: string, request?: Request) {
    await this.log({
      action: `printer_${action}`,
      resourceType: 'printer',
      resourceId: printerId,
      details: { action }
    }, request);
  }

  async logTestPrint(printerId: string, request?: Request) {
    await this.log({
      action: 'test_print_sent',
      resourceType: 'printer',
      resourceId: printerId,
      details: { isTestPrint: true }
    }, request);
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();