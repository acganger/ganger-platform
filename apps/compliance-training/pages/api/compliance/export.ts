import type { NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { auditLog } from '../../../lib/auth-utils';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExportQuery {
  format: 'csv' | 'pdf';
  type: 'summary' | 'detailed' | 'overdue' | 'compliance_matrix';
  department?: string;
  location?: string;
  status?: string;
  module?: string;
  dateRange?: string;
}

interface ExportFilters {
  department?: string;
  location?: string;
  status?: string;
  module?: string;
  dateRange?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  department?: string;
}

interface ExportDataRecord {
  [key: string]: string | number | null | undefined;
}


async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  const { user } = req;

  try {

    const {
      format = 'csv',
      type = 'summary',
      department,
      location,
      status,
      module,
      dateRange,
      includePersonalInfo = 'false'
    } = req.query as ExportQuery;

    // Validate export request
    const validation = validateExportRequest({ format, type });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: validation.message
        }
      });
    }

    // Apply role-based filtering
    const filters = await applyRoleBasedFiltering(user, {
      department,
      location,
      status,
      module,
      dateRange
    });

    // Generate export data based on type
    const exportData = await generateExportData(type, filters, includePersonalInfo === 'true');

    // Format data based on requested format
    const formattedData = format === 'csv' 
      ? await generateCSV(exportData, type)
      : await generatePDF(exportData, type);

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `compliance_${type}_${timestamp}.${format}`;

    // Set appropriate headers
    const contentType = format === 'csv' ? 'text/csv' : 'application/pdf';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Log export for audit trail
    await auditLog({
      action: 'compliance_export_generated',
      userId: user.id,
      userEmail: user.email,
      resourceType: 'compliance_export',
      metadata: {
        exportType: type,
        format,
        filters,
        recordCount: exportData.length,
        fileName,
        includePersonalInfo: includePersonalInfo === 'true'
      }
    });

    // Send the file
    res.status(200).send(formattedData);

  } catch (error) {
    // Log error for monitoring without console.log
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to generate export',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}

async function _validateExportPermissions(user: User): Promise<boolean> {
  const userRole = user.role || user.user_role;
  return ['superadmin', 'hr_admin', 'manager'].includes(userRole);
}

function validateExportRequest(params: { format: string; type: string }): { valid: boolean; message?: string } {
  if (!['csv', 'pdf'].includes(params.format)) {
    return { valid: false, message: 'Invalid format. Must be csv or pdf' };
  }

  if (!['summary', 'detailed', 'overdue', 'compliance_matrix'].includes(params.type)) {
    return { valid: false, message: 'Invalid export type' };
  }

  return { valid: true };
}

async function applyRoleBasedFiltering(user: User, filters: ExportFilters): Promise<ExportFilters> {
  const userRole = user.role || user.user_role;
  const userDepartment = user.department;

  // Superadmin and HR admin can export all data
  if (['superadmin', 'hr_admin'].includes(userRole)) {
    return filters;
  }

  // Managers can only export their department data
  if (userRole === 'manager') {
    return {
      ...filters,
      department: userDepartment
    };
  }

  // Other roles get limited access
  return {
    ...filters,
    department: userDepartment,
    includePersonalInfo: false // Override personal info for limited roles
  };
}

async function generateExportData(type: string, filters: ExportFilters, includePersonalInfo: boolean): Promise<ExportDataRecord[]> {
  switch (type) {
    case 'summary':
      return await generateSummaryData(filters, includePersonalInfo);
    case 'detailed':
      return await generateDetailedData(filters, includePersonalInfo);
    case 'overdue':
      return await generateOverdueData(filters, includePersonalInfo);
    case 'compliance_matrix':
      return await generateComplianceMatrixData(filters, includePersonalInfo);
    default:
      throw new Error('Invalid export type');
  }
}

async function generateSummaryData(filters: ExportFilters, _includePersonalInfo: boolean): Promise<ExportDataRecord[]> {
  let query = supabase.from('department_compliance_dashboard').select('*');

  if (filters.department) {
    query = query.eq('department', filters.department);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(row => ({
    department: row.department,
    totalEmployees: row.total_employees,
    avgComplianceRate: `${row.avg_compliance_rate}%`,
    compliantEmployees: row.compliant_employees,
    pendingEmployees: row.pending_employees,
    nonCompliantEmployees: row.non_compliant_employees,
    totalOverdueTrainings: row.total_overdue_trainings,
    nextDepartmentDeadline: row.next_department_deadline
  }));
}

async function generateDetailedData(filters: ExportFilters, _includePersonalInfo: boolean): Promise<ExportDataRecord[]> {
  let query = supabase
    .from('employees')
    .select(`
      id,
      ${includePersonalInfo ? 'full_name, email,' : ''}
      department,
      location,
      job_title,
      start_date,
      training_completions (
        status,
        completion_date,
        due_date,
        score,
        overdue_days,
        is_required,
        module:training_modules (
          module_name,
          month_key
        )
      )
    `)
    .eq('status', 'active');

  if (filters.department) {
    query = query.eq('department', filters.department);
  }
  if (filters.location) {
    query = query.eq('location', filters.location);
  }

  const { data, error } = await query;
  if (error) throw error;

  const detailedData = [];
  
  for (const employee of data || []) {
    const completions = employee.training_completions || [];
    const requiredCompletions = completions.filter(c => c.is_required);
    const completedRequired = requiredCompletions.filter(c => c.status === 'completed');
    const overdueCount = completions.filter(c => c.status === 'overdue').length;
    
    const complianceRate = requiredCompletions.length > 0 
      ? (completedRequired.length / requiredCompletions.length) * 100 
      : 100;

    detailedData.push({
      ...(includePersonalInfo && { 
        employeeName: employee.full_name,
        email: employee.email 
      }),
      department: employee.department,
      location: employee.location,
      jobTitle: employee.job_title,
      startDate: employee.start_date,
      totalTrainings: completions.length,
      completedTrainings: completedRequired.length,
      overdueTrainings: overdueCount,
      complianceRate: `${Math.round(complianceRate)}%`,
      complianceStatus: overdueCount > 0 ? 'Non-Compliant' : 
                       requiredCompletions.length > completedRequired.length ? 'Pending' : 'Compliant'
    });
  }

  return detailedData;
}

async function generateOverdueData(filters: ExportFilters, includePersonalInfo: boolean): Promise<ExportDataRecord[]> {
  let query = supabase
    .from('training_completions')
    .select(`
      id,
      status,
      due_date,
      overdue_days,
      score,
      employee:employees (
        ${includePersonalInfo ? 'full_name, email,' : ''}
        department,
        location,
        job_title
      ),
      module:training_modules (
        module_name,
        month_key,
        estimated_duration_minutes
      )
    `)
    .eq('status', 'overdue');

  if (filters.department) {
    query = query.eq('employee.department', filters.department);
  }
  if (filters.location) {
    query = query.eq('employee.location', filters.location);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(completion => ({
    ...(includePersonalInfo && {
      employeeName: completion.employee?.full_name,
      email: completion.employee?.email
    }),
    department: completion.employee?.department,
    location: completion.employee?.location,
    jobTitle: completion.employee?.job_title,
    trainingModule: completion.module?.module_name,
    monthKey: completion.module?.month_key,
    dueDate: completion.due_date,
    overdueDays: completion.overdue_days,
    estimatedDuration: `${completion.module?.estimated_duration_minutes || 0} minutes`
  }));
}

async function generateComplianceMatrixData(filters: ExportFilters, includePersonalInfo: boolean): Promise<ExportDataRecord[]> {
  // Get compliance matrix view data
  let query = supabase.from('compliance_matrix_view').select('*');

  if (filters.department) {
    query = query.eq('department', filters.department);
  }
  if (filters.location) {
    query = query.eq('location', filters.location);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(row => ({
    ...(includePersonalInfo && {
      employeeName: row.employee_name,
      email: row.employee_email
    }),
    department: row.department,
    location: row.location,
    trainingModule: row.module_name,
    monthKey: row.month_key,
    dueDate: row.due_date,
    status: row.status,
    completionDate: row.completion_date,
    score: row.score,
    overdueDays: row.overdue_days || 0
  }));
}

async function generateCSV(data: ExportDataRecord[], _type: string): Promise<string> {
  if (!data || data.length === 0) {
    return 'No data available for export';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}

async function generatePDF(data: ExportDataRecord[], reportType: string): Promise<Buffer> {
  // For now, return CSV-like data formatted for PDF
  // In a real implementation, you would use a PDF library like PDFKit or Puppeteer
  const csvData = await generateCSV(data, reportType);
  
  // Simple PDF-like formatting (in reality, use proper PDF generation)
  const pdfContent = `
COMPLIANCE TRAINING REPORT
Generated: ${new Date().toISOString()}
Type: ${reportType.toUpperCase()}
Records: ${data.length}

${csvData}
  `;

  return Buffer.from(pdfContent, 'utf-8');
}

export default withAuth(handler, {
  requiredRoles: ['manager', 'superadmin', 'hr_admin']
});