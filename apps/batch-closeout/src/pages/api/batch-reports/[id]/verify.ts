import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth/server';
import { db, auditLogger } from '@ganger/db';

async function verifyHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: batchId } = req.query;
    const { verified_amounts, discrepancy_explanation } = req.body;

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

    // Validate verified amounts
    if (!verified_amounts || typeof verified_amounts !== 'object') {
      return res.status(400).json({ error: 'Invalid verified amounts data' });
    }

    // Calculate discrepancies
    const extractedAmounts = {
      cash: batch.extracted_cash || 0,
      checks: batch.extracted_checks || 0,
      credit_cards: batch.extracted_credit_cards || 0,
      gift_certificates: batch.extracted_gift_certificates || 0,
      coupons: batch.extracted_coupons || 0,
      other: batch.extracted_other || 0
    };

    const discrepancies = [];
    let hasDiscrepancies = false;

    for (const [type, verifiedAmount] of Object.entries(verified_amounts)) {
      const extractedAmount = extractedAmounts[type as keyof typeof extractedAmounts] || 0;
      const variance = (verifiedAmount as number) - extractedAmount;
      
      if (Math.abs(variance) > 0.01) { // Account for floating point precision
        hasDiscrepancies = true;
        discrepancies.push({
          payment_type: type,
          extracted_amount: extractedAmount,
          verified_amount: verifiedAmount,
          variance_amount: variance
        });
      }
    }

    // Validate discrepancy explanation if needed
    if (hasDiscrepancies && !discrepancy_explanation?.trim()) {
      return res.status(400).json({
        error: 'Discrepancy explanation is required when amounts differ'
      });
    }

    // Calculate verified total
    const verifiedTotal = Object.values(verified_amounts).reduce((sum: number, val: unknown) => {
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    // Update batch report
    await db.query(
      `UPDATE batch_reports SET 
        verified_cash = $1,
        verified_checks = $2,
        verified_credit_cards = $3,
        verified_gift_certificates = $4,
        verified_coupons = $5,
        verified_other = $6,
        verified_total = $7,
        has_discrepancies = $8,
        verification_status = $9,
        discrepancy_explanation = $10,
        verified_at = NOW(),
        verified_by = $11,
        processing_status = 'verified',
        updated_at = NOW()
       WHERE id = $12`,
      [
        verified_amounts.cash,
        verified_amounts.checks,
        verified_amounts.credit_cards,
        verified_amounts.gift_certificates,
        verified_amounts.coupons,
        verified_amounts.other,
        verifiedTotal,
        hasDiscrepancies,
        hasDiscrepancies ? 'discrepancy_noted' : 'verified',
        hasDiscrepancies ? discrepancy_explanation : null,
        req.user.email,
        batchId
      ]
    );

    // Create discrepancy records
    if (discrepancies.length > 0) {
      for (const discrepancy of discrepancies) {
        await db.query(
          `INSERT INTO batch_discrepancies (
            batch_report_id, payment_type, extracted_amount, verified_amount,
            variance_amount, staff_explanation, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            batchId,
            discrepancy.payment_type,
            discrepancy.extracted_amount,
            discrepancy.verified_amount,
            discrepancy.variance_amount,
            discrepancy_explanation
          ]
        );
      }

      // Check if we need to send alerts
      await checkDiscrepancyThreshold(batch, discrepancies);
    }

    // Log verification
    await auditLogger.update(
      req.user.id,
      'batch_report',
      batchId,
      {
        action: 'batch_amounts_verified',
        has_discrepancies: hasDiscrepancies,
        total_variance: discrepancies.reduce((sum, d) => sum + Math.abs(d.variance_amount), 0),
        discrepancy_count: discrepancies.length
      }
    );

    // Get updated batch data
    const updatedBatchRows = await db.query(
      'SELECT * FROM batch_reports WHERE id = $1',
      [batchId]
    );

    return res.status(200).json({
      success: true,
      data: updatedBatchRows[0],
      discrepancies: discrepancies
    });
  } catch {
    // Log error for debugging in development
    return res.status(500).json({
      error: 'Failed to verify amounts'
    });
  }
}

async function checkDiscrepancyThreshold(batch: any, discrepancies: any[]) {
  try {
    const configRows = await db.query(
      `SELECT config_key, config_value FROM batch_system_config 
       WHERE config_key IN ('discrepancy_threshold_dollars', 'discrepancy_threshold_percentage', 'enable_discrepancy_alerts')`
    );

    const config = configRows.reduce((acc: Record<string, string>, row: any) => {
      acc[row.config_key] = row.config_value;
      return acc;
    }, {} as Record<string, string>);

    const alertsEnabled = config['enable_discrepancy_alerts'] === 'true';
    
    if (!alertsEnabled) return;

    const dollarThreshold = parseFloat(config['discrepancy_threshold_dollars'] || '5.00');
    const percentageThreshold = parseFloat(config['discrepancy_threshold_percentage'] || '2.0');

    const totalVariance = discrepancies.reduce((sum, d) => sum + Math.abs(d.variance_amount), 0);
    const percentageVariance = (totalVariance / (batch.extracted_total || 1)) * 100;

    if (totalVariance > dollarThreshold || percentageVariance > percentageThreshold) {
      await sendDiscrepancyAlert();
    }
  } catch {
    // Threshold check error, continue silently
  }
}

async function sendDiscrepancyAlert() {
  // Discrepancy alert would be triggered here
}

export default withAuth(verifyHandler, { 
  roles: ['staff', 'manager', 'superadmin'],
  auditLog: true 
});