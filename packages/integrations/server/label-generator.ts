// Simplified label generator for monorepo stability
import jsPDF from 'jspdf';
import * as QRCode from 'qrcode';
import { supabaseAdmin } from '@ganger/db';

interface BatchReport {
  id: string;
  location: string;
  batch_date: Date;
  total_amount: number;
  recipient_name?: string;
  recipient_address?: string;
}

interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  format: string;
}

export interface GeneratedLabel {
  id: string;
  batch_report_id: string;
  file_url: string;
  file_size: number;
  generated_at: Date;
  filePath: string;
  qrCodeData: string;
  downloadUrl: string;
}

export class LabelGenerator {
  async generateEnvelopeLabel(
    batchReport: BatchReport, 
    template?: LabelTemplate
  ): Promise<GeneratedLabel> {
    // Create PDF label
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [template?.width || 100, template?.height || 50]
    });

    // Add label content
    pdf.setFontSize(12);
    pdf.text(batchReport.location, 10, 15);
    pdf.text(`Batch: ${batchReport.batch_date.toLocaleDateString()}`, 10, 25);
    pdf.text(`Amount: $${batchReport.total_amount.toFixed(2)}`, 10, 35);

    // Generate QR code if needed
    const qrCodeData = `batch:${batchReport.id}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeData);
    pdf.addImage(qrCodeDataURL, 'PNG', 70, 10, 25, 25);

    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // For now, return a mock result (file storage can be implemented later)
    const labelId = `label_${batchReport.id}_${Date.now()}`;
    
    // Store label record in database
    const { error } = await supabaseAdmin
      .from('generated_labels')
      .insert({
        id: labelId,
        batch_report_id: batchReport.id,
        file_url: `/labels/${labelId}.pdf`, // TODO: Implement actual file storage
        file_size: pdfBuffer.length,
        generated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to store label record:', error);
      throw error;
    }

    return {
      id: labelId,
      batch_report_id: batchReport.id,
      file_url: `/labels/${labelId}.pdf`,
      file_size: pdfBuffer.length,
      generated_at: new Date(),
      filePath: `/labels/${labelId}.pdf`,
      qrCodeData,
      downloadUrl: `/labels/${labelId}.pdf`
    };
  }

  async getTemplate(templateId: string): Promise<LabelTemplate | null> {
    const { data, error } = await supabaseAdmin
      .from('label_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) return null;
    return data;
  }
}