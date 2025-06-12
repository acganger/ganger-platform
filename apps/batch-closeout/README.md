# Batch Closeout & Label Generator

A Next.js application for processing ModMed batch reports and generating professional envelope labels for deposit processing at Ganger Dermatology.

## Features

- **PDF Upload & Processing**: Upload ModMed batch reports (PDF format) with automatic text extraction
- **Amount Verification**: Staff verification of extracted payment amounts with discrepancy tracking
- **Professional Label Generation**: Generate envelope labels with QR codes for batch tracking
- **Real-time Analytics**: Dashboard with processing statistics and alerts
- **Audit Trail**: Complete logging of all actions for compliance and tracking

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with App Router
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Google OAuth via @ganger/auth
- **File Processing**: PDF.js for text extraction
- **Label Generation**: jsPDF with QR code support
- **Testing**: Jest with React Testing Library

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Build for production
npm run build
```

## API Endpoints

- `POST /api/batch-reports/upload` - Upload new batch report PDF
- `POST /api/batch-reports/[id]/verify` - Verify extracted amounts
- `POST /api/batch-reports/[id]/generate-label` - Generate envelope label
- `GET /api/analytics/dashboard` - Get dashboard statistics

## Database Tables

- `batch_reports` - Main batch processing records
- `batch_discrepancies` - Amount variance tracking
- `generated_envelope_labels` - Label generation history
- `envelope_label_templates` - Label layout templates
- `pdf_parsing_patterns` - Text extraction patterns
- `batch_system_config` - Application configuration

## Workflow

1. **Upload**: Staff uploads ModMed PDF batch report
2. **Processing**: Automatic text extraction to identify amounts and metadata
3. **Verification**: Staff verifies extracted amounts, notes any discrepancies
4. **Label Generation**: Professional envelope label created with QR tracking code
5. **Completion**: Label printed for physical deposit processing

## Security & Compliance

- Role-based access control (staff, manager, superadmin)
- Complete audit logging for all actions
- Secure file storage in Supabase
- HIPAA-compliant data handling
- Input validation and sanitization

## Configuration

The application uses environment variables for configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deployment

This application is designed to be deployed as part of the Ganger Platform monorepo using Cloudflare Workers/Pages.

Built with ❤️ for Ganger Dermatology