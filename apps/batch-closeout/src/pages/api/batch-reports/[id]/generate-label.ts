import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth/server';
import { db, auditLogger } from '@ganger/db';
import { LabelGenerator } from '@ganger/integrations/server';

async function generateLabelHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: batchId } = req.query;
    const { label_template_id, delivery_details } = req.body;

    if (typeof batchId !== 'string') {
      return res.status(400).json({ error: 'Invalid batch ID' });
    }

    // Get batch report
    const batchRows = await db.query(
      'SELECT * FROM batch_reports WHERE id = $1',
      [batchId]
    );

    if (!batchRows || batchRows.length === 0) {
      return res.status(404).json({ error: 'Batch report not found' });
    }

    const batch = batchRows[0];

    // Verify user can access this batch
    if (batch.staff_email !== req.user.email && !['manager', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate batch is verified
    if (batch.verification_status !== 'verified' && batch.verification_status !== 'discrepancy_noted') {
      return res.status(400).json({ 
        error: 'Batch must be verified before generating labels' 
      });
    }

    // Get label template
    let labelTemplate = null;
    if (label_template_id) {
      const templateRows = await db.query(
        'SELECT * FROM label_templates WHERE id = $1 AND is_active = true',
        [label_template_id]
      );
      labelTemplate = templateRows[0] || null;
    }

    // If no template specified or found, get default
    if (!labelTemplate) {
      const defaultTemplateRows = await db.query(
        'SELECT * FROM label_templates WHERE is_default = true AND is_active = true LIMIT 1'
      );
      labelTemplate = defaultTemplateRows[0];
    }

    if (!labelTemplate) {
      return res.status(400).json({ error: 'No label template available' });
    }

    // Generate the label
    const labelGenerator = new LabelGenerator();
    const generatedLabel = await labelGenerator.generateEnvelopeLabel(batch, labelTemplate);

    // Create label generation record
    const labelRecordRows = await db.query(
      `INSERT INTO batch_labels (
        batch_report_id, label_template_id, generated_by, delivery_address,
        delivery_contact, delivery_notes, label_file_path, qr_code_data,
        generation_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
      [
        batchId,
        labelTemplate.id,
        req.user.email,
        delivery_details?.address || '',
        delivery_details?.contact || '',
        delivery_details?.notes || '',
        generatedLabel.filePath,
        generatedLabel.qrCodeData,
        'generated'
      ]
    );

    const labelRecord = labelRecordRows[0];

    // Update batch report status
    await db.query(
      `UPDATE batch_reports SET 
        processing_status = 'completed',
        labels_generated = true,
        updated_at = NOW()
       WHERE id = $1`,
      [batchId]
    );

    // Log label generation
    await auditLogger.update(
      req.user.id,
      'batch_report',
      batchId,
      {
        action: 'batch_label_generated',
        label_template_id: labelTemplate.id,
        template_name: labelTemplate.template_name,
        has_delivery_details: !!(delivery_details?.address)
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        label: labelRecord,
        download_url: generatedLabel.downloadUrl,
        qr_code: generatedLabel.qrCodeData
      }
    });
  } catch {
    // Log error for debugging in development
    return res.status(500).json({
      error: 'Failed to generate label'
    });
  }
}

export default withAuth(generateLabelHandler, { 
  roles: ['staff', 'manager', 'superadmin'],
  auditLog: true 
});