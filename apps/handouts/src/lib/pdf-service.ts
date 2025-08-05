import jsPDF from 'jspdf';

interface Patient {
  mrn: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

interface HandoutTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: number;
  digitalDeliveryEnabled: boolean;
}

interface GenerationOptions {
  patient: Patient;
  templates: HandoutTemplate[];
  formData: Record<string, any>;
}

interface UploadOptions {
  patientMRN: string;
  generationId: string;
}

interface EmailOptions {
  to: string;
  patientName: string;
  pdfUrl: string;
  templateCount: number;
}

interface SMSOptions {
  to: string;
  patientName: string;
  downloadUrl: string;
  templateCount: number;
}

export class PDFService {
  private static async loadTemplate(templateId: string): Promise<any> {
    const mockTemplates: Record<string, any> = {
      'acne-handout-kf': {
        title: 'Acne Treatment Plan',
        content: [
          {
            type: 'section',
            title: 'Treatment Overview',
            content: [
              {
                type: 'text',
                content: 'This personalized treatment plan has been created specifically for {{patient_first_name}} {{patient_last_name}}.'
              },
              {
                type: 'text',
                content: 'Follow these instructions carefully for the best results.'
              }
            ]
          }
        ]
      },
      'sun-protection': {
        title: 'Sun Protection Guidelines',
        content: [
          {
            type: 'section',
            title: 'UV Protection Basics',
            content: [
              {
                type: 'list',
                subtype: 'unordered',
                content: [
                  'Use SPF 30 or higher sunscreen daily',
                  'Reapply every 2 hours when outdoors',
                  'Wear protective clothing and wide-brimmed hats',
                  'Seek shade during peak hours (10 AM - 4 PM)'
                ]
              }
            ]
          }
        ]
      }
    };

    return mockTemplates[templateId] || {
      title: 'Template Not Found',
      content: [
        {
          type: 'text',
          content: 'Template content could not be loaded.'
        }
      ]
    };
  }

  private static processVariables(content: string, variables: Record<string, any>): string {
    let processed = content;
    
    // Replace standard patient variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), value || '');
    });

    return processed;
  }

  private static renderContentBlock(pdf: jsPDF, block: any, variables: Record<string, any>, yPosition: number): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = yPosition;

    switch (block.type) {
      case 'section':
        // Section title
        if (block.title) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(this.processVariables(block.title, variables), margin, currentY);
          currentY += 10;
        }

        // Section content
        if (block.content && Array.isArray(block.content)) {
          for (const contentItem of block.content) {
            currentY = this.renderContentBlock(pdf, contentItem, variables, currentY);
            currentY += 5; // Spacing between content items
          }
        }
        break;

      case 'text':
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const processedText = this.processVariables(block.content, variables);
        const lines = pdf.splitTextToSize(processedText, pageWidth - (margin * 2));
        pdf.text(lines, margin, currentY);
        currentY += lines.length * 6;
        break;

      case 'list':
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        if (Array.isArray(block.content)) {
          block.content.forEach((item: string, index: number) => {
            const processedItem = this.processVariables(item, variables);
            const bullet = block.subtype === 'ordered' ? `${index + 1}. ` : '• ';
            const lines = pdf.splitTextToSize(`${bullet}${processedItem}`, pageWidth - (margin * 2) - 10);
            pdf.text(lines, margin + 5, currentY);
            currentY += lines.length * 6;
          });
        }
        break;

      default:
        // Unknown block type, render as text
        if (block.content) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          const processedText = this.processVariables(block.content, variables);
          const lines = pdf.splitTextToSize(processedText, pageWidth - (margin * 2));
          pdf.text(lines, margin, currentY);
          currentY += lines.length * 6;
        }
        break;
    }

    // Check if we need a new page
    if (currentY > pdf.internal.pageSize.getHeight() - 30) {
      pdf.addPage();
      currentY = 30;
    }

    return currentY;
  }

  static async generateHandouts(options: GenerationOptions): Promise<Blob> {
    const pdf = new jsPDF();
    const margin = 20;

    // Standard variables available to all templates
    const standardVariables = {
      patient_full_name: `${options.patient.firstName} ${options.patient.lastName}`,
      patient_first_name: options.patient.firstName,
      patient_last_name: options.patient.lastName,
      patient_mrn: options.patient.mrn,
      patient_dob: options.patient.dateOfBirth || '',
      patient_email: options.patient.email || '',
      patient_phone: options.patient.phone || '',
      current_date: new Date().toLocaleDateString(),
      current_time: new Date().toLocaleTimeString(),
      current_datetime: new Date().toLocaleString(),
      ...options.formData
    };

    // Process each template
    for (let i = 0; i < options.templates.length; i++) {
      const template = options.templates[i];
      
      if (!template?.id) continue;
      
      if (i > 0) {
        pdf.addPage();
      }

      // Load template content
      const templateContent = await this.loadTemplate(template.id);
      let currentY = 30;

      // Header with practice information
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ganger Dermatology', margin, currentY);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Patient Education Materials', margin, currentY + 8);
      
      // Patient information
      const patientInfo = `Patient: ${standardVariables.patient_full_name} | MRN: ${standardVariables.patient_mrn} | Date: ${standardVariables.current_date}`;
      pdf.text(patientInfo, margin, currentY + 16);
      
      currentY += 30;

      // Template title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(templateContent.title, margin, currentY);
      currentY += 15;

      // Template content
      if (templateContent.content && Array.isArray(templateContent.content)) {
        for (const block of templateContent.content) {
          currentY = this.renderContentBlock(pdf, block, standardVariables, currentY);
          currentY += 8; // Spacing between sections
        }
      }

      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Generated on ${standardVariables.current_datetime} | Page ${i + 1} of ${options.templates.length}`,
        margin,
        pageHeight - 15
      );
    }

    return pdf.output('blob');
  }

  static async uploadPDF(pdfBlob: Blob, _options: UploadOptions): Promise<string> {
    // For now, create a temporary object URL
    const url = URL.createObjectURL(pdfBlob);
    
    // In production, this would upload to Supabase and return the public URL
    // const { data, error } = await supabase.storage
    //   .from('handouts')
    //   .upload(`${options.patientMRN}/${options.generationId}.pdf`, pdfBlob);
    
    return url;
  }

  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // Call API endpoint for email delivery
      const response = await fetch('/api/handouts/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        throw new Error('Email delivery failed');
      }
      
    } catch (error) {
      throw new Error('Email delivery failed');
    }
  }

  static async sendSMS(options: SMSOptions): Promise<void> {
    try {
      const message = `Hi ${options.patientName}! Your ${options.templateCount} patient education handout${options.templateCount !== 1 ? 's' : ''} from Ganger Dermatology ${options.templateCount !== 1 ? 'are' : 'is'} ready. Download: ${options.downloadUrl} (Link expires in 72 hours)`;

      // Call API endpoint for SMS delivery
      const response = await fetch('/api/handouts/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...options, message })
      });
      
      if (!response.ok) {
        throw new Error('SMS delivery failed');
      }
      
    } catch (error) {
      throw new Error('SMS delivery failed');
    }
  }
}