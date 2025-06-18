# PRD - Platform Stability Package
*Comprehensive integration stability improvements: Google Sheets, PDF Generation, and Redis Caching fixes*

**📚 CRITICAL REFERENCE:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: Platform Stability Package (Integration Fixes)
- **Package Name**: `@ganger/integrations`
- **PRD ID**: PRD-STABILITY-001
- **Priority**: Critical
- **Development Timeline**: 6-8 days (combined from 2-3 + 2-3 + 3-4 days)
- **Terminal Assignment**: Backend Terminal (Server-side integration fixes)
- **Dependencies**: `@ganger/integrations`, `@ganger/utils`, `@ganger/db`, `@ganger/auth`
- **MCP Integration Requirements**: Google Sheets MCP, Time MCP for Redis TTL management
- **Quality Gate Requirements**: TypeScript compilation success, bundle size verification, production build validation
- **Last Updated**: January 7, 2025

---

## 🎯 Product Overview

### **Purpose Statement**
Resolve critical TypeScript compilation errors and build failures across Google Sheets, PDF Generation, and Redis Caching integrations by implementing proper client-server separation and removing heavy server dependencies from client bundles.

### **Target Users**
- **Primary**: Development Team - Eliminate build blockers and compilation errors
- **Secondary**: All Platform Applications - Reliable integration services
- **Tertiary**: End Users - Improved performance through optimized bundle sizes

### **Success Metrics**
- **TypeScript Compilation**: 100% error-free compilation across all packages
- **Bundle Size Reduction**: 60-80% reduction in client bundle sizes (googleapis, puppeteer, ioredis removal)
- **Build Success Rate**: 100% successful production builds for all applications
- **Integration Reliability**: 99.9% uptime for fixed integration services
- **Performance Improvement**: 40-60% faster initial page load times

### **Business Value Measurement**
- **Development Velocity**: 300% faster development cycles (no compilation errors)
- **Cost Savings**: $12,000/month in reduced debugging time (8 hours/week at $75/hour across team)
- **User Experience**: 2-3 second faster page loads through optimized bundles
- **Platform Reliability**: Zero integration-related deployment failures

---

## 🏗️ Technical Architecture

### **MANDATORY: Cloudflare Workers Architecture**
```yaml
# ✅ REQUIRED: Workers-only deployment (Pages is sunset)
Framework: Next.js 14+ with Workers runtime (runtime: 'edge')
Deployment: Cloudflare Workers (NO Pages deployment)
Build Process: @cloudflare/next-on-pages with optimized bundles
Configuration: Workers-compatible next.config.js (NO static export)

# ❌ FORBIDDEN: These patterns cause bundle bloat and compilation errors
Client_Heavy_Dependencies: googleapis, puppeteer, ioredis in client code
Static_Export: Never use output: 'export'
Mixed_Import_Patterns: Server dependencies in client components
```

### **Client-Server Separation Architecture**
```typescript
// ✅ MANDATORY PATTERN: Universal Hub Architecture

// 1. CLIENT-SIDE COMPONENTS (Browser-safe)
'use client'
import { 
  ClientGoogleService,
  ClientPdfService, 
  ClientCacheService 
} from '@ganger/integrations/client';

// 2. SERVER-SIDE API ROUTES (Node.js runtime)
import { 
  ServerGoogleService,
  ServerPdfService,
  ServerCacheService 
} from '@ganger/integrations/server';

// 3. UNIVERSAL HUBS (Framework-agnostic interfaces)
import { 
  UniversalGoogleHub,
  UniversalPdfHub,
  UniversalCacheHub 
} from '@ganger/integrations';
```

### **Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { 
  DataTable, Button, Modal, FormField, LoadingSpinner,
  StatusIndicator, ProgressBar 
} from '@ganger/ui';
import { useAuth } from '@ganger/auth/client';
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { db } from '@ganger/db';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { 
  auditLog, 
  ServerGoogleService,
  ServerPdfService,
  ServerCacheService,
  UniversalIntegrationHub
} from '@ganger/utils/server';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  User, GoogleSheetsData, PdfGenerationRequest, CacheEntry,
  ApiResponse, IntegrationStatus 
} from '@ganger/types';
```

---

## 🔧 Integration Fix Specifications

### **1. Google Sheets Integration Fix**

#### **Problem Statement**
```bash
# Current errors blocking compilation:
❌ Module not found: Can't resolve 'googleapis' in client components
❌ Critical dependency warnings from googleapis heavy imports
❌ Bundle size exceeding 10MB due to googleapis inclusion
❌ Edge runtime incompatibility with Node.js-specific googleapis modules
```

#### **Solution Architecture**
```typescript
// ✅ FIXED PATTERN: Client-Server Separation

// CLIENT-SIDE (Browser)
'use client'
import { ClientGoogleService } from '@ganger/integrations/client';

export function SheetsDataComponent() {
  const [data, setData] = useState(null);
  
  const fetchSheetsData = async () => {
    // ✅ CLIENT: API call to server endpoint
    const response = await ClientGoogleService.getSheetData({
      spreadsheetId: 'sheet-id',
      range: 'A1:Z100'
    });
    setData(response.data);
  };
  
  return <DataTable data={data} onRefresh={fetchSheetsData} />;
}

// SERVER-SIDE (API Route)
import { ServerGoogleService } from '@ganger/integrations/server';
import { google } from 'googleapis'; // ✅ SERVER ONLY

export async function GET(request: Request) {
  // ✅ SERVER: Direct googleapis integration
  const sheets = google.sheets({ version: 'v4', auth: serviceAccount });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });
  
  return Response.json({ data: result.data.values });
}
```

#### **Implementation Steps**
1. **Move googleapis to server-only**: Remove all client-side googleapis imports
2. **Create Universal Hub**: `UniversalGoogleHub` for standardized interface
3. **Client Service Layer**: `ClientGoogleService` with API call methods
4. **Server Service Layer**: `ServerGoogleService` with direct googleapis integration
5. **Type Safety**: Shared TypeScript interfaces for data consistency

### **2. PDF Generation Integration Fix**

#### **Problem Statement**
```bash
# Current errors blocking compilation:
❌ Module not found: Can't resolve 'puppeteer' in client components
❌ Critical dependency warnings from chromium binaries
❌ Bundle size exceeding 15MB due to puppeteer inclusion
❌ Edge runtime incompatibility with browser automation dependencies
```

#### **Solution Architecture**
```typescript
// ✅ FIXED PATTERN: Server-Only PDF Generation

// CLIENT-SIDE (Browser)
'use client'
import { ClientPdfService } from '@ganger/integrations/client';

export function ReportGenerator() {
  const [generating, setGenerating] = useState(false);
  
  const generatePdf = async (reportData: ReportData) => {
    setGenerating(true);
    
    // ✅ CLIENT: Request PDF generation from server
    const response = await ClientPdfService.generateReport({
      template: 'patient-handout',
      data: reportData,
      options: { format: 'A4', orientation: 'portrait' }
    });
    
    // ✅ CLIENT: Download generated PDF
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    setGenerating(false);
  };
  
  return (
    <Button onClick={() => generatePdf(data)} disabled={generating}>
      {generating ? <LoadingSpinner /> : 'Generate PDF'}
    </Button>
  );
}

// SERVER-SIDE (API Route)
import { ServerPdfService } from '@ganger/integrations/server';
import puppeteer from 'puppeteer'; // ✅ SERVER ONLY

export async function POST(request: Request) {
  const { template, data, options } = await request.json();
  
  // ✅ SERVER: Direct puppeteer PDF generation
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const html = await ServerPdfService.renderTemplate(template, data);
  await page.setContent(html);
  
  const pdfBuffer = await page.pdf(options);
  await browser.close();
  
  return new Response(pdfBuffer, {
    headers: { 'Content-Type': 'application/pdf' }
  });
}
```

#### **Implementation Steps**
1. **Move puppeteer to server-only**: Remove all client-side puppeteer imports
2. **Template System**: Server-side HTML template rendering
3. **Client Service Layer**: `ClientPdfService` with request/download methods
4. **Server Service Layer**: `ServerPdfService` with puppeteer integration
5. **File Handling**: Proper PDF streaming and download management

### **3. Redis Caching Integration Fix**

#### **Problem Statement**
```bash
# Current errors blocking compilation:
❌ Module not found: Can't resolve 'ioredis' in client components
❌ Critical dependency warnings from Redis native bindings
❌ Edge runtime incompatibility with TCP connection dependencies
❌ Client-side Redis connection attempts causing build failures
```

#### **Solution Architecture**
```typescript
// ✅ FIXED PATTERN: Hybrid Caching Strategy

// CLIENT-SIDE (Browser)
'use client'
import { ClientCacheService } from '@ganger/integrations/client';

export function PatientDataComponent() {
  const [patientData, setPatientData] = useState(null);
  
  const loadPatientData = async (patientId: string) => {
    // ✅ CLIENT: Check browser localStorage first
    const cached = await ClientCacheService.getClientCache(
      `patient:${patientId}`, 
      { maxAge: 300000 } // 5 minutes
    );
    
    if (cached) {
      setPatientData(cached);
      return;
    }
    
    // ✅ CLIENT: Request from server (which checks Redis)
    const response = await ClientCacheService.getServerCache(`patient:${patientId}`);
    setPatientData(response.data);
    
    // ✅ CLIENT: Cache locally for quick access
    await ClientCacheService.setClientCache(`patient:${patientId}`, response.data);
  };
  
  return <PatientProfile data={patientData} />;
}

// SERVER-SIDE (API Route)
import { ServerCacheService } from '@ganger/integrations/server';
import Redis from 'ioredis'; // ✅ SERVER ONLY

const redis = new Redis(process.env.REDIS_URL);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = searchParams.get('key');
  
  // ✅ SERVER: Check Redis cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return Response.json({ 
      data: JSON.parse(cached), 
      source: 'redis-cache' 
    });
  }
  
  // ✅ SERVER: Fetch from database and cache
  const data = await db.patients.findUnique({ where: { id: patientId } });
  await redis.setex(cacheKey, 1800, JSON.stringify(data)); // 30 min TTL
  
  return Response.json({ data, source: 'database' });
}
```

#### **Hybrid Caching Strategy**
```typescript
// ✅ UNIVERSAL CACHE HUB PATTERN
interface UniversalCacheHub {
  // Client-side caching (localStorage/sessionStorage)
  setClientCache(key: string, data: any, ttlMs?: number): Promise<void>;
  getClientCache(key: string, options?: CacheOptions): Promise<any>;
  
  // Server-side caching (Redis)
  setServerCache(key: string, data: any, ttlSeconds?: number): Promise<void>;
  getServerCache(key: string): Promise<CacheResult>;
  
  // Cache invalidation
  invalidateCache(pattern: string): Promise<void>;
  
  // Analytics
  getCacheStats(): Promise<CacheStats>;
}
```

#### **Implementation Steps**
1. **Move ioredis to server-only**: Remove all client-side Redis imports
2. **Hybrid Strategy**: Client localStorage + Server Redis
3. **Universal Hub**: `UniversalCacheHub` for unified caching interface
4. **TTL Management**: Proper Time-To-Live handling on both sides
5. **Cache Analytics**: Performance monitoring and hit rate tracking

---

## 🗄️ Database Schema

### **Integration Status Tracking**
```sql
-- Track integration health and performance
CREATE TABLE integration_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Integration identification
  integration_name TEXT NOT NULL, -- 'google_sheets', 'pdf_generation', 'redis_caching'
  service_type TEXT NOT NULL CHECK (service_type IN ('google_api', 'pdf_service', 'cache_service')),
  
  -- Performance metrics
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  success_rate DECIMAL(5,2) DEFAULT 100.00, -- percentage
  average_response_time_ms INTEGER,
  
  -- Error tracking
  last_error_message TEXT,
  error_count_24h INTEGER DEFAULT 0,
  
  -- Configuration status
  config_version TEXT,
  last_config_update TIMESTAMPTZ DEFAULT NOW(),
  
  -- Bundle optimization tracking
  client_bundle_size_kb INTEGER,
  server_bundle_size_kb INTEGER,
  optimization_applied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_name)
);

-- Track cache performance specifically
CREATE TABLE cache_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  cache_key TEXT NOT NULL,
  cache_type TEXT NOT NULL CHECK (cache_type IN ('client_storage', 'redis_server')),
  operation TEXT NOT NULL CHECK (operation IN ('get', 'set', 'delete', 'invalidate')),
  
  hit_status TEXT CHECK (hit_status IN ('hit', 'miss', 'error')),
  response_time_ms INTEGER,
  data_size_bytes INTEGER,
  
  ttl_seconds INTEGER,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_integration_status_name ON integration_status(integration_name);
CREATE INDEX idx_cache_performance_key_time ON cache_performance_log(cache_key, created_at DESC);
```

---

## 🔌 API Specifications

### **Universal Integration APIs**
```typescript
// ✅ STANDARDIZED PATTERNS for all integrations

// Google Sheets API
POST   /api/integrations/google/sheets/read      // Read sheet data
POST   /api/integrations/google/sheets/write     // Write sheet data
POST   /api/integrations/google/sheets/batch     // Batch operations
GET    /api/integrations/google/status           // Health check

// PDF Generation API
POST   /api/integrations/pdf/generate            // Generate PDF from template
POST   /api/integrations/pdf/html-to-pdf         // Convert HTML to PDF
GET    /api/integrations/pdf/templates           // List available templates
GET    /api/integrations/pdf/status              // Health check

// Caching API
GET    /api/integrations/cache/get/:key          // Get cached data
POST   /api/integrations/cache/set               // Set cache data
DELETE /api/integrations/cache/invalidate        // Invalidate cache pattern
GET    /api/integrations/cache/stats             // Cache performance stats
```

### **Integration Health Monitoring**
```typescript
// Health check endpoints for each integration
GET    /api/health/integrations                  // All integration status
GET    /api/health/integrations/google          // Google services status
GET    /api/health/integrations/pdf             // PDF generation status
GET    /api/health/integrations/cache           // Cache system status

// Performance monitoring
GET    /api/metrics/integrations/performance    // Response time metrics
GET    /api/metrics/integrations/errors         // Error rate tracking
GET    /api/metrics/integrations/bundle-sizes   // Bundle optimization metrics
```

---

## 🎨 User Interface Design

### **Integration Status Dashboard**
```typescript
// ✅ REQUIRED: Integration monitoring components
import {
  IntegrationStatusCard,     // Individual service status
  IntegrationGrid,           // Overview of all services
  PerformanceChart,          // Response time trends
  ErrorAlertPanel,           // Error notifications
  BundleSizeIndicator,       // Bundle optimization status
  CacheHitRateDisplay        // Cache performance metrics
} from '@ganger/ui/integrations';

// Example usage in admin dashboard
'use client'
export function IntegrationStatusDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <IntegrationStatusCard 
        service="google_sheets" 
        status="healthy" 
        responseTime={245}
        bundleOptimized={true}
      />
      <IntegrationStatusCard 
        service="pdf_generation" 
        status="healthy" 
        responseTime={1200}
        bundleOptimized={true}
      />
      <IntegrationStatusCard 
        service="redis_caching" 
        status="healthy" 
        hitRate={94.2}
        bundleOptimized={true}
      />
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### **Integration Testing Requirements**
```typescript
// ✅ MANDATORY: Comprehensive integration tests
describe('Platform Stability Package', () => {
  
  describe('Google Sheets Integration', () => {
    test('client-server separation maintained', async () => {
      // Verify googleapis not imported in client code
      const clientBundle = await analyzeClientBundle();
      expect(clientBundle.dependencies).not.toContain('googleapis');
    });
    
    test('server API functionality', async () => {
      // Test direct googleapis integration on server
      const response = await ServerGoogleService.readSheet('test-id', 'A1:B10');
      expect(response.values).toBeDefined();
    });
    
    test('client service API calls', async () => {
      // Test client making API calls to server
      const data = await ClientGoogleService.getSheetData('test-id', 'A1:B10');
      expect(data).toBeDefined();
    });
  });
  
  describe('PDF Generation Integration', () => {
    test('puppeteer not in client bundle', async () => {
      const clientBundle = await analyzeClientBundle();
      expect(clientBundle.dependencies).not.toContain('puppeteer');
    });
    
    test('server PDF generation', async () => {
      const pdf = await ServerPdfService.generatePdf('<h1>Test</h1>');
      expect(pdf.length).toBeGreaterThan(1000); // Valid PDF size
    });
    
    test('client PDF request flow', async () => {
      const blob = await ClientPdfService.generateReport(testData);
      expect(blob.type).toBe('application/pdf');
    });
  });
  
  describe('Redis Caching Integration', () => {
    test('ioredis not in client bundle', async () => {
      const clientBundle = await analyzeClientBundle();
      expect(clientBundle.dependencies).not.toContain('ioredis');
    });
    
    test('hybrid caching strategy', async () => {
      // Test client localStorage caching
      await ClientCacheService.setClientCache('test-key', { data: 'test' });
      const cached = await ClientCacheService.getClientCache('test-key');
      expect(cached.data).toBe('test');
      
      // Test server Redis caching
      await ServerCacheService.setCache('test-key', { data: 'test' }, 300);
      const serverCached = await ServerCacheService.getCache('test-key');
      expect(serverCached.data).toBe('test');
    });
  });
  
  describe('Bundle Size Optimization', () => {
    test('client bundle size under limits', async () => {
      const bundleStats = await analyzeBundleSizes();
      expect(bundleStats.client.totalSize).toBeLessThan(5 * 1024 * 1024); // 5MB max
    });
    
    test('TypeScript compilation success', async () => {
      const compilation = await runTypeScriptCompilation();
      expect(compilation.errors).toHaveLength(0);
    });
  });
});
```

### **Quality Gate Verification**
```bash
# ✅ MANDATORY: All tests must pass
npm run test:integration-stability    # Integration-specific tests
npm run test:bundle-analysis         # Bundle size verification
npm run type-check                   # TypeScript compilation
npm run build:production             # Production build test
npm run test:health-checks           # Integration health verification
```

---

## 🚀 Deployment & Operations

### **Environment Configuration**
```bash
# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-service@ganger-platform.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SHEETS_SCOPE=https://www.googleapis.com/auth/spreadsheets

# PDF Generation
PDF_GENERATION_ENABLED=true
PDF_TEMPLATE_PATH=/app/templates/pdf
PUPPETEER_CHROME_PATH=/usr/bin/chromium-browser
PDF_OUTPUT_QUALITY=high

# Redis Caching
REDIS_URL=redis://localhost:6379
REDIS_TTL_DEFAULT=1800
REDIS_MAX_CONNECTIONS=10
CLIENT_CACHE_TTL_MS=300000

# Performance Monitoring
INTEGRATION_MONITORING_ENABLED=true
BUNDLE_SIZE_MONITORING=true
PERFORMANCE_ALERTS_WEBHOOK=https://hooks.slack.com/services/...
```

### **Monitoring & Health Checks**
```typescript
// ✅ REQUIRED: Integration health monitoring
const HEALTH_CHECKS = {
  google_sheets: {
    endpoint: '/api/health/integrations/google',
    interval: '5m',
    timeout: '10s',
    expectedResponse: { status: 'healthy', bundleOptimized: true }
  },
  pdf_generation: {
    endpoint: '/api/health/integrations/pdf',
    interval: '5m', 
    timeout: '30s',
    expectedResponse: { status: 'healthy', bundleOptimized: true }
  },
  redis_caching: {
    endpoint: '/api/health/integrations/cache',
    interval: '2m',
    timeout: '5s',
    expectedResponse: { status: 'healthy', hitRate: '>80%' }
  }
};
```

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] ✅ **TypeScript Compilation**: 100% error-free compilation across all packages
- [ ] ✅ **Bundle Size Optimization**: Client bundles under 5MB (60%+ reduction achieved)
- [ ] ✅ **Production Build Success**: All applications build successfully for deployment
- [ ] ✅ **Integration Functionality**: All three integrations working via server APIs
- [ ] ✅ **Client-Server Separation**: No server dependencies in client bundles
- [ ] ✅ **Performance Validation**: Response times under 2 seconds for all integrations
- [ ] ✅ **Health Monitoring**: Integration status dashboard operational

### **Success Metrics (1 month)**
- **Development Velocity**: 300% improvement in build and compilation times
- **Bundle Performance**: 40-60% faster initial page load times
- **Integration Reliability**: 99.9% uptime for all three fixed integrations
- **Developer Experience**: Zero compilation errors and build failures
- **Platform Stability**: 100% successful deployments across all applications

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Weekly Bundle Analysis**: Monitor bundle sizes and dependency changes
- **Monthly Performance Review**: Integration response times and optimization opportunities
- **Quarterly Dependency Updates**: Keep googleapis, puppeteer, ioredis updated safely
- **Ongoing Type Safety**: Maintain strict TypeScript compliance

### **Future Enhancements**
- **Edge Function Migration**: Move more integrations to Cloudflare Edge
- **Advanced Caching**: Implement distributed caching strategies
- **Performance Optimization**: Further bundle splitting and lazy loading
- **Monitoring Expansion**: Real-time performance dashboards

---

*This Platform Stability Package PRD ensures comprehensive resolution of critical integration issues while establishing patterns for future integration development. The client-server separation architecture prevents build failures and optimizes performance across the entire Ganger Platform.*