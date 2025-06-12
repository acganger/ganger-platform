# Rapid Custom Handouts Generator

**Ganger Platform - Phase 1 Application**

A comprehensive patient education handout generation system with QR code scanning, digital delivery, and template management built with Next.js and the Ganger Platform shared infrastructure.

## 🎯 Purpose

Enable medical assistants to instantly generate personalized patient handouts by scanning QR codes, selecting relevant materials, generating customized PDFs, and offering digital delivery via SMS or email in addition to printing.

## 🏗️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase PostgreSQL + Edge Functions
- **PDF Generation**: jsPDF with custom template engine
- **QR Scanning**: QuaggaJS for camera-based scanning
- **Digital Delivery**: SendGrid (email) + Twilio (SMS)
- **Authentication**: Google OAuth (@gangerdermatology.com)
- **Styling**: Tailwind CSS + Ganger Design System
- **Deployment**: Cloudflare Workers (static export)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project setup
- Google OAuth credentials
- SendGrid API key (for email delivery)
- Twilio credentials (for SMS delivery)

### Development Setup

```bash
# Install dependencies (from monorepo root)
npm install

# Start development server
npm run dev:handouts

# Or run from this directory
cd apps/handouts
npm run dev
```

The application will be available at http://localhost:3002

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
apps/handouts/
├── src/
│   ├── pages/           # Next.js pages
│   │   ├── generate/    # Main handout generation workflow
│   │   ├── auth/        # Authentication pages
│   │   └── api/         # API routes (if needed)
│   ├── components/      # App-specific components
│   │   ├── QRScanner.tsx         # Camera-based QR code scanning
│   │   ├── TemplateSelector.tsx  # Template selection interface
│   │   ├── PatientInfo.tsx       # Patient information display
│   │   └── DeliveryOptions.tsx   # Digital delivery configuration
│   ├── lib/            # Utilities and configurations
│   │   ├── handout-context.tsx  # Global state management
│   │   ├── pdf-service.ts       # PDF generation and delivery
│   │   └── supabase.ts          # Database client
│   ├── hooks/          # Custom React hooks
│   │   └── useHandoutGenerator.ts # Handout generation logic
│   ├── types/          # TypeScript type definitions
│   │   └── handouts.ts          # Handout-specific types
│   ├── templates/      # Template assets and definitions
│   └── styles/         # Global styles
├── public/             # Static assets
└── README.md          # This file
```

## 🧩 Features

### Core Functionality
- ✅ QR code scanning for patient identification
- ✅ Manual MRN lookup with ModMed integration
- ✅ Template selection with category filtering
- ✅ Real-time PDF generation with jsPDF
- ✅ Multi-channel delivery (print, email, SMS)
- ✅ Patient consent management for digital delivery
- ✅ Secure download links with expiration
- ✅ Delivery status tracking and analytics

### Template Engine
- **Static Templates**: Simple educational content
- **Dynamic Templates**: Fill-in-the-blank fields
- **Conditional Templates**: Complex checkbox-based content inclusion
- **Variable Substitution**: Patient and provider information
- **Medical Formatting**: Professional document layout

### User Roles & Permissions
- **Staff**: Generate handouts, scan QR codes, digital delivery
- **Clinical Staff**: Generate handouts, template selection
- **Manager**: Template management, analytics, approval workflow
- **Superadmin**: System administration, template editing

## 🔌 Shared Package Integration

This application utilizes the Ganger Platform shared packages:

```typescript
import { Button, Card, DataTable, LoadingSpinner } from '@ganger/ui';
import { useAuth, withAuth } from '@ganger/auth'; 
import { db, HandoutTemplate } from '@ganger/db';
import { EmailService, SMSService } from '@ganger/integrations';
import { analytics, notifications } from '@ganger/utils';
```

## 🗄️ Database Schema

Uses shared database tables plus handout-specific tables:

- `handout_templates` - Template definitions with conditional logic
- `template_variables` - Dynamic field definitions
- `template_conditional_blocks` - Conditional content blocks
- `generated_handouts` - Generation history and delivery tracking
- `patient_qr_codes` - QR code mappings for quick scanning
- `handout_delivery_logs` - Digital delivery tracking
- `patient_communication_preferences` - Consent and preferences

## 📱 User Workflow

### 1. Patient Identification
- **QR Code Scanning**: Camera-based scanning with visual guides
- **Manual MRN Entry**: Keyboard input with ModMed lookup
- **Patient Verification**: Display patient information for confirmation

### 2. Template Selection
- **Category Filtering**: Education, Treatment, Medication, Procedures
- **Search Functionality**: Find templates by name or condition
- **Complexity Indicators**: Simple, Moderate, Complex templates
- **Digital Delivery**: Enable/disable per template

### 3. Delivery Configuration
- **Print Option**: Queue for immediate patient pickup
- **Email Delivery**: PDF attachments with patient consent
- **SMS Delivery**: Secure download links with expiration
- **Contact Verification**: Update patient email/phone if needed

### 4. Generation & Delivery
- **Real-time PDF**: Generate using jsPDF with medical formatting
- **Multi-channel Delivery**: Simultaneous print, email, and SMS
- **Status Tracking**: Real-time delivery confirmation
- **Patient Engagement**: Track downloads and interactions

## 🔒 Security & Compliance

- **Authentication**: Google OAuth with domain restriction
- **Authorization**: Role-based access control
- **HIPAA Compliance**: Encrypted PHI, audit logging, secure communications
- **Digital Delivery Security**: End-to-end encryption, secure download tokens
- **Patient Consent**: Explicit consent collection and tracking
- **Data Retention**: 7-year retention per medical records requirements

## 📊 Analytics & Monitoring

- **Generation Metrics**: Handouts created, templates used, delivery methods
- **Digital Adoption**: Email vs SMS vs print preferences
- **Patient Engagement**: Download rates, time to access, repeat access
- **Staff Productivity**: Generation times, templates per session
- **Template Effectiveness**: Most/least used templates by condition

## 🧪 Testing

```bash
# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Test Coverage
- **QR Code Scanning**: Various lighting conditions and angles
- **PDF Generation**: Template rendering with patient data
- **Digital Delivery**: Email and SMS delivery success rates
- **Template Processing**: Conditional logic and variable substitution
- **Patient Consent**: Workflow validation and compliance

## 🚀 Deployment

Automated deployment via GitHub Actions to Cloudflare Workers:

1. **Staging**: Deploy to `handouts-staging.pages.dev` on `staging` branch
2. **Production**: Deploy to `handouts.gangerdermatology.com` on `main` branch

## 🔄 Legacy System Migration

This application replaces the 2016 PHP handout generator with:

- **Modern Architecture**: React/Next.js vs PHP with mPDF
- **Enhanced Templates**: Conditional logic vs static fill-in-the-blank
- **Digital Delivery**: Email/SMS vs print-only
- **Real-time Generation**: < 3 seconds vs 10+ seconds
- **Mobile Responsive**: Touch-friendly tablet interface
- **Advanced Security**: Modern encryption and compliance features

### Migrated Templates
- **acne-handout-kf.json**: Complex conditional handout (14 blocks)
- **acne-treatment-regimen.json**: Treatment protocol with dropdowns
- **sun-protection-recommendations.json**: Educational content
- **patch-testing.json**: Pre-procedure instructions
- **vinegar-soak-nails.json**: Simple treatment recipe
- And 3 additional templates with preserved medical accuracy

## 📈 Success Metrics

- **Efficiency**: 80% reduction in handout preparation time
- **Accuracy**: 95% accuracy in patient information insertion
- **Digital Adoption**: 60% digital delivery adoption rate
- **Staff Adoption**: 90% staff adoption within 30 days
- **Cost Savings**: 50% reduction in printing costs

## 🔧 Configuration

Environment variables required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
MODMED_API_URL=https://api.modmed.com/fhir/r4
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SECURE_DOWNLOAD_BASE_URL=https://handouts.gangerdermatology.com/download
```

## 📚 Documentation

- [Template Engine Guide](./docs/template-engine.md)
- [PDF Generation API](./docs/pdf-generation.md)  
- [Digital Delivery Setup](./docs/digital-delivery.md)
- [QR Code Implementation](./docs/qr-scanning.md)
- [Migration Guide](./docs/migration.md)

---

**Part of the Ganger Platform - Modern Healthcare Technology Solutions**