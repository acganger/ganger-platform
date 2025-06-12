import { useState, useEffect } from 'react';
import { Button, Card, LoadingSpinner } from '@ganger/ui';

interface Patient {
  mrn: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface PDFPreviewProps {
  patient: Patient;
  templates: Template[];
  formData: Record<string, any>;
  onGenerate: () => void;
  onEdit: () => void;
}

export function PDFPreview({ patient, templates, formData, onGenerate, onEdit }: PDFPreviewProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generatePreview = async () => {
      try {
        setLoading(true);
        
        // Simulate preview generation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockPreviewHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 1in;">
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Ganger Dermatology</h1>
              <p style="margin: 5px 0;">Patient Education Materials</p>
              <p style="margin: 5px 0; font-size: 12px;">
                Patient: ${patient.firstName} ${patient.lastName} | MRN: ${patient.mrn} | Date: ${new Date().toLocaleDateString()}
              </p>
            </div>
            
            ${templates.map(template => `
              <div style="margin-bottom: 40px; page-break-inside: avoid;">
                <h2 style="color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">
                  ${template.name}
                </h2>
                <div style="margin-top: 20px; line-height: 1.6;">
                  ${template.id === 'acne-handout-kf' ? `
                    <h3>Treatment Overview</h3>
                    <p>This personalized treatment plan has been created specifically for <strong>${patient.firstName} ${patient.lastName}</strong>.</p>
                    
                    <h3>Daily Routine</h3>
                    <ol>
                      <li>Wash affected areas with ${formData.benzoyl_peroxide_percent || '2.5'}% benzoyl peroxide cleanser</li>
                      <li>Apply tretinoin cream as directed</li>
                      <li>Use moisturizer to prevent dryness</li>
                      <li>Apply sunscreen daily (SPF 30+)</li>
                    </ol>
                    
                    <h3>Important Notes</h3>
                    <ul>
                      <li>Start slowly to build tolerance</li>
                      <li>Expect some initial dryness and irritation</li>
                      <li>Results typically visible in 6-12 weeks</li>
                      <li>Contact office with severe irritation</li>
                    </ul>
                  ` : template.id === 'sun-protection' ? `
                    <h3>UV Protection Basics</h3>
                    <ul>
                      <li>Use SPF 30 or higher sunscreen daily</li>
                      <li>Reapply every 2 hours when outdoors</li>
                      <li>Wear protective clothing and wide-brimmed hats</li>
                      <li>Seek shade during peak hours (10 AM - 4 PM)</li>
                    </ul>
                    
                    <h3>Recommended Products</h3>
                    <ul>
                      <li>Zinc oxide or titanium dioxide sunscreens</li>
                      <li>UPF-rated clothing</li>
                      <li>Sunglasses with UV protection</li>
                    </ul>
                  ` : `
                    <p>Template content for ${template.name} would appear here with patient-specific information and any form data that was collected.</p>
                  `}
                </div>
              </div>
            `).join('')}
            
            <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280;">
              <p>Generated on ${new Date().toLocaleString()} | For medical questions, contact Ganger Dermatology</p>
            </div>
          </div>
        `;
        
        setPreviewHtml(mockPreviewHtml);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    generatePreview();
  }, [patient, templates, formData]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Generating preview...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900">PDF Preview</h3>
            <p className="text-sm text-gray-600">
              Preview for {patient.firstName} {patient.lastName} • {templates.length} template{templates.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onEdit} variant="outline" size="sm">
              Edit Templates
            </Button>
            <Button onClick={onGenerate} variant="primary" size="sm">
              Generate PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview Content */}
      <Card className="p-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-inner">
          <div 
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            style={{
              minHeight: '11in',
              backgroundColor: 'white',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)'
            }}
          />
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            This is a preview of how your handouts will appear when printed or delivered digitally.
          </p>
        </div>
      </Card>
    </div>
  );
}