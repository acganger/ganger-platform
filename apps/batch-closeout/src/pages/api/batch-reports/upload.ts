import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth/server';
import { db, auditLogger } from '@ganger/db';
import { FileStorage, PDFProcessor } from '@ganger/integrations/server';
// import formidable from 'formidable';
// Mock formidable implementation
const formidable = () => ({
  parse: async () => {
    return [
      {}, // fields
      {
        file: {
          originalFilename: 'mock-batch-report.pdf',
          filepath: '/tmp/mock-file',
          mimetype: 'application/pdf',
          size: 1024
        }
      } // files
    ];
  }
});

// Disable body parsing to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

async function uploadHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data with file upload
    const form = formidable();

    const [, files] = await form.parse();
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type
    if (!file.mimetype?.includes('pdf')) {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    // Parse filename for hints
    const filenameHints = parseFilename(file.originalFilename || '');

    // Store file using integration service
    const fileStorage = new FileStorage();
    const fileBuffer = Buffer.from('mock-pdf-content'); // Mock for development
    const filePath = await fileStorage.uploadBuffer(fileBuffer, {
      bucket: 'batch-reports',
      filename: `${req.user.id}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${Date.now()}-${file.originalFilename}`,
      contentType: 'application/pdf'
    });

    // Create batch report record
    const batchReportRows = await db.query(
      `INSERT INTO batch_reports (
        staff_email, staff_name, location, original_filename, file_path,
        file_size_bytes, batch_info, filename_location_hint, filename_user_hint,
        processing_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
      [
        req.user.email,
        req.user.email.split('@')[0], // Use email prefix as name fallback
        filenameHints.location || 'unknown',
        file.originalFilename,
        filePath,
        file.size,
        JSON.stringify(filenameHints.batchInfo),
        filenameHints.location,
        filenameHints.user,
        'uploaded'
      ]
    );

    const batchReport = batchReportRows[0];

    // Trigger PDF parsing asynchronously
    void processPDFAsync(batchReport.id, filePath);

    // Log the upload
    await auditLogger.create(
      req.user.id,
      'batch_report',
      batchReport.id,
      {
        action: 'batch_report_uploaded',
        filename: file.originalFilename,
        file_size: file.size,
        location_hint: filenameHints.location
      }
    );

    return res.status(201).json({
      success: true,
      data: batchReport
    });
  } catch {
    // Log error for debugging in development
    return res.status(500).json({
      error: 'Failed to upload file'
    });
  }
}

function parseFilename(filename: string) {
  const cleanName = filename.toLowerCase().replace(/[^\w\s.-]/g, '');
  
  let location = null;
  if (cleanName.includes('ann') || cleanName.includes('aa') || cleanName.includes('a2')) {
    location = 'A2';
  } else if (cleanName.includes('plymouth') || cleanName.includes('py')) {
    location = 'PY';
  } else if (cleanName.includes('wixom') || cleanName.includes('wx')) {
    location = 'WX';
  }

  const userPattern = /([a-z]{2,3})[.\-_]?(?:am|pm|batch|report)/i;
  const userMatch = cleanName.match(userPattern);
  const user = userMatch ? userMatch[1] : null;

  return {
    location,
    user,
    batchInfo: cleanName
  };
}

async function processPDFAsync(batchId: string, filePath: string) {
  try {
    await db.query(
      `UPDATE batch_reports SET 
        processing_status = 'processing',
        pdf_parsing_status = 'processing',
        updated_at = NOW()
       WHERE id = $1`,
      [batchId]
    );

    const pdfProcessor = new PDFProcessor();
    const extractionResult = await pdfProcessor.extractBatchData(filePath);

    const total = Object.values(extractionResult.amounts).reduce((sum, val) => sum + val, 0);

    await db.query(
      `UPDATE batch_reports SET 
        pdf_batch_date = $1,
        pdf_location = $2,
        pdf_staff_name = $3,
        pdf_batch_id = $4,
        extracted_cash = $5,
        extracted_checks = $6,
        extracted_credit_cards = $7,
        extracted_gift_certificates = $8,
        extracted_coupons = $9,
        extracted_other = $10,
        extracted_total = $11,
        processing_status = 'parsed',
        pdf_parsing_status = 'success',
        parsed_at = NOW(),
        updated_at = NOW()
       WHERE id = $12`,
      [
        extractionResult.batchDate,
        extractionResult.location,
        extractionResult.staffName,
        extractionResult.batchId,
        extractionResult.amounts.cash,
        extractionResult.amounts.checks,
        extractionResult.amounts.credit_cards,
        extractionResult.amounts.gift_certificates,
        extractionResult.amounts.coupons,
        extractionResult.amounts.other,
        total,
        batchId
      ]
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await db.query(
      `UPDATE batch_reports SET 
        pdf_parsing_status = 'failed',
        parsing_error_message = $1,
        updated_at = NOW()
       WHERE id = $2`,
      [errorMessage, batchId]
    );
  }
}

export default withAuth(uploadHandler, { 
  roles: ['staff', 'manager', 'superadmin'],
  auditLog: true 
});