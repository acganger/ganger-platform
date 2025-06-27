# 🧾 Product Requirements Document: Intelligent Thermal Checkout Slips

**PRD ID**: PRD-CHECKOUT-002  
**Status**: Ready for Development  
**App Folder**: `apps/checkout-slips`  
**Category**: Medical Operations  
**Last Updated**: January 2025  
**Architecture**: Staff Portal Integrated Application  

---

## 🚨 CRITICAL: Platform Integration Requirements

### Mandatory Platform Standards
This application MUST follow the Ganger Platform standards. Before starting development:

1. **Read These Documents First**:
   - `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Platform standards (MANDATORY)
   - `/true-docs/FRONTEND_DEVELOPMENT_GUIDE.md` - UI development patterns
   - `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md` - API and database patterns
   - `/true-docs/deployment/README.md` - Vercel deployment strategy

2. **Required Architecture**:
   - **Authentication**: `@ganger/auth` (Google OAuth only - NO custom auth)
   - **UI Components**: `@ganger/ui` exclusively (NO custom components)
   - **Database**: `@ganger/db` with Supabase
   - **Staff Portal**: MUST integrate with `StaffPortalLayout`
   - **TypeScript**: Zero compilation errors required

3. **Staff Portal URL**: `https://staff.gangerdermatology.com/checkout-slips`

---

## 1. 🎯 Objective

Replace batch-printed, quarter-sheet checkout slips with dynamic, real-time thermal printouts using Zebra ZD621 printers integrated into the Ganger Platform. The system will:

- Pre-populate personalized patient data from existing database
- Print slips **before visits** for provider markup during encounters
- Ensure checkout staff have **clear, actionable instructions** post-visit
- Support multiple slip types (Medical, Cosmetic, Self-Pay)
- Provide real-time print confirmation with error handling
- Integrate seamlessly with existing staff workflows

---

## 2. 🏗️ Technical Architecture

### Application Structure
```
apps/checkout-slips/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── layout.tsx          # StaffPortalLayout integration
│   │   ├── page.tsx            # Main checkout slip interface
│   │   └── api/
│   │       ├── print/route.ts  # Print job API endpoint
│   │       └── slips/route.ts  # Slip generation API
│   ├── components/
│   │   ├── SlipSelector.tsx    # UI for selecting slip type
│   │   ├── SlipPreview.tsx     # On-screen slip preview
│   │   ├── PrintStatus.tsx     # Print confirmation UI
│   │   └── PatientSearch.tsx   # Patient lookup interface
│   ├── lib/
│   │   ├── zebra/              # Zebra printer integration
│   │   │   ├── client.ts       # Zebra SDK wrapper
│   │   │   └── templates.ts    # ZPL template generator
│   │   └── slips/              # Slip business logic
│   │       ├── generator.ts    # Slip content generation
│   │       └── types.ts        # TypeScript definitions
│   └── hooks/
│       └── usePrinter.ts       # Printer status hook
├── public/
│   └── slip-templates/         # Visual templates
├── package.json
├── next.config.js              # Standard Vercel config
└── README.md                   # App-specific documentation
```

### Required Dependencies
```json
{
  "dependencies": {
    "@ganger/ui": "workspace:*",
    "@ganger/auth": "workspace:*",
    "@ganger/db": "workspace:*",
    "@ganger/types": "workspace:*",
    "@ganger/utils": "workspace:*",
    "@ganger/integrations": "workspace:*",
    "next": "^14.2.0",
    "react": "^18.3.1",
    "@types/react": "^18.3.0",
    "typescript": "^5.3.0"
  }
}
```

### Database Schema
```sql
-- Checkout slip templates table
CREATE TABLE checkout_slip_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_type TEXT NOT NULL CHECK (slip_type IN ('medical', 'cosmetic', 'self_pay')),
  version INTEGER NOT NULL DEFAULT 1,
  template_data JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Print job tracking
CREATE TABLE checkout_slip_print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  provider_id UUID REFERENCES providers(id) NOT NULL,
  location_id UUID REFERENCES locations(id) NOT NULL,
  slip_type TEXT NOT NULL,
  slip_content JSONB NOT NULL,
  printer_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'completed', 'failed')),
  error_message TEXT,
  printed_at TIMESTAMPTZ,
  printed_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE checkout_slip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_slip_print_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view all templates" ON checkout_slip_templates
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role != 'user'));

CREATE POLICY "Staff can view print jobs" ON checkout_slip_print_jobs
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role != 'user'));
```

---

## 3. 🎨 User Interface Requirements

### Main Interface Components

Using ONLY `@ganger/ui` components:

```typescript
'use client'

import { 
  Card, 
  Button, 
  Select, 
  Input, 
  DataTable,
  LoadingSpinner,
  SuccessToast,
  ErrorAlert,
  Modal
} from '@ganger/ui';
import { StaffPortalLayout } from '@ganger/ui/staff';
import { useStaffAuth } from '@ganger/auth/staff';
import { formatDate } from '@ganger/utils/client';

export default function CheckoutSlipsApp() {
  const { user, isAuthenticated } = useStaffAuth();
  
  if (!isAuthenticated) {
    return <StaffLoginRedirect appName="checkout-slips" />;
  }
  
  return (
    <StaffPortalLayout currentApp="checkout-slips">
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-6">Checkout Slip Printing</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <Card>
            <PatientSearch />
          </Card>
          
          {/* Slip Configuration */}
          <Card>
            <SlipTypeSelector />
            <PrinterSelector />
          </Card>
        </div>
        
        {/* Preview Section */}
        <Card className="mt-6">
          <SlipPreview />
          <PrintControls />
        </Card>
        
        {/* Recent Print Jobs */}
        <Card className="mt-6">
          <RecentPrintJobs />
        </Card>
      </main>
    </StaffPortalLayout>
  );
}
```

### UI Flow
1. **Patient Selection**: Search or scan barcode to select patient
2. **Auto-Population**: System fetches patient data, provider, last visit, balance
3. **Slip Type Selection**: Medical, Cosmetic, or Self-Pay
4. **Preview**: Show formatted slip on screen
5. **Print**: Send to selected Zebra printer
6. **Confirmation**: Show success/error status

---

## 4. 🖨️ Zebra Printer Integration

### Printer Configuration
```typescript
// Use @ganger/integrations for external hardware
import { UniversalPrintHub } from '@ganger/integrations/server';

const printHub = new UniversalPrintHub({
  printerType: 'zebra',
  model: 'ZD621',
  connectivity: 'network'
});

// Printer locations (use platform constants)
import { LOCATIONS } from '@ganger/types/constants';

const PRINTER_CONFIG = {
  'ann-arbor': { ip: '192.168.1.100', name: 'ZD621-AA' },
  'wixom': { ip: '192.168.1.101', name: 'ZD621-WX' },
  'plymouth': { ip: '192.168.1.102', name: 'ZD621-PL' }
};
```

### ZPL Template Generation
```typescript
// Generate ZPL for thermal printing
function generateCheckoutSlipZPL(data: SlipData): string {
  const { patient, provider, slipType, content } = data;
  
  return `
    ^XA
    ^FO50,50^A0N,30,30^FDGanger Dermatology^FS
    ^FO50,100^A0N,25,25^FD${slipType.toUpperCase()} CHECKOUT SLIP^FS
    ^FO50,150^GB700,3,3^FS
    
    ^FO50,180^A0N,20,20^FDPatient: ${patient.name}^FS
    ^FO50,210^A0N,20,20^FDDOB: ${formatDate(patient.dob)}^FS
    ^FO50,240^A0N,20,20^FDProvider: ${provider.name}^FS
    
    ${generateSlipContent(content)}
    
    ^XZ
  `;
}
```

---

## 5. 🔒 Security & Compliance

### HIPAA Compliance Requirements
- All print jobs must be audit logged with `@ganger/utils/server` auditLog
- Patient data must use Row Level Security in Supabase
- No patient data stored in browser localStorage
- Print confirmation must not expose PHI in logs

### Authentication & Authorization
```typescript
// API Route Protection
import { withAuth } from '@ganger/auth/server';

export default withAuth(async function handler(req, res) {
  // Only staff can print slips
  if (!['staff', 'manager', 'provider', 'nurse', 'medical_assistant'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Audit log the print action
  await auditLog({
    action: 'checkout_slip_printed',
    resourceType: 'patient_document',
    resourceId: req.body.patientId,
    userId: req.user.id,
    metadata: {
      slipType: req.body.slipType,
      printerId: req.body.printerId
    }
  });
  
  // Process print job...
}, { requiredRole: 'staff' });
```

---

## 6. 🚀 Development Checklist

### Pre-Development Setup
- [ ] Create app directory: `mkdir -p apps/checkout-slips`
- [ ] Copy standard Next.js structure from existing app
- [ ] Add to staff portal navigation in `packages/ui/src/staff/StaffPortalLayout.tsx`
- [ ] Install required dependencies with `pnpm install`

### Development Phase
- [ ] Implement patient search using existing `@ganger/db` queries
- [ ] Create slip preview components using `@ganger/ui` only
- [ ] Implement Zebra printer integration via `@ganger/integrations`
- [ ] Add print job tracking to database
- [ ] Create API endpoints with proper authentication
- [ ] Implement audit logging for all print actions

### Quality Gates (MUST PASS)
- [ ] `pnpm type-check` - Zero TypeScript errors
- [ ] `pnpm lint` - No linting errors
- [ ] `pnpm build` - Successful production build
- [ ] `pnpm test` - All tests pass
- [ ] Performance budget: <2s load time, <500KB bundle

### Deployment
- [ ] Add to Vercel as `ganger-checkout-slips` project
- [ ] Configure environment variables in Vercel dashboard
- [ ] Update staff portal rewrites to include `/checkout-slips`
- [ ] Deploy via `git push origin main` (GitHub integration)

---

## 7. 📋 Slip Content Specifications

### Medical Slip Data Structure
```typescript
interface MedicalSlip {
  patientInfo: {
    name: string;
    dob: Date;
    mrn: string;
    insurance: string;
    copay?: number;
    balance?: number;
  };
  visitInfo: {
    date: Date;
    provider: string;
    location: string;
    visitType: string;
  };
  followUp: {
    interval: '1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | 'PRN';
    reason: string;
    withProvider?: string;
  };
  procedures: string[];
  cosmeticInterest?: string[];
}
```

### Cosmetic Slip Data Structure
```typescript
interface CosmeticSlip {
  patientInfo: MedicalSlip['patientInfo'];
  visitInfo: MedicalSlip['visitInfo'];
  treatments: {
    botox?: {
      units: number;
      areas: string[];
    };
    filler?: {
      type: string;
      amount: string;
      areas: string[];
    };
  };
  products: {
    name: string;
    quantity: number;
    price: number;
  }[];
  returnPlan: '1W' | '2W' | '1M' | '3M' | '6M';
}
```

### Self-Pay Addendum Structure
```typescript
interface SelfPayAddendum {
  procedures: {
    cptCode: string;
    description: string;
    standardPrice: number;
  }[];
  disclaimer: string; // "Office prices subject to change"
}
```

### Print Confirmation States
```typescript
// Use @ganger/ui components for status display
<PrintStatus status={printJob.status}>
  {printJob.status === 'completed' && (
    <SuccessToast message="Slip printed successfully" />
  )}
  {printJob.status === 'failed' && (
    <ErrorAlert 
      message="Print failed" 
      details={printJob.error}
      onRetry={() => retryPrint(printJob.id)}
    />
  )}
</PrintStatus>
```

---

## 8. 📆 Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Setup** | 2 days | Create app structure, add to platform navigation, setup database tables |
| **Core UI** | 3 days | Patient search, slip selector, preview interface using @ganger/ui |
| **Printer Integration** | 3 days | Zebra SDK integration, ZPL template generation, network printing |
| **API Development** | 2 days | Print endpoints, authentication, audit logging |
| **Testing** | 3 days | Unit tests, integration tests, printer hardware testing |
| **Deployment** | 1 day | Vercel deployment, staff portal integration, production testing |

**Total**: ~2 weeks for MVP

---

## 9. ✅ Action Items for Developer

### Immediate Actions
1. [ ] Read all referenced platform documentation
2. [ ] Set up local development environment with `pnpm install`
3. [ ] Create `apps/checkout-slips` directory structure
4. [ ] Review existing apps (e.g., `apps/inventory`) for patterns

### Development Start
1. [ ] Implement basic UI with `StaffPortalLayout` integration
2. [ ] Connect to patient data using `@ganger/db`
3. [ ] Create slip preview functionality
4. [ ] Test with mock printer before hardware integration

### Resources
- **Slack Channel**: #tech-team for questions
- **Example App**: `apps/inventory` for similar data display patterns
- **Printer Docs**: Zebra Link-OS SDK documentation
- **Platform Expert**: Refer to CLAUDE.md for infrastructure questions

---

## 10. 🔮 Future Enhancements (Post-MVP)

- **Batch Printing**: Print multiple slips for morning huddle
- **Mobile Support**: Responsive design for tablets in exam rooms
- **Template Editor**: Admin interface to modify slip layouts
- **Analytics Dashboard**: Track slip usage and reprint rates
- **Integration**: Connect to appointment system for auto-generation
- **Signature Capture**: Add eSign for financial responsibility

---

## 11. 📄 Reference Files

Current checkout slip examples are available at:
```
Q:\Projects\ganger-platform\PRDs\PRD Support Files\checkout-slips\
├── Medical_Checkout_Slip.pdf
├── Cosmetic_Checkout_Slip.pdf  
└── Self_Pay_Addendum.pdf
```

Review these files to understand the current layout and content requirements.

---

**This PRD follows all Ganger Platform standards and provides a clear implementation path. Start by reading the platform documentation, then follow the development checklist.**