# Batch Closeout & Label Generator - Frontend Development PRD
*React/Next.js Frontend Implementation for Ganger Platform*

**📚 REQUIRED READING:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development. This is the single source of truth for all platform development patterns, standards, and quality requirements.

## 📋 Document Information
- **Application Name**: Batch Closeout & Label Generator (Frontend)
- **PRD ID**: PRD-BATCH-CLOSEOUT-002 (Frontend)
- **Priority**: High
- **Development Timeline**: 4-5 weeks
- **Last Updated**: June 17, 2025
- **Terminal Assignment**: TERMINAL 1 - FRONTEND
- **Dependencies**: @ganger/ui, @ganger/auth/client, @ganger/utils/client, @ganger/integrations/client, @ganger/types
- **MCP Integration Requirements**: Backend API endpoints, Real-time updates, File upload progress
- **Integration Requirements**: Backend API endpoints, PDF processing, Label generation

---

## 🎯 Frontend Scope

### **Terminal 1 Responsibilities**
- React components for file upload interface
- PDF parsing progress and status display
- Amount verification forms and validation
- Label preview and printing interface
- Client-side state management
- Mobile-responsive design implementation

### **Excluded from Frontend Terminal**
- API route implementations (Terminal 2)
- PDF processing logic (Terminal 2)
- Label generation backend (Terminal 2)
- File storage operations (Terminal 2)

---

## 🏗️ Technical Architecture

### **MANDATORY: Cloudflare Workers Architecture**
```yaml
# ✅ REQUIRED: Workers-only deployment (Pages is sunset)
Framework: Next.js 14+ with Workers runtime (runtime: 'edge')
Deployment: Cloudflare Workers (NO Pages deployment)
Build Process: @cloudflare/next-on-pages
Configuration: Workers-compatible next.config.js (NO static export)

# ❌ FORBIDDEN: These patterns cause 405 errors
Static_Export: Never use output: 'export'
Cloudflare_Pages: Sunset for Workers routes
Custom_Routing: Must use Workers request handling
```

### **⚠️ CRITICAL: Anti-Pattern Prevention**
```typescript
// ❌ NEVER USE: Static export configuration (causes 405 errors)
const nextConfig = {
  output: 'export',        // DELETE THIS - breaks Workers
  trailingSlash: true,     // DELETE THIS - static pattern
  distDir: 'dist'          // DELETE THIS - Workers incompatible
}

// ✅ REQUIRED: Workers-compatible configuration
const nextConfig = {
  experimental: {
    runtime: 'edge',         // MANDATORY for Workers
  },
  images: {
    unoptimized: true,       // Required for Workers
  },
  basePath: '/batch-closeout', // Required for staff portal routing
}
```

### **Architecture Verification Requirements**
```bash
# ✅ MANDATORY: Every app must pass these checks
pnpm type-check              # 0 errors required
pnpm build                   # Successful completion required
curl -I [app-url]/health     # HTTP 200 required (not 405)
grep -r "StaffPortalLayout"  # Must find implementation
grep -r "output.*export"     # Must find nothing
```

### **Shared Infrastructure with Pages Sunset Note**
```yaml
Frontend: Next.js 14+ with TypeScript (100% compilation required)
Backend: Next.js API routes + Supabase Edge Functions (Workers runtime)
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers EXCLUSIVELY (Pages sunset for Workers routes)
Styling: Tailwind CSS + Ganger Design System (NO custom CSS allowed)
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
Build System: Turborepo (workspace compliance required)
Quality Gates: Automated pre-commit hooks (see MASTER_DEVELOPMENT_GUIDE.md)
```

### **Platform Constants & Patterns (REQUIRED KNOWLEDGE)**
```typescript
// ✅ MANDATORY: Use platform constants (see @ganger/types)
import { 
  USER_ROLES, 
  LOCATIONS, 
  PRIORITY_LEVELS,
  BATCH_STATUS,
  FILE_TYPES
} from '@ganger/types/constants';

// ✅ Standard form types
const FORM_TYPES = [
  'batch_upload',
  'amount_verification',
  'discrepancy_report',
  'label_generation'
] as const;
```

### **Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { /* ALL UI components */ } from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { 
  ClientFileUploadService,
  ClientFormValidationService,
  ClientCacheService 
} from '@ganger/integrations/client';
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  User, Patient, Appointment, Provider,
  ApiResponse, PaginationMeta, ValidationRule,
  BatchReport, BatchDiscrepancy, EnvelopeLabel, LabelTemplate
} from '@ganger/types';
```

### **Staff Portal Integration (MANDATORY)**
```typescript
// ✅ REQUIRED: Batch Closeout UI must be accessible through staff portal
import { StaffPortalLayout } from '@ganger/ui/staff';

export default function BatchCloseoutDashboard() {
  return (
    <StaffPortalLayout 
      appName="batch-closeout"
      title="Batch Closeout & Label Generator"
      permissions={['process_batch_reports']}
    >
      <BatchCloseoutMain />
    </StaffPortalLayout>
  );
}
```

## 🏗️ Frontend Technology Stack

### **Required Client-Side Packages**
```typescript
'use client'

// Client-safe imports only
import { 
  FileUpload, PDFViewer, LabelPreview, AmountVerification,
  Button, Input, Modal, LoadingSpinner, DataTable,
  FormField, Select, TextArea, ProgressBar, StatusBadge
} from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { validateForm, formatCurrency, formatDate } from '@ganger/utils/client';
import { 
  User, BatchReport, BatchDiscrepancy, EnvelopeLabel,
  LabelTemplate, VerificationStatus
} from '@ganger/types';
```

### **Frontend-Specific Technology**
- **File Upload**: Drag & drop interface with validation
- **PDF Display**: Client-side PDF preview and annotation
- **Form Validation**: Real-time validation for amount verification
- **Label Preview**: Live preview of generated labels
- **Print Interface**: Browser print API with label formatting
- **Progress Tracking**: Real-time status updates during processing

---

## 🎨 User Interface Components

### **Main Dashboard Layout**
```typescript
'use client'

export default function BatchCloseoutDashboard() {
  const [activeStep, setActiveStep] = useState<'upload' | 'verify' | 'label'>('upload');
  const [currentBatch, setCurrentBatch] = useState<BatchReport | null>(null);

  return (
    <AppLayout>
      <PageHeader 
        title="Batch Closeout" 
        subtitle="Upload, verify, and generate labels for deposit envelopes"
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <StepProgress 
            steps={[
              { id: 'upload', label: 'Upload Report', completed: !!currentBatch },
              { id: 'verify', label: 'Verify Amounts', completed: currentBatch?.verification_status === 'verified' },
              { id: 'label', label: 'Generate Label', completed: currentBatch?.label_generated }
            ]}
            currentStep={activeStep}
          />
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg">
          {activeStep === 'upload' && (
            <BatchUploadStep 
              onUpload={setCurrentBatch}
              onNext={() => setActiveStep('verify')}
            />
          )}
          
          {activeStep === 'verify' && currentBatch && (
            <AmountVerificationStep 
              batch={currentBatch}
              onVerify={(verifiedBatch) => {
                setCurrentBatch(verifiedBatch);
                setActiveStep('label');
              }}
              onBack={() => setActiveStep('upload')}
            />
          )}
          
          {activeStep === 'label' && currentBatch && (
            <LabelGenerationStep 
              batch={currentBatch}
              onComplete={() => {/* Reset or navigate */}}
              onBack={() => setActiveStep('verify')}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
```

### **File Upload Component**
```typescript
'use client'

interface BatchUploadStepProps {
  onUpload: (batch: BatchReport) => void;
  onNext: () => void;
}

export function BatchUploadStep({ onUpload, onNext }: BatchUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    const file = files[0];
    
    if (!file) return;
    
    // Validate file
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    
    try {
      // Upload file with progress tracking
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/batch-reports/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(progress);
        }
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      
      // Wait for PDF parsing to complete
      await pollForParsingCompletion(result.data.id);
      
      // Get the parsed batch data
      const batchResponse = await fetch(`/api/batch-reports/${result.data.id}`);
      const batchData = await batchResponse.json();
      
      onUpload(batchData.data);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload and process file');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const pollForParsingCompletion = async (batchId: string): Promise<void> => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await fetch(`/api/batch-reports/${batchId}/parsing-status`);
      const status = await response.json();
      
      if (status.parsing_status === 'success') {
        return;
      }
      
      if (status.parsing_status === 'failed') {
        throw new Error(status.parsing_error_message || 'PDF parsing failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('PDF parsing timed out');
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Batch Report</h2>
        <p className="text-gray-600">Upload your ModMed batch report PDF to begin the verification process</p>
      </div>

      {!uploadedFile ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileSelect(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <CloudUploadIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Drop your PDF here</h3>
          <p className="text-gray-500 mb-4">or click to browse files</p>
          
          <Button variant="outline">Choose File</Button>
          
          <div className="mt-6 text-sm text-gray-500">
            <h4 className="font-medium mb-2">Requirements:</h4>
            <ul className="space-y-1">
              <li>• PDF format only</li>
              <li>• Maximum 10MB file size</li>
              <li>• Must be ModMed batch report</li>
              <li>• File will be processed automatically</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <DocumentIcon className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{uploadedFile.name}</h3>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                </p>
              </div>
            </div>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <LoadingSpinner size="sm" />
                <span className="font-medium text-blue-900">Processing PDF...</span>
              </div>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div>
                  <div className="flex justify-between text-sm text-blue-700 mb-1">
                    <span>Uploading</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <ProgressBar value={uploadProgress} className="mb-4" />
                </div>
              )}
              
              <div className="text-sm text-blue-700">
                <p>1. Uploading file to secure storage</p>
                <p>2. Extracting data from PDF content</p>
                <p>3. Analyzing batch information</p>
                <p>4. Preparing verification interface</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadedFile(null);
                setUploadProgress(0);
              }}
              disabled={isProcessing}
            >
              Choose Different File
            </Button>
            
            {!isProcessing && (
              <Button onClick={onNext}>
                Continue to Verification
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### **Amount Verification Component**
```typescript
'use client'

interface AmountVerificationStepProps {
  batch: BatchReport;
  onVerify: (verifiedBatch: BatchReport) => void;
  onBack: () => void;
}

export function AmountVerificationStep({ batch, onVerify, onBack }: AmountVerificationStepProps) {
  const [verifiedAmounts, setVerifiedAmounts] = useState({
    cash: batch.extracted_cash || 0,
    checks: batch.extracted_checks || 0,
    credit_cards: batch.extracted_credit_cards || 0,
    gift_certificates: batch.extracted_gift_certificates || 0,
    coupons: batch.extracted_coupons || 0,
    other: batch.extracted_other || 0
  });
  
  const [discrepancyExplanation, setDiscrepancyExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extractedAmounts = {
    cash: batch.extracted_cash || 0,
    checks: batch.extracted_checks || 0,
    credit_cards: batch.extracted_credit_cards || 0,
    gift_certificates: batch.extracted_gift_certificates || 0,
    coupons: batch.extracted_coupons || 0,
    other: batch.extracted_other || 0
  };

  const hasDiscrepancies = Object.keys(extractedAmounts).some(
    key => verifiedAmounts[key] !== extractedAmounts[key]
  );

  const calculateTotal = (amounts: any) => {
    return Object.values(amounts).reduce((sum: number, amount: number) => sum + amount, 0);
  };

  const handleVerification = async () => {
    if (hasDiscrepancies && !discrepancyExplanation.trim()) {
      toast.error('Please provide an explanation for the discrepancies');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/batch-reports/${batch.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified_amounts: verifiedAmounts,
          discrepancy_explanation: hasDiscrepancies ? discrepancyExplanation : null
        })
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result = await response.json();
      onVerify(result.data);
      
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify amounts');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Deposit Amounts</h2>
        <p className="text-gray-600">Compare extracted amounts with what's actually in your envelope</p>
      </div>

      {/* Extracted Information Summary */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Extracted from PDF</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-700">Date:</span>
            <p>{formatDate(batch.pdf_batch_date || batch.batch_date)}</p>
          </div>
          <div>
            <span className="font-medium text-blue-700">Location:</span>
            <p>{getLocationName(batch.pdf_location || batch.location)}</p>
          </div>
          <div>
            <span className="font-medium text-blue-700">Staff:</span>
            <p>{batch.pdf_staff_name || batch.staff_name}</p>
          </div>
          <div>
            <span className="font-medium text-blue-700">Batch ID:</span>
            <p>{batch.pdf_batch_id || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Amount Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Extracted Amounts */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted from PDF</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <AmountBreakdown amounts={extractedAmounts} readonly />
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal(extractedAmounts))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Amounts */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount in Envelope</h3>
          <div className="bg-white border rounded-lg p-6">
            <AmountBreakdown 
              amounts={verifiedAmounts}
              onChange={setVerifiedAmounts}
              editable
            />
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span className={hasDiscrepancies ? 'text-orange-600' : 'text-green-600'}>
                  {formatCurrency(calculateTotal(verifiedAmounts))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancy Summary */}
      {hasDiscrepancies && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
          <h4 className="text-lg font-semibold text-orange-900 mb-4">Discrepancies Detected</h4>
          <div className="space-y-2">
            {Object.keys(extractedAmounts).map(key => {
              const extracted = extractedAmounts[key];
              const verified = verifiedAmounts[key];
              const difference = verified - extracted;
              
              if (difference === 0) return null;
              
              return (
                <div key={key} className="flex justify-between items-center text-sm">
                  <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                  <span className={difference > 0 ? 'text-green-600' : 'text-red-600'}>
                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-orange-900 mb-2">
              Explanation Required:
            </label>
            <TextArea
              value={discrepancyExplanation}
              onChange={setDiscrepancyExplanation}
              placeholder="Please explain the differences between extracted and verified amounts..."
              rows={3}
              className="w-full"
              required
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Upload
        </Button>
        
        <Button 
          onClick={handleVerification}
          disabled={isSubmitting || (hasDiscrepancies && !discrepancyExplanation.trim())}
        >
          {isSubmitting ? 'Verifying...' : 'Verify & Generate Label'}
        </Button>
      </div>
    </div>
  );
}

function AmountBreakdown({ amounts, onChange, editable = false, readonly = false }) {
  const amountFields = [
    { key: 'cash', label: 'Cash', icon: '💵' },
    { key: 'checks', label: 'Checks', icon: '📄' },
    { key: 'credit_cards', label: 'Credit Cards', icon: '💳' },
    { key: 'gift_certificates', label: 'Gift Certificates', icon: '🎁' },
    { key: 'coupons', label: 'Coupons', icon: '🎫' },
    { key: 'other', label: 'Other', icon: '📋' }
  ];

  return (
    <div className="space-y-3">
      {amountFields.map(field => (
        <div key={field.key} className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{field.icon}</span>
            <span className="font-medium">{field.label}:</span>
          </div>
          
          {editable ? (
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amounts[field.key]}
              onChange={(value) => onChange({
                ...amounts,
                [field.key]: parseFloat(value) || 0
              })}
              className="w-24 text-right"
            />
          ) : (
            <span className="font-mono text-right">
              {formatCurrency(amounts[field.key] || 0)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function getLocationName(code: string): string {
  const locations = {
    'A2': 'Ann Arbor',
    'AA': 'Ann Arbor',
    'PY': 'Plymouth', 
    'WX': 'Wixom'
  };
  return locations[code] || code || 'Unknown';
}
```

### **Label Generation Component**
```typescript
'use client'

interface LabelGenerationStepProps {
  batch: BatchReport;
  onComplete: () => void;
  onBack: () => void;
}

export function LabelGenerationStep({ batch, onComplete, onBack }: LabelGenerationStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [labelData, setLabelData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [labelGenerated, setLabelGenerated] = useState(batch.label_generated || false);

  useEffect(() => {
    if (batch.label_generated) {
      loadExistingLabel();
    }
  }, [batch]);

  const loadExistingLabel = async () => {
    try {
      const response = await fetch(`/api/labels/batch/${batch.id}`);
      const result = await response.json();
      if (result.success) {
        setLabelData(result.data);
        setLabelGenerated(true);
      }
    } catch (error) {
      console.error('Failed to load existing label:', error);
    }
  };

  const generateLabel = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/labels/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_report_id: batch.id,
          template_id: selectedTemplate
        })
      });

      if (!response.ok) {
        throw new Error('Label generation failed');
      }

      const result = await response.json();
      setLabelData(result.data);
      setLabelGenerated(true);
      
      toast.success('Label generated successfully!');
      
    } catch (error) {
      console.error('Label generation error:', error);
      toast.error('Failed to generate label');
    } finally {
      setIsGenerating(false);
    }
  };

  const printLabel = async () => {
    if (!labelData) return;
    
    setIsPrinting(true);
    
    try {
      // Download label PDF for printing
      const response = await fetch(`/api/labels/download/${labelData.id}`);
      const blob = await response.blob();
      
      // Create temporary URL and trigger print
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
            window.URL.revokeObjectURL(url);
          };
        };
      }
      
      // Mark as printed in database
      await fetch(`/api/labels/print/${labelData.id}`, {
        method: 'POST'
      });
      
      toast.success('Label sent to printer!');
      
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print label');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Envelope Label</h2>
        <p className="text-gray-600">Create a professional label for your deposit envelope</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Label Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Label Preview</h3>
          
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 min-h-96">
            {labelGenerated && labelData ? (
              <LabelPreview data={labelData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <DocumentIcon className="h-16 w-16 mx-auto mb-4" />
                  <p>Label preview will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Label Configuration */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Label Configuration</h3>
          
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Template
              </label>
              <Select
                value={selectedTemplate}
                onChange={setSelectedTemplate}
                options={[
                  { value: 'standard', label: 'Standard Envelope Label' },
                  { value: 'detailed', label: 'Detailed Breakdown Label' },
                  { value: 'compact', label: 'Compact Label' }
                ]}
              />
            </div>

            {/* Batch Information Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Batch Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-mono">{formatDate(batch.pdf_batch_date || batch.batch_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-mono">{getLocationName(batch.pdf_location || batch.location)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Staff:</span>
                  <span className="font-mono">{batch.pdf_staff_name || batch.staff_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-mono font-semibold">{formatCurrency(batch.verified_total || 0)}</span>
                </div>
              </div>
            </div>

            {/* Discrepancy Information */}
            {batch.has_discrepancies && batch.discrepancy_explanation && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">Discrepancy Notes</h4>
                <p className="text-sm text-orange-800">{batch.discrepancy_explanation}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {!labelGenerated ? (
                <Button 
                  onClick={generateLabel}
                  disabled={isGenerating}
                  className="w-full"
                  variant="primary"
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating Label...
                    </>
                  ) : (
                    'Generate Label'
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button 
                    onClick={printLabel}
                    disabled={isPrinting}
                    className="w-full"
                    variant="primary"
                  >
                    {isPrinting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Printing...
                      </>
                    ) : (
                      'Print Label'
                    )}
                  </Button>
                  
                  <Button 
                    onClick={generateLabel}
                    disabled={isGenerating}
                    className="w-full"
                    variant="outline"
                  >
                    Regenerate Label
                  </Button>
                </div>
              )}
              
              {labelData && (
                <Button 
                  onClick={() => window.open(`/api/labels/download/${labelData.id}`, '_blank')}
                  className="w-full"
                  variant="outline"
                >
                  Download PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Back to Verification
        </Button>
        
        <Button 
          onClick={onComplete}
          disabled={!labelGenerated}
          variant="primary"
        >
          Complete Process
        </Button>
      </div>
    </div>
  );
}

function LabelPreview({ data }: { data: any }) {
  return (
    <div className="label-preview" style={{ 
      width: '4in', 
      height: '2in', 
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      border: '1px solid #ccc',
      padding: '8px',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
        DAILY DEPOSIT
      </div>
      
      {/* Batch Info */}
      <div style={{ fontSize: '8px', marginBottom: '8px' }}>
        Date: {formatDate(data.batch_date)} | Location: {data.location} | Staff: {data.staff_name}
      </div>
      
      {/* Amounts Table */}
      <table style={{ width: '100%', fontSize: '9px', marginBottom: '8px' }}>
        <tbody>
          <tr><td>Cash:</td><td style={{ textAlign: 'right' }}>${data.verified_cash?.toFixed(2) || '0.00'}</td></tr>
          <tr><td>Checks:</td><td style={{ textAlign: 'right' }}>${data.verified_checks?.toFixed(2) || '0.00'}</td></tr>
          <tr><td>Gift Certificates:</td><td style={{ textAlign: 'right' }}>${data.verified_gift_certificates?.toFixed(2) || '0.00'}</td></tr>
          <tr><td>Other:</td><td style={{ textAlign: 'right' }}>${data.verified_other?.toFixed(2) || '0.00'}</td></tr>
          <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold' }}>
            <td>TOTAL:</td>
            <td style={{ textAlign: 'right' }}>${data.verified_total?.toFixed(2) || '0.00'}</td>
          </tr>
        </tbody>
      </table>
      
      {/* Discrepancies */}
      {data.has_discrepancies && (
        <div style={{ fontSize: '7px', marginBottom: '6px' }}>
          <strong>Discrepancies Noted:</strong><br />
          {data.discrepancy_explanation}
        </div>
      )}
      
      {/* QR Code placeholder */}
      <div style={{ 
        position: 'absolute', 
        bottom: '8px', 
        right: '8px', 
        width: '25px', 
        height: '25px', 
        border: '1px solid #000',
        fontSize: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        QR
      </div>
    </div>
  );
}
```

---

## 📊 Real-time Features

### **Progress Tracking**
```typescript
'use client'

export function useProcessingStatus(batchId: string) {
  const [status, setStatus] = useState<BatchReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!batchId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/batch-reports/${batchId}`);
        const result = await response.json();
        setStatus(result.data);
      } catch (error) {
        console.error('Status check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 2 seconds if processing
    const interval = setInterval(() => {
      if (status?.processing_status === 'processing' || status?.pdf_parsing_status === 'pending') {
        checkStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [batchId, status?.processing_status, status?.pdf_parsing_status]);

  return { status, isLoading };
}

export function ProcessingStatusIndicator({ status }: { status: string }) {
  const statusConfig = {
    uploaded: { color: 'blue', label: 'Uploaded', icon: '📁' },
    processing: { color: 'yellow', label: 'Processing...', icon: '⚙️' },
    parsed: { color: 'green', label: 'Parsed', icon: '✅' },
    verified: { color: 'green', label: 'Verified', icon: '✓' },
    label_generated: { color: 'purple', label: 'Label Ready', icon: '🏷️' }
  };

  const config = statusConfig[status] || { color: 'gray', label: status, icon: '❓' };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${config.color}-100 text-${config.color}-800`}>
      <span className="mr-2">{config.icon}</span>
      {config.label}
    </div>
  );
}
```

---

## 🔄 API Integration

### **Client-Side API Calls**
```typescript
'use client'

export const batchApi = {
  // Upload and processing
  async uploadBatch(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/batch-reports/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  async getBatch(batchId: string) {
    const response = await fetch(`/api/batch-reports/${batchId}`);
    if (!response.ok) throw new Error('Failed to fetch batch');
    return response.json();
  },

  async verifyAmounts(batchId: string, verifiedAmounts: any, explanation?: string) {
    const response = await fetch(`/api/batch-reports/${batchId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verified_amounts: verifiedAmounts,
        discrepancy_explanation: explanation
      })
    });

    if (!response.ok) throw new Error('Verification failed');
    return response.json();
  },

  // Label operations
  async generateLabel(batchId: string, templateId: string) {
    const response = await fetch('/api/labels/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batch_report_id: batchId,
        template_id: templateId
      })
    });

    if (!response.ok) throw new Error('Label generation failed');
    return response.json();
  },

  async printLabel(labelId: string) {
    const response = await fetch(`/api/labels/print/${labelId}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Print request failed');
    return response.json();
  },

  async downloadLabel(labelId: string) {
    const response = await fetch(`/api/labels/download/${labelId}`);
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  }
};
```

---

## 🧪 Frontend Testing

### **Component Testing**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchCloseoutDashboard } from './BatchCloseoutDashboard';

describe('BatchCloseoutDashboard', () => {
  it('renders upload interface initially', () => {
    render(<BatchCloseoutDashboard />);
    expect(screen.getByText('Upload Batch Report')).toBeInTheDocument();
    expect(screen.getByText('Drop your PDF here')).toBeInTheDocument();
  });

  it('handles file upload correctly', async () => {
    const mockFile = new File(['test'], 'batch-report.pdf', { type: 'application/pdf' });
    
    render(<BatchCloseoutDashboard />);
    
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('batch-report.pdf')).toBeInTheDocument();
    });
  });

  it('validates file type and size', () => {
    const invalidFile = new File(['test'], 'document.txt', { type: 'text/plain' });
    
    render(<BatchCloseoutDashboard />);
    
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    expect(screen.getByText('Please upload a PDF file')).toBeInTheDocument();
  });
});

describe('AmountVerificationStep', () => {
  const mockBatch = {
    id: '1',
    extracted_cash: 100.00,
    extracted_checks: 50.00,
    extracted_total: 150.00
  };

  it('displays extracted amounts correctly', () => {
    render(<AmountVerificationStep batch={mockBatch} onVerify={jest.fn()} onBack={jest.fn()} />);
    
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('detects discrepancies and requires explanation', async () => {
    const mockOnVerify = jest.fn();
    
    render(<AmountVerificationStep batch={mockBatch} onVerify={mockOnVerify} onBack={jest.fn()} />);
    
    // Change verified amount
    const cashInput = screen.getByDisplayValue('100');
    fireEvent.change(cashInput, { target: { value: '90' } });
    
    // Try to verify without explanation
    const verifyButton = screen.getByText('Verify & Generate Label');
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please provide an explanation for the discrepancies')).toBeInTheDocument();
    });
    
    expect(mockOnVerify).not.toHaveBeenCalled();
  });
});
```

---

## 📈 Success Criteria

### **Frontend Launch Criteria**
- [ ] File upload interface supports drag & drop and validation
- [ ] PDF processing status displays real-time updates
- [ ] Amount verification form handles discrepancies correctly
- [ ] Label preview renders accurately before printing
- [ ] Print functionality works with common label printers
- [ ] Mobile responsive design tested on tablets
- [ ] Form validation provides clear error feedback

### **Frontend Success Metrics**
- File upload completes in <30 seconds for 10MB files
- PDF parsing status updates appear within 2 seconds
- Amount verification form validates in <100ms
- Label generation preview loads in <3 seconds
- Print queue processing completes in <15 seconds
- Mobile interface usable on 7" tablets
- Zero client-side JavaScript errors in production

---

*This frontend PRD provides comprehensive guidance for Terminal 1 to build all React components and user interfaces for the Batch Closeout application, with clear boundaries to prevent conflicts with Terminal 2's backend work.*