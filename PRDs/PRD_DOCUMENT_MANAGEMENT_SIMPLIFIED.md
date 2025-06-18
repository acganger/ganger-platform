# PRD - Document Management System (SIMPLIFIED)
*Practical document hub with AI consolidation to eliminate documentation chaos*

**📚 Documentation Reference:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: Document Management System
- **PRD ID**: PRD-DMS-002-SIMPLIFIED
- **Priority**: High
- **Development Timeline**: 4-6 weeks (MVP in 3 weeks, AI features in weeks 4-6)
- **Terminal Assignment**: Mixed (Backend for AI processing, Frontend for document interface)
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations, **NEW:** @ganger/markdoc, @ganger/ai
- **MCP Integration Requirements**: Google Sheets API (for export), OpenAI/Claude API (for consolidation)
- **Quality Gate Requirements**: Platform compliance, document security, AI accuracy validation

---

## 🎯 Product Overview

### **Purpose Statement**
Create a simple, reliable document hub that consolidates scattered SOPs and procedures into one searchable location, with AI-powered document consolidation to eliminate hundreds of hours of manual cleanup work.

### **Target Users**
- **Primary**: All staff requiring access to SOPs, policies, and procedures
- **Secondary**: Managers requiring document approval and oversight
- **Tertiary**: IT/Admin staff managing document consolidation and cleanup

### **Success Metrics**
- **Document Consolidation**: AI merges duplicate/similar documents, reducing volume by 60-80%
- **Adoption Rate**: 90% of staff using system for procedure lookup within 3 months
- **Time Savings**: 80% reduction in time spent finding current procedures
- **Document Confidence**: Staff confidence in documentation accuracy reaches 95%

### **Business Value**
- **Primary Value**: Eliminate documentation chaos and low confidence
- **Labor Savings**: AI consolidation saves 200+ hours of manual document cleanup
- **Operational Efficiency**: Staff find procedures faster, follow current processes
- **Compliance**: Centralized, approved procedures support audit readiness

---

## 🏗️ Technical Architecture

### **Platform-Compliant Deployment**
```yaml
Application_URL: https://staff.gangerdermatology.com/docs
Deployment_Method: Staff portal integration (existing pattern)
Worker_Location: Uses existing staff-portal-router.js
Database: Existing Supabase with new document tables
Authentication: Existing Google OAuth + Supabase Auth
Environment: Uses existing platform environment variables
```

### **Simplified Technology Stack**
```typescript
// ✅ EXISTING PLATFORM INFRASTRUCTURE (NO CHANGES NEEDED)
Frontend: Next.js 14+ with TypeScript (existing)
Backend: Next.js API routes + Supabase (existing)
Database: Supabase PostgreSQL with RLS (existing)
Authentication: Google OAuth (@gangerdermatology.com) (existing)
Hosting: Cloudflare Workers via platform router (existing)
Styling: Tailwind CSS + @ganger/ui (existing)
File Storage: Supabase Storage (existing)

// ✅ REQUIRED EXISTING PACKAGES
'@ganger/ui'           // All UI components (existing)
'@ganger/auth'         // Authentication (existing)
'@ganger/db'           // Database operations (existing)
'@ganger/utils'        // Utilities and validation (existing)
'@ganger/integrations' // Communication and external APIs (existing)

// 🆕 NEW PACKAGES (ONLY 2 - SIMPLIFIED)
'@ganger/markdoc'      // Structured document authoring
'@ganger/ai'           // Document consolidation and smart search
```

### **Why Markdoc + AI (The Only Complex Parts)**

#### **Markdoc for Medical Documents**
```markdoc
<!-- Simple, readable syntax for medical staff -->
{% sop-warning type="critical" %}
Emergency procedure - requires immediate attention
{% /sop-warning %}

{% approval-required role="manager" %}
Manager sign-off required for this procedure
{% /approval-required %}

{% procedure-step number="1" %}
Verify patient identity using two identifiers
{% /procedure-step %}
```

**Benefits Over Plain Markdown:**
- **Medical Tags**: Built-in tags for warnings, approvals, safety checks
- **Consistency**: Standardized formatting across all documents
- **Future-Proof**: Can add interactive features later
- **Staff-Friendly**: No complex syntax, just simple tags

#### **AI Document Consolidation**
```typescript
// AI consolidation workflow
interface ConsolidationTask {
  duplicateDocuments: Document[];
  suggestedMerge: string;
  confidenceScore: number;
  manualReviewRequired: boolean;
}

// Example AI consolidation
const duplicates = await findDuplicateDocuments();
// Input: "Hand Hygiene SOP", "Hand Washing Procedure", "Hand Sanitization Guidelines"
// Output: Single consolidated "Hand Hygiene Standards" document
```

**Why This Saves Hundreds of Hours:**
- **Duplicate Detection**: AI finds similar documents automatically
- **Content Merging**: AI creates unified documents from duplicates
- **Gap Analysis**: AI identifies missing procedure steps
- **Standards Compliance**: AI suggests consistent formatting

---

## 🚀 Implementation Plan

### **Week 1: Foundation + Basic CRUD**
```sql
-- Simple document schema
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT,                    -- Markdoc content
  category VARCHAR(50),            -- "SOP", "Policy", "Training", "Reference"
  department VARCHAR(50),          -- "Clinical", "Admin", "Finance", etc.
  status VARCHAR(20) DEFAULT 'draft', -- "draft", "approved", "archived"
  approval_required BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  tags TEXT[],                     -- Simple tagging system
  search_vector tsvector,          -- Full-text search
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple categories table
CREATE TABLE document_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES document_categories(id)
);
```

```typescript
// Basic document interface using existing patterns
export default function DocumentsApp() {
  return (
    <StaffPortalLayout currentApp="docs">
      <div className="p-6">
        <PageHeader title="Document Hub" />
        <DocumentSearch />
        <DocumentList />
        <DocumentEditor />
      </div>
    </StaffPortalLayout>
  );
}
```

### **Week 2: Markdoc Integration**
```typescript
// Create @ganger/markdoc package
packages/markdoc/
├── src/
│   ├── client/
│   │   ├── MarkdocRenderer.tsx    -- Render markdoc content
│   │   ├── MarkdocEditor.tsx      -- Simple editor with preview
│   │   └── medical-tags.tsx       -- Medical-specific components
│   ├── server/
│   │   ├── compiler.ts            -- Server-side markdoc compilation
│   │   └── validator.ts           -- Content validation
│   └── types/
│       └── index.ts               -- Shared types

// Medical tags for markdoc
const medicalTags = {
  'sop-warning': {
    render: 'SOPWarning',
    attributes: {
      type: { type: String, required: true },
      severity: { type: String, default: 'medium' }
    }
  },
  'approval-required': {
    render: 'ApprovalRequired',
    attributes: {
      role: { type: String, required: true }
    }
  },
  'procedure-step': {
    render: 'ProcedureStep',
    attributes: {
      number: { type: Number, required: true },
      critical: { type: Boolean, default: false }
    }
  }
};
```

### **Week 3: Basic Search + Staff Portal Integration**
```typescript
// Simple document operations using existing patterns
import { DataTable, Input, Button } from '@ganger/ui';
import { useStaffAuth } from '@ganger/auth/staff';
import { MarkdocRenderer, MarkdocEditor } from '@ganger/markdoc';

const DocumentList = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use existing data table component
  return (
    <div className="space-y-4">
      <Input
        placeholder="Search documents..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <DataTable
        data={documents}
        columns={documentColumns}
        onRowClick={handleDocumentClick}
      />
    </div>
  );
};
```

### **Week 4-5: AI Consolidation Package**
```typescript
// Create @ganger/ai package for document intelligence
packages/ai/
├── src/
│   ├── server/
│   │   ├── consolidator.ts        -- Document consolidation logic
│   │   ├── search-enhancer.ts     -- AI-powered search
│   │   └── duplicate-detector.ts  -- Find duplicate documents
│   └── types/
│       └── index.ts               -- AI operation types

// AI consolidation interface
interface DocumentConsolidator {
  findDuplicates(documents: Document[]): Promise<DuplicateGroup[]>;
  suggestMerge(duplicates: Document[]): Promise<ConsolidatedDocument>;
  enhanceSearch(query: string, documents: Document[]): Promise<Document[]>;
  analyzeGaps(documents: Document[]): Promise<GapAnalysis>;
}

// Implementation using OpenAI/Claude API
export class AIDocumentConsolidator implements DocumentConsolidator {
  async findDuplicates(documents: Document[]): Promise<DuplicateGroup[]> {
    // Use AI to identify similar documents by content and title
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Identify groups of duplicate or highly similar medical documents"
      }, {
        role: "user", 
        content: JSON.stringify(documents.map(d => ({ id: d.id, title: d.title, content: d.content.substring(0, 500) })))
      }]
    });
    
    return parseAIDuplicates(response.choices[0].message.content);
  }
}
```

### **Week 6: Polish + Approval Workflow**
```typescript
// Simple approval system using existing auth patterns
const approveDocument = async (documentId: string) => {
  const { user } = useStaffAuth();
  
  // Use existing role checking
  if (!['manager', 'superadmin'].includes(user.role)) {
    throw new Error('Only managers can approve documents');
  }
  
  // Use existing database patterns
  const { error } = await supabase
    .from('documents')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', documentId);
  
  if (!error) {
    // Use existing communication hub for notifications
    await notifyDocumentApproval(documentId, user);
  }
};
```

---

## 🔐 Authentication & Permissions

### **Simple Role-Based Access**
```typescript
// Use existing role system - no changes needed
type DocumentPermission = {
  view: ['superadmin', 'manager', 'provider', 'nurse', 'medical_assistant', 'user'];
  create: ['superadmin', 'manager', 'provider', 'nurse', 'medical_assistant'];
  edit: ['superadmin', 'manager', 'provider', 'nurse', 'medical_assistant'];
  approve: ['superadmin', 'manager'];
  delete: ['superadmin', 'manager'];
};

// Simple approval workflow
interface ApprovalWorkflow {
  documentId: string;
  status: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvalDate?: string;
  notes?: string;
}
```

---

## 📊 Feature Breakdown

### **Core Features (Week 1-3 - MVP)**
- ✅ **Document CRUD**: Create, read, update, delete documents
- ✅ **Markdoc Authoring**: Structured document creation with medical tags
- ✅ **Basic Search**: Text search across title and content
- ✅ **Categories**: Organize by SOP, Policy, Training, Reference
- ✅ **Simple Approval**: Manager approval for selected documents
- ✅ **Staff Portal Integration**: Available at staff.gangerdermatology.com/docs

### **AI Features (Week 4-6 - Value Add)**
- 🤖 **Duplicate Detection**: AI finds similar documents for consolidation
- 🤖 **Content Merging**: AI suggests merged documents from duplicates
- 🤖 **Smart Search**: AI-enhanced search with context understanding
- 🤖 **Gap Analysis**: AI identifies missing procedures and documentation

### **Nice-to-Have (Future)**
- 📎 **File Attachments**: PDF attachments via Supabase Storage
- 📧 **Approval Notifications**: Email/Slack notifications via existing communication hub
- 📊 **Usage Analytics**: Track which documents are accessed most
- 📤 **Export Options**: PDF generation of document collections

---

## 🎯 Success Criteria

### **MVP Success (Week 3)**
- [ ] All staff can access documents at staff.gangerdermatology.com/docs
- [ ] Documents can be created, edited, and organized by category
- [ ] Markdoc renders medical tags correctly
- [ ] Basic search returns relevant results
- [ ] Manager approval workflow prevents unauthorized changes
- [ ] Platform integration follows existing patterns (TypeScript 0 errors)

### **AI Success (Week 6)**
- [ ] AI identifies 80%+ of true duplicate documents
- [ ] AI consolidation suggestions save 50+ hours of manual work
- [ ] AI-enhanced search improves result relevance by 60%+
- [ ] Gap analysis identifies 20+ missing procedure documents

### **6-Month Success**
- [ ] 90% staff adoption for procedure lookup
- [ ] Document volume reduced by 60% through AI consolidation
- [ ] Staff confidence in documentation accuracy reaches 95%
- [ ] Average time to find procedures reduced by 80%

---

## 💡 Implementation Notes

### **What We're NOT Building**
- ❌ 3D visualization of documents
- ❌ Complex Git backend integration  
- ❌ Multiple new @ganger packages (only markdoc + ai)
- ❌ Complex approval matrices
- ❌ Advanced diagramming tools
- ❌ External system integrations (initially)

### **What We ARE Building**
- ✅ Simple, reliable document storage and retrieval
- ✅ Markdoc for consistent, structured authoring
- ✅ AI consolidation to eliminate duplicate work
- ✅ Basic approval workflow for quality control
- ✅ Integration with existing staff portal

### **Why This Approach Works**
1. **Solves Core Problem**: Eliminates scattered, outdated documentation
2. **Builds on Success**: Uses proven Ganger Platform patterns
3. **Quick Value**: MVP delivers value in 3 weeks
4. **AI Labor Savings**: Hundreds of hours saved through consolidation
5. **Future-Flexible**: Can add features based on actual usage

---

## 🚀 Deployment

### **Environment Variables (Add to Existing)**
```bash
# Document Management specific (ADD TO EXISTING PLATFORM CONFIG)
OPENAI_API_KEY=sk-xxxxxxxxxxxx                   # AI consolidation features
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx           # Alternative AI provider
DOCUMENT_AI_MODEL=gpt-4                         # AI model for consolidation
DOCUMENT_MAX_CONSOLIDATION_SIZE=10              # Max docs to consolidate at once

# All other environment variables already exist in platform
```

### **Database Migration**
```bash
# Add to existing Supabase
npx supabase migration new document_management
npx supabase db push
```

### **Deployment Command**
```bash
# Uses existing platform deployment
npm run build:docs
npm run deploy:staff-portal
```

---

**🎯 Next Steps:**
1. **Approve simplified approach** (markdoc + AI, eliminate complexity)
2. **Create @ganger/markdoc package** (Week 1)
3. **Build MVP document interface** (Week 2-3)
4. **Add @ganger/ai package** (Week 4-5)
5. **Polish and deploy** (Week 6)

**📊 Expected Outcome:**
- **Week 3**: Staff have reliable document hub
- **Week 6**: AI eliminates hundreds of hours of manual consolidation work
- **3 Months**: Documentation confidence problem solved

*This simplified approach focuses on solving the core documentation problem quickly while adding AI to eliminate the massive manual work of document consolidation.*