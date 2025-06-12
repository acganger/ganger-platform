# Updated PRD Template - Client-Server Integration Standards

## 🎯 **Key Changes to PRD Template**

The current PRD template is **excellent** but needs **critical additions** to prevent client-server integration issues. These updates ensure proper client-server boundaries are built into every new application from the start.

## 🔄 **Required Template Updates**

### **1. Add Client-Server Architecture Section**

**Insert after line 87 (App-Specific Technology):**

```markdown
---

## 🔄 Client-Server Integration Architecture

### **Client-Server Boundary Standards (MANDATORY)**

#### **Client-Side Code Patterns**
```typescript
// ✅ REQUIRED: All interactive React components
'use client'

import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from '@ganger/ui'; // ✅ Client-safe UI components
import { 
  ClientPaymentService, 
  ClientCommunicationService,
  ClientCacheService 
} from '@ganger/integrations/client'; // ✅ Client-only interfaces

// ✅ Allowed patterns:
const InteractiveComponent = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // ✅ API calls to server routes
    fetch('/api/data').then(res => res.json()).then(setData);
  }, []);
  
  // ✅ Browser APIs, event handlers, state management
  return <Button onClick={() => setData('updated')}>Update</Button>;
};
```

#### **Server-Side Code Patterns**
```typescript
// ✅ Server-only code (API routes, middleware)
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@ganger/db'; // ✅ Database access
import { 
  ServerPaymentService,
  ServerPdfService,
  ServerGoogleService 
} from '@ganger/integrations/server'; // ✅ Server-only services

// ✅ Allowed patterns:
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Database operations, external APIs, Node.js modules
  const data = await supabase.from('table').select('*');
  const pdfService = new ServerPdfService();
  
  res.json({ data });
}
```

#### **PROHIBITED Integration Patterns**
```typescript
// ❌ NEVER: Server imports in client components
'use client'
import { supabase } from '@ganger/db'; // ❌ Database in client
import { ServerPaymentService } from '@ganger/integrations/server'; // ❌ Server service in client

// ❌ NEVER: Missing 'use client' for interactive components  
import { useState } from 'react'; // ❌ React hooks without 'use client'

// ❌ NEVER: Direct external API calls in client
import { google } from 'googleapis'; // ❌ Node.js package in client
import Stripe from 'stripe'; // ❌ Server-side Stripe in client

// ❌ NEVER: Mixed client-server in same file
export function ClientComponent() { /* client code */ }
export async function serverAction() { /* server code */ } // ❌ Mixed boundaries
```

### **Integration Service Architecture**

#### **Required Service Separation**
```typescript
// Client services: API interfaces only
interface ClientServicePattern {
  async operation(data: any): Promise<Response> {
    // ✅ Only API calls to server routes
    return fetch('/api/service/operation', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Server services: Full implementation
interface ServerServicePattern {
  async operation(data: any): Promise<Result> {
    // ✅ Direct database access, external APIs, Node.js modules
    return await externalAPI.process(data);
  }
}
```

#### **API Route Requirements**
```typescript
// MANDATORY: All server operations must have API route wrappers
// apps/[app-name]/src/pages/api/[service]/[operation].ts
import { ServerServiceClass } from '@ganger/integrations/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const service = new ServerServiceClass();
  
  try {
    const result = await service.performOperation(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### **Package Export Verification**

#### **Required Package Structure**
```typescript
// packages/integrations/package.json
{
  "exports": {
    "./client": {
      "types": "./dist/client/index.d.ts",
      "default": "./dist/client/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "default": "./dist/server/index.js"  
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "default": "./dist/types/index.js"
    }
  }
}

// Client exports (browser-safe only)
// packages/integrations/src/client/index.ts
export { ClientPaymentService } from './payment-client';
export { ClientCommunicationService } from './communication-client';
// ✅ No Node.js dependencies

// Server exports (full Node.js access)  
// packages/integrations/src/server/index.ts
export { ServerPaymentService } from './payment-server';
export { ServerPdfService } from './pdf-service';
export { ServerGoogleService } from './google-service';
// ✅ Full Node.js, external API access
```

### **Next.js Configuration Standards**

#### **Required Webpack Configuration**
```javascript
// next.config.js - MANDATORY for all apps
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent Node.js modules in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false, crypto: false,
        stream: false, url: false, zlib: false, http: false,
        https: false, assert: false, os: false, path: false,
        dns: false, module: false, child_process: false
      };
      
      // External server-only packages
      config.externals = {
        ...config.externals,
        'puppeteer': 'puppeteer',
        'puppeteer-core': 'puppeteer-core', 
        'googleapis': 'googleapis',
        'ioredis': 'ioredis'
      };
    }
    return config;
  }
};
```

---
```

### **2. Update Required Shared Packages Section**

**Replace lines 57-70 with enhanced client-server awareness:**

```markdown
### **Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { /* ALL UI components */ } from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { 
  ClientCommunicationService, 
  ClientPaymentService,
  ClientCacheService 
} from '@ganger/integrations/client';
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { db, createClient, Repository } from '@ganger/db';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { 
  ServerCommunicationService,
  ServerPaymentService, 
  ServerPdfService,
  ServerGoogleService,
  ServerCacheService
} from '@ganger/integrations/server';
import { analytics, auditLog, healthCheck } from '@ganger/utils/server';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  User, Patient, Appointment, Provider,
  ApiResponse, PaginationMeta, ValidationRule
} from '@ganger/types';
```
```

### **3. Update Automated Quality Enforcement Section**

**Replace lines 72-81 with enhanced boundary verification:**

```markdown
### **Automated Quality Enforcement (CLIENT-SERVER BOUNDARIES)**
```bash
# Pre-commit hooks automatically enforce:
✅ TypeScript compilation (0 errors tolerance)
✅ Package boundary compliance (@ganger/* only)
✅ UI component compliance (no custom buttons/inputs)
✅ Authentication compliance (no custom auth)
✅ Performance budget compliance
✅ Security compliance (HIPAA + general)
✅ Client-server boundary verification (NEW)
✅ 'use client' directive validation (NEW)
✅ Server import prevention in client code (NEW)
✅ Package export structure validation (NEW)

# NEW: Client-Server Boundary Quality Gates
npm run audit:client-server-boundaries  # Detect boundary violations
npm run audit:use-client-directive      # Verify 'use client' usage
npm run audit:server-imports           # Prevent server imports in client
npm run audit:package-exports          # Validate export structure
```
```

### **4. Update Testing Strategy Section**

**Add after line 327 (Component Tests):**

```markdown
### **Client-Server Integration Tests (MANDATORY)**
```typescript
// Required test patterns for client-server boundaries
describe('Client-Server Integration', () => {
  test('Client components use only client-safe imports', () => {
    // Verify no server imports in client code
    expect(clientComponent).not.toImport('@ganger/db');
    expect(clientComponent).not.toImport('@ganger/integrations/server');
  });
  
  test('Server routes handle client requests properly', () => {
    // Verify API routes work with client service calls
    expect(apiRoute).toHandleClientRequest();
    expect(apiRoute).toReturnStandardResponse();
  });
  
  test('Package exports maintain boundaries', () => {
    // Verify package structure prevents cross-boundary imports
    expect('@ganger/integrations/client').not.toExportServerCode();
    expect('@ganger/integrations/server').not.toExportClientCode();
  });
});

Build Tests: Client-Server Verification (MANDATORY)
✅ All client components build without server imports
✅ All server code builds with full Node.js access
✅ Package exports maintain proper boundaries
✅ Webpack configuration prevents client-server leaks
```
```

### **5. Update Quality Gate Integration Section**

**Replace lines 331-339 with enhanced verification:**

```markdown
### **Enhanced Quality Gate Integration**
```bash
# Pre-commit verification (automatically runs):
✅ npm run test                        # All tests must pass
✅ npm run type-check                  # 0 TypeScript errors
✅ npm run test:performance            # Performance budget compliance
✅ npm run test:a11y                   # Accessibility compliance
✅ npm run audit:ui-compliance         # UI component usage verification
✅ npm run audit:auth-compliance       # Authentication pattern verification
✅ npm run audit:client-server-boundaries  # NEW: Client-server separation
✅ npm run audit:use-client-directive      # NEW: 'use client' validation
✅ npm run audit:integration-patterns      # NEW: Integration service verification

# Integration-specific verification
✅ npm run build:verify-boundaries     # Verify no server code in client bundles
✅ npm run test:integration-apis       # Verify client-server API communication
✅ npm run audit:package-exports       # Verify proper package structure
```
```

### **6. Add Integration Pattern Examples Section**

**Insert after line 413 (App-Specific Security):**

```markdown
---

## 🔌 Integration Pattern Examples

### **Payment Processing Pattern**
```typescript
// ✅ CLIENT: Payment component
'use client'
import { ClientPaymentService } from '@ganger/integrations/client';

const PaymentForm = () => {
  const paymentService = new ClientPaymentService();
  
  const handlePayment = async (paymentData) => {
    // ✅ API call to server
    const result = await paymentService.processPayment(paymentData);
    if (result.success) {
      showSuccessMessage('Payment processed');
    }
  };
};

// ✅ SERVER: Payment API route
// pages/api/payment/process.ts
import { ServerPaymentService } from '@ganger/integrations/server';

export default async function handler(req, res) {
  const paymentService = new ServerPaymentService();
  
  try {
    // ✅ Direct Stripe API access
    const result = await paymentService.processStripePayment(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### **PDF Generation Pattern**
```typescript
// ✅ CLIENT: PDF request component  
'use client'
import { ClientPdfService } from '@ganger/integrations/client';

const DocumentGenerator = () => {
  const pdfService = new ClientPdfService();
  
  const generatePDF = async (documentData) => {
    // ✅ API call to server for PDF generation
    const pdfUrl = await pdfService.generateDocument(documentData);
    window.open(pdfUrl); // Download PDF
  };
};

// ✅ SERVER: PDF generation API route
// pages/api/pdf/generate.ts
import { ServerPdfService } from '@ganger/integrations/server';

export default async function handler(req, res) {
  const pdfService = new ServerPdfService();
  
  try {
    // ✅ Direct Puppeteer access
    const pdfBuffer = await pdfService.generatePDF(req.body.template, req.body.data);
    
    // Upload to storage and return URL
    const pdfUrl = await uploadPdfToStorage(pdfBuffer);
    res.json({ success: true, url: pdfUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### **Communication Pattern**
```typescript
// ✅ CLIENT: Communication interface
'use client'
import { ClientCommunicationService } from '@ganger/integrations/client';

const NotificationSender = () => {
  const commService = new ClientCommunicationService();
  
  const sendNotification = async (recipient, message) => {
    // ✅ API call to server
    const success = await commService.sendSMS(recipient, message);
    if (success) showSuccess('Message sent');
  };
};

// ✅ SERVER: Communication API route
// pages/api/communication/sms.ts
import { ServerCommunicationService } from '@ganger/integrations/server';

export default async function handler(req, res) {
  const commService = new ServerCommunicationService();
  
  try {
    // ✅ Direct Twilio API access
    const result = await commService.sendTwilioSMS(req.body.to, req.body.message);
    res.json({ success: true, messageId: result.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

---
```

## 🎯 **Implementation Strategy**

### **Immediate Actions (Next PRD Creation)**

1. **Use updated template** with client-server integration standards
2. **Include boundary verification** in development planning
3. **Plan API routes** for all server-side operations
4. **Design client interfaces** for all integration services

### **Developer Training Points**

1. **Always separate** client and server concerns from day 1
2. **Use 'use client'** for all interactive React components
3. **Create API routes** for all server-side operations
4. **Import from correct packages** (client vs server)
5. **Verify boundaries** before claiming completion

### **Quality Assurance Integration**

1. **Automated boundary checking** in pre-commit hooks
2. **Build verification** to catch client-server leaks
3. **Integration testing** to verify API communication
4. **Package structure validation** to maintain boundaries

## 💡 **Key Benefits**

### **Prevention of Integration Issues**
- **No more build failures** due to server imports in client code
- **Clear patterns** prevent developer confusion
- **Automated verification** catches issues early
- **Consistent architecture** across all applications

### **Development Efficiency**
- **Faster development** with clear boundaries
- **Fewer debugging sessions** tracking down integration issues
- **Better code organization** with proper separation
- **Easier maintenance** with predictable patterns

### **Production Reliability**
- **Working builds** lead to working deployments
- **Proper error handling** at API boundaries
- **Better performance** with optimized client bundles
- **Easier troubleshooting** with clear client-server separation

---

*These updates ensure every new PRD includes proper client-server integration planning from the start, preventing the build issues and integration problems that have been occurring in development.*