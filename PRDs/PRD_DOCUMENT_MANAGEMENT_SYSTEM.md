# PRD - Document Management System
*Intelligent collaborative document lifecycle management with Git-based version control and AI-powered workflow automation*

**📚 Documentation Reference:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: Document Management System
- **PRD ID**: PRD-DMS-001
- **Priority**: High
- **Development Timeline**: 12-16 weeks (Progressive rollout every 2 weeks)
- **Terminal Assignment**: Mixed (Heavy backend for Git integration, strong frontend for 3D navigation)
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations, **NEW:** @ganger/diagrams, @ganger/3d, @ganger/editor, @ganger/git, @ganger/ai
- **MCP Integration Requirements**: GitHub API, Google Drive API, Slack API, JotForm API
- **Quality Gate Requirements**: Git integration testing, 3D performance optimization, document security auditing

---

## 🎯 Product Overview

### **Purpose Statement**
Transform static, outdated operations manuals into an intelligent, collaborative document ecosystem that automatically maintains itself and prevents operational knowledge gaps through AI-powered workflow automation and visual document relationship mapping.

### **Target Users**
- **Primary**: Managers and staff requiring SOP access, editing, and approval workflows
- **Secondary**: Physicians requiring consensus-based document approvals
- **Tertiary**: Authorized personnel for PDF generation and external distribution

### **Success Metrics**
- **Document Consolidation**: Reduce current document volume by 90% through intelligent AI merging
- **Compliance Rate**: Achieve 95% staff adherence to documented procedures within 6 months
- **Update Velocity**: Reduce procedure update time from weeks to hours through automated workflows
- **Knowledge Gap Reduction**: Eliminate 100% of undocumented critical procedures through gap analysis

### **Business Value Measurement**
- **ROI Target**: 300% return within 12 months through operational efficiency gains
- **Cost Savings**: $50,000+ annually in reduced training time and procedure compliance
- **Revenue Impact**: Improved patient flow efficiency, reduced errors, enhanced service quality
- **User Productivity**: 80% reduction in time spent finding and updating documentation

---

## 🏗️ Technical Architecture

### **Platform-Compliant Deployment Strategy**
```yaml
# CRITICAL: Follows proven Ganger Platform deployment architecture
Application_URL: https://staff.gangerdermatology.com/docs
Deployment_Method: Direct content serving in platform Worker
Worker_Location: cloudflare-workers/staff-router.js (add /docs routing)
DNS_Configuration: No additional configuration needed (uses existing staff.gangerdermatology.com)
Deployment_Command: cd cloudflare-workers && npx wrangler deploy --env production

# Proven deployment pattern (zero DNS issues, instant deployment)
# Follows successful /status, /meds, /batch, /reps pattern
# No separate Worker or subdomain needed
```

### **Shared Infrastructure (Standard - MANDATORY)**
```yaml
Frontend: Next.js 14+ with TypeScript (100% compilation required)
Backend: Next.js API routes + GitHub Contents API integration
Database: Supabase PostgreSQL with Row Level Security + Git metadata
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers via platform Worker (staff.gangerdermatology.com/docs)
Styling: Tailwind CSS + Ganger Design System (NO custom CSS allowed)
Real-time: Supabase subscriptions for collaboration features
File Storage: GitHub repository backend + Supabase metadata
Build System: Turborepo (workspace compliance required)
Quality Gates: Automated pre-commit hooks (see MASTER_DEVELOPMENT_GUIDE.md)
```

### **Platform-Wide Package Additions (Available to All Apps)**
```typescript
// NEW PLATFORM PACKAGES - Available to entire Ganger Platform
'@ganger/3d'           // Three.js wrapper with performance optimization
'@ganger/diagrams'     // Mermaid.js integration for all apps  
'@ganger/editor'       // Notion-style WYSIWYG editor component
'@ganger/git'          // GitHub Contents API abstraction layer
'@ganger/ai'           // Content analysis and suggestion engine
'@ganger/markdoc'      // Modern Markdown authoring framework with custom tags

// Benefits for platform:
// - Other apps can use 3D visualizations (inventory relationships, org charts)
// - Diagrams available for procedure documentation across all apps
// - Consistent editor experience platform-wide
// - Git integration for configuration management
// - AI content analysis for gap detection across platform
// - Markdoc enables custom components for medical workflows across apps
```

### **Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { /* ALL UI components */ } from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { 
  ClientCommunicationService, 
  ClientCacheService 
} from '@ganger/integrations/client';
import { validateForm, formatters } from '@ganger/utils/client';

// NEW PLATFORM PACKAGES (client-side)
import { DiagramRenderer, MermaidGenerator, ThreeDRenderer } from '@ganger/diagrams';
import { NotionEditor, MarkdownProcessor } from '@ganger/editor';
import { ThreeDScene, DocumentUniverse, PerformanceOptimizer } from '@ganger/3d';
import { ContentAnalyzer, GapDetector } from '@ganger/ai';
import { MarkdocRenderer, MedicalTags, StructuredContent } from '@ganger/markdoc';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { db, createClient } from '@ganger/db';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { 
  ServerCommunicationService,
  ServerPdfService,
  ServerGoogleService
} from '@ganger/integrations/server';
import { analytics, auditLog } from '@ganger/utils/server';

// NEW PLATFORM PACKAGES (server-side)
import { GitHubContents, VersionControl, ConflictResolver } from '@ganger/git';
import { ContentAnalyzer, RelationshipMapper, DocumentProcessor } from '@ganger/ai';
import { MarkdocCompiler, CustomTagProcessor, DocumentGenerator } from '@ganger/markdoc';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  User, Document, ApprovalWorkflow, DocumentRelationship,
  ApiResponse, PaginationMeta, ValidationRule,
  DiagramConfig, ThreeDNode, EditorState, MarkdocSchema, MedicalTag
} from '@ganger/types';
```

### **App-Specific Technology Integration**
- **Three.js**: 3D document relationship visualization (via @ganger/3d package)
- **GitHub Contents API**: Version control backend without Git complexity (via @ganger/git package)
- **Markdoc**: Modern Markdown authoring framework with custom medical tags (via @ganger/markdoc package)
- **Mermaid.js**: Integrated via @ganger/diagrams (platform-wide resource)
- **AI Content Analysis**: Document consolidation and gap analysis (via @ganger/ai package)
- **Notion-style Editor**: WYSIWYG markdown editing experience (via @ganger/editor package)

### **Markdoc Medical Tag System**
```markdoc
{% sop-warning type="critical" %}
Emergency procedure - requires immediate attention
{% /sop-warning %}

{% medication-alert drug="aspirin" severity="high" %}
Check patient allergies before administration
{% /medication-alert %}

{% approval-required role="manager" department="clinical" %}
Manager sign-off required for this procedure
{% /approval-required %}

{% compliance-note regulation="HIPAA" %}
Patient privacy must be maintained during this process
{% /compliance-note %}

{% procedure-step number="1" critical="true" %}
Verify patient identity using two identifiers
{% /procedure-step %}

{% safety-check type="infection-control" %}
Ensure proper hand hygiene before patient contact
{% /safety-check %}
```

**Key Advantages Over Traditional Markdown:**
- **Structured Content**: Medical procedures become data, not just text
- **Better for Staff**: No JSX syntax - medical staff can focus on content
- **Performance**: 3x faster builds than MDX for large document sets
- **AI Integration**: Structured tags enable better AI analysis and compliance checking
- **Custom Components**: Medical-specific tags render as interactive React components
- **Future-Proof**: Maintained by Stripe with active development

### **Progressive Feature Rollout Architecture**
```typescript
// Admin-controlled feature flag system
interface FeatureFlags {
  documentViewing: boolean;       // Week 1-2: Core foundation
  documentEditing: boolean;       // Week 3-4: Basic editing
  approvalWorkflows: boolean;     // Week 5-6: Workflow engine
  wysiwygEditor: boolean;         // Week 7-8: Enhanced editing
  mermaidDiagrams: boolean;       // Week 9-10: Visual intelligence
  usageAnalytics: boolean;        // Week 11-12: Analytics
  pdfGeneration: boolean;         // Week 13-14: Advanced features
  handoutsIntegration: boolean;   // Week 15-16: Integration phase
  threeDNavigation: boolean;      // Advanced killer feature
  autoDocGeneration: boolean;     // Platform monitoring
  gapAnalysis: boolean;           // AI recommendations
  changePropagate: boolean;       // Relationship intelligence
}

// Weekly configuration check system
const checkFeatureUpdates = async () => {
  const config = await db.adminConfig.findFirst({
    where: { type: 'FEATURE_FLAGS' }
  });
  return config.features as FeatureFlags;
};
```

---

## 👥 Authentication & Authorization

### **Role-Based Access (Enhanced for Document Management)**
```typescript
// MANDATORY role hierarchy - enhanced for document workflows
type UserRole = 
  | 'superadmin'        // Full system access + PDF generation
  | 'manager'           // Document approval authority + PDF generation
  | 'provider'          // Physician consensus workflows
  | 'nurse'             // SOP editing and viewing
  | 'medical_assistant' // SOP viewing and basic editing
  | 'pharmacy_tech'     // Medication-related document access
  | 'billing'           // Financial procedure access
  | 'user';             // Read-only access

// Document-specific permissions
interface DocumentPermissions {
  viewDocument: UserRole[];           // Read access
  editDocument: UserRole[];           // Check-out and edit
  approveDocument: UserRole[];        // Approval workflow authority
  generatePDF: ['superadmin', 'manager']; // IP protection
  accessThirdParty: UserRole[];       // External documentation
  manageWorkflows: ['superadmin', 'manager']; // Workflow configuration
}

// Approval workflow matrix
interface ApprovalMatrix {
  staff_authored: ['manager'];         // Staff needs manager approval
  manager_authored: ['superadmin'];    // Manager needs admin approval
  physician_authored: ['physician_consensus']; // Requires physician votes
  policy_document: ['superadmin', 'manager']; // Dual approval required
  patient_facing: ['provider', 'manager', 'superadmin']; // Triple approval
}
```

### **Document Security & IP Protection**
- **Checkout System**: Database-tracked locking prevents simultaneous edits
- **PDF Generation Control**: Only managers and superadmins can generate PDFs
- **Audit Logging**: All document access and modifications logged for compliance
- **Version Control**: Full Git history maintained but abstracted from users

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Platform-Compliant)**
```yaml
# CRITICAL: Follows proven Ganger Platform deployment architecture
Deployment_Method: Direct content serving in platform Worker (staff.gangerdermatology.com/docs)
URL_Structure: https://staff.gangerdermatology.com/docs
Worker_Location: cloudflare-workers/staff-router.js (add docs routing)
Git_Backend: GitHub repository with Contents API integration (backend only)
Documentation_Sites: Markdoc generates structured content served by platform Worker
PDF_Generation: Queue processing via existing @ganger/integrations/server
AI_Services: Integrated with existing platform AI capabilities
Monitoring: Enhanced with document-specific metrics
Deployment_Command: cd cloudflare-workers && npx wrangler deploy --env production

# NO SEPARATE WORKER needed - integrates into existing platform
# NO additional DNS configuration required
# NO new subdomain needed - uses proven staff portal architecture
```

### **Environment Configuration (Platform-Compliant)**
```bash
# Standard environment variables (ALREADY CONFIGURED)
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=[Already configured in platform]
SUPABASE_SERVICE_ROLE_KEY=[Already configured in platform]
GOOGLE_CLIENT_ID=745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
CLOUDFLARE_API_TOKEN=CNJuDfW4xVxdeNfcNToaqtwKjtqRdQLxF7DvcKuj
CLOUDFLARE_ZONE_ID=ba76d3d3f41251c49f0365421bd644a5

# Document Management specific (ADD TO EXISTING PLATFORM CONFIG)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx          # GitHub Contents API access
GITHUB_REPO_OWNER=acganger                     # Repository owner
GITHUB_REPO_NAME=ganger-docs                   # Documentation repository
GOOGLE_DRIVE_FOLDER_IDS=1BvAxxxxx,1CvBxxxxx   # Ingestion folder links
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxx              # @ mention integration
JOTFORM_API_KEY=xxxxxxxxxxxxxxxxxx             # Signature workflow integration
OPENAI_API_KEY=sk-xxxxxxxxxxxx                 # AI features (if using OpenAI)

# NO SEPARATE URLs NEEDED - uses existing platform infrastructure
# PDF generation uses existing @ganger/integrations/server PDF service
# Markdoc generates structured content served by platform Worker
# Redis queue can use existing platform caching infrastructure
```

### **Implementation Steps for Platform Integration**

**Step 1: Add Route to Platform Worker**
```javascript
// In cloudflare-workers/staff-router.js
if (pathname.startsWith('/docs')) {
  // Route to document management system
  return await handleDocumentRoutes(pathname, request, env);
}
```

**Step 2: Create New @ganger Packages**
```bash
# Create platform-wide packages
mkdir -p packages/3d packages/diagrams packages/editor packages/git packages/ai packages/markdoc

# Each package follows standard @ganger pattern:
# - packages/[name]/src/client/index.ts (client exports)
# - packages/[name]/src/server/index.ts (server exports)  
# - packages/[name]/src/types/index.ts (shared types)
# - packages/[name]/package.json (workspace:* dependencies)
```

**Step 3: No Python Services Needed**
```yaml
# SIMPLIFIED: All functionality within Cloudflare Workers
Markdoc_Generation: Structured content generation via JavaScript (modern, fast)
PDF_Generation: Uses existing @ganger/integrations/server PDF service
AI_Processing: Uses existing platform AI infrastructure
Queue_Processing: Uses existing caching infrastructure

# NO separate Python services or additional hosting required
# NO complex microservice architecture needed
# ALL fits within proven platform deployment pattern
# Better performance than MkDocs for large document sets
```

---

## 🔧 Developer Implementation Guide

### **Phase 1: Platform Package Creation (Weeks 1-4)**

**Week 1-2: Core Package Structure**
```bash
# Create new @ganger packages
mkdir -p packages/{editor,diagrams,git,ai,3d,markdoc}

# Each package structure:
packages/editor/
├── src/
│   ├── client/          # Client-safe exports
│   │   ├── index.ts     # 'use client' components
│   │   ├── Editor.tsx   # Notion-style editor
│   │   └── hooks.ts     # React hooks
│   ├── server/          # Server-only exports  
│   │   ├── index.ts     # API utilities
│   │   └── processor.ts # Markdown processing
│   ├── types/           # Shared types
│   │   └── index.ts     # TypeScript definitions
│   └── styles/          # Component styles
├── package.json         # workspace:* dependencies
└── tsconfig.json        # TypeScript config
```

**Week 3-4: Package Implementation**
```typescript
// packages/editor/src/client/index.ts
'use client'
export { NotionEditor } from './Editor';
export { useMarkdown, useEditorState } from './hooks';
export type { EditorProps, EditorState } from '../types';

// packages/editor/src/server/index.ts
export { MarkdownProcessor } from './processor';
export { validateContent } from './validator';
export type { ProcessorConfig } from '../types';

// packages/markdoc/src/client/index.ts
'use client'
export { MarkdocRenderer } from './Renderer';
export { MedicalTags } from './medical-tags';
export { useMarkdoc } from './hooks';
export type { MarkdocSchema, MedicalTag } from '../types';

// packages/markdoc/src/server/index.ts
export { MarkdocCompiler } from './compiler';
export { CustomTagProcessor } from './processor';
export { validateMedicalContent } from './validator';
export type { CompilerConfig } from '../types';

// packages/diagrams/src/client/index.ts
'use client'
export { MermaidRenderer } from './Renderer';
export { DiagramEditor } from './Editor';
export { useDiagram } from './hooks';

// packages/3d/src/client/index.ts
'use client'
export { ThreeDScene } from './Scene';
export { DocumentUniverse } from './Universe';
export { useThreeJS } from './hooks';
```

### **Phase 2: Platform Router Integration (Week 5)**

**Add Document Management Route**
```javascript
// cloudflare-workers/staff-router.js
const workingRoutes = {
  '/status': 'ganger-integration-status-prod.workers.dev',
  '/meds': 'ganger-medication-auth-prod.workers.dev', 
  '/batch': 'ganger-batch-closeout-prod.workers.dev',
  '/reps': 'ganger-pharma-scheduling-prod.workers.dev',
  '/docs': handleDocumentManagement,  // NEW: Document management
};

// Document management handler
async function handleDocumentManagement(pathname, request, env) {
  // Feature flag check
  const features = await getFeatureFlags(env);
  
  if (!features.documentViewing) {
    return new Response(getComingSoonPage('Document Management'), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // Route to document management app
  return fetch(`https://ganger-docs-prod.workers.dev${pathname}`, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
}
```

### **Phase 3: Database Schema Implementation (Week 6)**

**Migration Creation**
```sql
-- supabase/migrations/20250615000000_document_management.sql

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view documents they have access to" ON documents
FOR SELECT USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'superadmin', 'provider', 'nurse', 'medical_assistant')
  )
);

CREATE POLICY "Users can create documents" ON documents
FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'superadmin', 'provider', 'nurse', 'medical_assistant')
  )
);

-- Create indexes for performance
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_checkout ON documents(checkout_user_id, checkout_expires_at);
CREATE INDEX idx_document_relationships_source ON document_relationships(source_document_id);
CREATE INDEX idx_approval_workflows_status ON approval_workflows(status);
```

---

## 📈 Success Criteria

### **Launch Criteria (Phase 1 - SOPs)**
- [ ] All existing SOPs successfully ingested and consolidated (90% volume reduction)
- [ ] 3D document navigation rendering 500+ documents smoothly (<2s load time)
- [ ] Approval workflows integrated with EOS L10 creating accurate to-do items
- [ ] Checkout system preventing edit conflicts with 24-hour timeout functionality
- [ ] AI diagram suggestions generating relevant Mermaid visualizations
- [ ] PDF generation restricted to authorized roles with queue processing
- [ ] Mobile-responsive interface supporting touch-based 3D navigation
- [ ] **Platform Integration**: Available at staff.gangerdermatology.com/docs with zero DNS issues

### **Success Metrics (6 months post-launch)**
- **User Adoption**: 95% of staff actively using system for procedure reference
- **Efficiency Gains**: 80% reduction in time spent finding/updating documentation
- **Compliance Improvement**: 95% procedure adherence rate (baseline measurement required)
- **Knowledge Gaps**: 100% of AI-identified documentation gaps addressed
- **Approval Velocity**: Average 48-hour approval cycle time (down from current weeks)
- **Cross-Platform Integration**: Handouts app fully integrated with 90% content migrated
- **Platform Package Usage**: @ganger/diagrams adopted by 3+ other platform apps

### **Advanced Feature Success (12 months)**
- **3D Navigation Adoption**: 70% of users prefer 3D exploration over traditional search
- **AI Accuracy**: 85% acceptance rate for AI diagram and consolidation suggestions
- **Platform Integration**: Auto-generated SOPs for 100% of Ganger Platform applications
- **Change Propagation**: 95% accuracy in identifying documents requiring updates
- **Third-Party Integration**: Comprehensive external documentation hub with 50+ resources

---

*This PRD represents a revolutionary approach to documentation management that transforms static procedures into an intelligent, self-maintaining knowledge ecosystem while creating reusable platform packages that enhance the entire Ganger Platform.*

**🎯 Next Steps:**
1. **Review and approve this PRD** with platform architecture considerations
2. **Begin Phase 1: Platform package creation** (4 weeks)
3. **Implement platform router integration** (1 week)
4. **Set up database schema and migrations** (1 week)
5. **Begin parallel frontend/backend development** (6 weeks)
6. **Establish weekly feature activation reviews** based on user feedback

**📚 Essential Reading Before Development:**
- `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Complete technical standards
- `/true-docs/AI_WORKFLOW_GUIDE.md` - AI development methodologies for complex features
- `/true-docs/PROJECT_TRACKER.md` - Current platform velocity and integration patterns
- `/true-docs/DEPLOYMENT_GUIDE.md` - Platform deployment architecture and proven patterns

**🏗️ Platform Benefits:**
This project creates 6 new @ganger packages that benefit the entire platform:
- **@ganger/editor**: Consistent content editing across all apps
- **@ganger/diagrams**: Mermaid visualization for procedures, workflows, and data
- **@ganger/3d**: Advanced data visualization for multiple use cases
- **@ganger/git**: Version control for configuration management
- **@ganger/ai**: Intelligence layer for gap detection and insights
- **@ganger/markdoc**: Modern structured content authoring with custom medical components

**@ganger/markdoc Platform Use Cases:**
- **Inventory App**: Custom tags for equipment procedures and safety protocols
- **Handouts App**: Patient education materials with interactive medical components
- **EOS L10**: Team procedures and workflow documentation with approval tags
- **Medication Auth**: Drug interaction warnings and dosage guidance components
- **Clinical Apps**: HIPAA compliance notes and patient safety checks

**🚀 Deployment Confidence:**
Follows proven platform deployment pattern with zero DNS configuration and instant deployment via platform Worker integration.