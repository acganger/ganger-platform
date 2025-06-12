# PRD: AI-Powered Phone Agent & Patient Communication System - Part 1: Core AI Engine & Conversation Management
*Ganger Platform Standard Application - Backend AI Services & Database*

## 📋 Document Information
- **Application Component**: Core AI Engine & Conversation Management (Part 1 of 3)
- **Development Team**: Backend AI/Database Team
- **Project Location**: `/mnt/q/Projects/ganger-platform/packages/ai/` + Database migrations
- **Priority**: High
- **Development Timeline**: 4-5 weeks
- **Dependencies**: @ganger/db, @ganger/utils, @ganger/integrations
- **Integration Requirements**: AWS Bedrock (Claude 3.5 Sonnet), ModMed FHIR, Time MCP
- **Compliance Requirements**: HIPAA, SOC 2 Type II

---

## 🎯 Component Overview

### **Purpose Statement**
Develop the core AI conversation engine and database infrastructure that powers intelligent patient call handling. This includes the conversational AI processing, intent recognition, patient context management, and all backend database schemas needed to support the phone agent system.

### **Scope Boundaries**
**✅ THIS TEAM HANDLES:**
- AI conversation processing and intent recognition
- Database schema design and migrations
- Patient context management and data storage
- Conversation turn processing and storage
- ModMed integration for patient data
- AI training data management
- Backend API endpoints for AI processing
- HIPAA-compliant data handling and audit logging

**❌ NOT THIS TEAM (Other Parts):**
- Frontend UI components and dashboards (Part 2)
- 3CX VoIP integration and call routing (Part 3)
- Real-time call monitoring interfaces (Part 2)
- Payment processing frontend (Part 2)

### **Success Metrics**
**AI Performance (Measured Real-time):**
- **Intent Recognition Accuracy**: >95% for trained conversation patterns
- **Response Latency**: <2 seconds for AI conversation processing via AWS Bedrock
- **Confidence Score Accuracy**: <0.1 deviation from human assessment
- **Context Preservation**: 100% conversation context retention across turns

**Database Performance (Measured Real-time):**
- **Patient Lookup Speed**: <500ms for ModMed patient data retrieval
- **Conversation Storage**: <100ms for conversation turn persistence
- **Data Integrity**: Zero data loss, 100% HIPAA audit compliance
- **Concurrent Handling**: Support 100+ simultaneous conversations

---

## 🏗️ Technical Architecture

### **Project Structure**
```
/mnt/q/Projects/ganger-platform/packages/ai/
├── src/
│   ├── conversation/
│   │   ├── ConversationEngine.ts
│   │   ├── IntentRecognitionService.ts
│   │   ├── ContextManager.ts
│   │   └── TurnProcessor.ts
│   ├── services/
│   │   ├── VoiceProcessingService.ts
│   │   ├── SentimentAnalysisService.ts
│   │   ├── MedicalVocabularyProcessor.ts
│   │   └── ModMedPatientService.ts
│   ├── training/
│   │   ├── TrainingDataManager.ts
│   │   ├── ModelOptimizer.ts
│   │   └── FeedbackProcessor.ts
│   ├── types/
│   │   ├── conversation.ts
│   │   ├── patient.ts
│   │   └── ai-models.ts
│   └── index.ts

/mnt/q/Projects/ganger-platform/supabase/migrations/
├── 20250612000001_ai_phone_agent_tables.sql
├── 20250612000002_conversation_tables.sql
├── 20250612000003_patient_context_tables.sql
├── 20250612000004_scheduling_tables.sql
├── 20250612000005_payment_tables.sql
└── 20250612000006_ai_policies_and_indexes.sql
```

### **Core AI Package Structure**
```typescript
// /packages/ai/src/index.ts
export { 
  AIConversationEngine, 
  VoiceProcessingService,
  IntentRecognitionService,
  SentimentAnalysisService,
  MedicalVocabularyProcessor,
  ConversationContextManager
} from './conversation';

export { 
  ModMedPatientService,
  TrainingDataManager,
  ModelOptimizer,
  FeedbackProcessor
} from './services';

export type {
  ConversationTurn,
  PatientContext,
  AIResponse,
  IntentResult,
  ConfidenceScore
} from './types';
```

---

## 🗄️ Database Schema Implementation

### **Required Tables (Your Team Implements)**
```sql
-- /supabase/migrations/20250612000001_ai_phone_agent_tables.sql
CREATE TABLE phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT UNIQUE NOT NULL, -- 3CX call identifier
  caller_phone TEXT NOT NULL,
  caller_name TEXT,
  patient_id TEXT, -- ModMed patient ID
  
  -- Call management
  call_direction TEXT NOT NULL CHECK (call_direction IN ('inbound', 'outbound')),
  call_status TEXT NOT NULL DEFAULT 'active' CHECK (call_status IN ('active', 'completed', 'transferred', 'abandoned')),
  location TEXT NOT NULL CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- AI handling
  ai_handled BOOLEAN DEFAULT TRUE,
  ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score BETWEEN 0 AND 1),
  resolution_type TEXT CHECK (resolution_type IN ('resolved', 'transferred', 'callback_scheduled')),
  
  -- Quality metrics
  patient_satisfaction_score INTEGER CHECK (patient_satisfaction_score BETWEEN 1 AND 5),
  quality_score DECIMAL(5,2), -- Supervisor rating 0-100
  
  -- Transfer details
  transfer_reason TEXT,
  transferred_to TEXT,
  escalation_required BOOLEAN DEFAULT FALSE,
  
  -- Recording and compliance
  recording_url TEXT,
  transcript_url TEXT,
  recording_reviewed BOOLEAN DEFAULT FALSE,
  hipaa_compliant BOOLEAN DEFAULT TRUE,
  
  -- Cost analysis
  cost_per_call DECIMAL(6,2),
  revenue_attributed DECIMAL(8,2),
  
  -- HIPAA compliance and audit fields
  hipaa_accessed_by UUID REFERENCES users(id),
  hipaa_access_reason TEXT,
  hipaa_data_retention_until DATE GENERATED ALWAYS AS (started_at + INTERVAL '7 years') STORED,
  phi_sanitized BOOLEAN DEFAULT FALSE,
  phi_sanitization_log JSONB,
  compliance_review_required BOOLEAN DEFAULT FALSE,
  compliance_reviewed_at TIMESTAMPTZ,
  compliance_reviewed_by UUID REFERENCES users(id),
  
  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- /supabase/migrations/20250612000002_conversation_tables.sql
CREATE TABLE conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES phone_calls(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('ai', 'patient', 'staff')),
  intent_detected TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  user_input TEXT,
  ai_response TEXT,
  context_data JSONB,
  processing_time_ms INTEGER,
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score BETWEEN -1 AND 1),
  emotion_detected TEXT,
  escalation_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- /supabase/migrations/20250612000003_patient_context_tables.sql
CREATE TABLE patient_call_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES phone_calls(id) ON DELETE CASCADE,
  patient_id TEXT,
  identification_method TEXT CHECK (identification_method IN ('phone_lookup', 'voice_verification', 'manual')),
  patient_data JSONB NOT NULL,
  relationship_type TEXT CHECK (relationship_type IN ('self', 'parent', 'spouse', 'caregiver')),
  authorization_verified BOOLEAN DEFAULT FALSE,
  hipaa_compliant BOOLEAN DEFAULT TRUE,
  access_level TEXT DEFAULT 'basic' CHECK (access_level IN ('basic', 'full', 'restricted')),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional tables for scheduling, payments, waitlist (see full schema in comments)
```

### **Performance Optimization**
```sql
-- /supabase/migrations/20250612000006_ai_policies_and_indexes.sql
-- Performance optimization indexes
CREATE INDEX idx_phone_calls_caller ON phone_calls(caller_phone);
CREATE INDEX idx_phone_calls_patient ON phone_calls(patient_id);
CREATE INDEX idx_phone_calls_status ON phone_calls(call_status);
CREATE INDEX idx_phone_calls_date ON phone_calls(started_at);
CREATE INDEX idx_conversation_turns_call ON conversation_turns(call_id, turn_number);
CREATE INDEX idx_conversation_turns_intent ON conversation_turns(intent_detected);

-- Row Level Security policies
ALTER TABLE phone_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_call_context ENABLE ROW LEVEL SECURITY;

-- HIPAA-compliant access policies
CREATE POLICY "Users can access call data based on role" ON phone_calls
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR (
      auth.jwt() ->> 'role' IN ('staff', 'clinical_staff') -- Location-based access
      AND location IN (
        SELECT location_name FROM location_staff 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );
```

---

## 🔌 API Specifications

### **AI Engine Endpoints (Your Team Implements)**
```typescript
// AI Engine endpoints - implement in /packages/ai/src/
POST   /api/ai-engine/conversation   // Process conversation turn
POST   /api/ai-engine/intent         // Intent recognition
POST   /api/ai-engine/sentiment      // Sentiment analysis
POST   /api/ai-engine/training       // AI training data
POST   /api/ai-engine/feedback       // Training feedback processing

// Patient context endpoints
GET    /api/patients/[phone]/lookup  // Patient lookup by phone
GET    /api/patients/[id]/context    // Patient conversation context
POST   /api/patients/[id]/context    // Update patient context
```

### **Core AI Services**
```typescript
// /packages/ai/src/conversation/ConversationEngine.ts
export class AIConversationEngine {
  async processConversationTurn(
    callId: string,
    userInput: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    // Process with AWS Bedrock Claude 3.5 Sonnet
    // Extract intent, generate response, update context
    // Return structured AI response with confidence scores
  }

  async recognizeIntent(
    input: string,
    context: ConversationContext
  ): Promise<IntentResult> {
    // Medical vocabulary processing
    // Intent classification
    // Confidence scoring
  }

  async analyzeSentiment(input: string): Promise<SentimentResult> {
    // Sentiment analysis for patient interaction quality
  }
}

// /packages/ai/src/services/ModMedPatientService.ts
export class ModMedPatientService {
  async lookupPatientByPhone(phone: string): Promise<PatientContext | null> {
    // ModMed FHIR API integration
    // HIPAA-compliant patient data retrieval
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    // ModMed appointment data
  }

  async getPatientBilling(patientId: string): Promise<BillingInfo> {
    // ModMed billing information
  }
}
```

---

## 🧪 Testing Strategy

### **Unit Tests (Your Responsibility)**
```typescript
// Focus on AI conversation logic and database operations
describe('AIConversationEngine', () => {
  test('processes conversation turns with correct intent recognition');
  test('maintains conversation context across multiple turns');
  test('generates appropriate confidence scores');
  test('handles medical vocabulary correctly');
  test('triggers escalation for clinical questions');
  test('preserves HIPAA compliance in all responses');
});

describe('ModMedPatientService', () => {
  test('retrieves patient data securely');
  test('handles patient not found scenarios');
  test('validates HIPAA access permissions');
  test('caches patient data appropriately');
});

describe('Database Operations', () => {
  test('conversation turns are stored correctly');
  test('patient context updates persist');
  test('HIPAA audit logs are generated');
  test('row level security policies work correctly');
});
```

### **Integration Tests**
- AWS Bedrock AI model responses
- ModMed FHIR API integration
- Database performance under load
- HIPAA compliance validation

---

## 🔒 Security & Compliance

### **HIPAA Requirements (Critical)**
- **PHI Protection**: All patient data encrypted at rest and in transit
- **AI Training Compliance**: Zero PHI exposure in training data
- **Audit Logging**: Comprehensive access logs for all patient data
- **Data Retention**: 7-year retention with automatic secure deletion
- **Access Controls**: Role-based access with minimum necessary principle

### **AI Security**
- **Model Security**: Secure AI training data and model protection
- **Conversation Security**: Encrypted conversation data transmission
- **Context Protection**: Secure conversation context storage and retrieval

---

## 📊 Performance Requirements

### **AI Processing Performance**
- **Intent Recognition**: < 300ms for initial classification
- **Response Generation**: < 2 seconds via AWS Bedrock
- **Confidence Calculation**: < 100ms for score generation
- **Context Updates**: < 100ms for conversation context persistence

### **Database Performance**
- **Patient Lookup**: < 500ms for ModMed integration
- **Conversation Storage**: < 100ms for turn persistence
- **Concurrent Conversations**: Support 100+ simultaneous conversations
- **Query Performance**: All queries < 200ms response time

---

## 🚀 Deployment Configuration

### **Environment Variables**
```bash
# AWS Bedrock Configuration
AWS_BEDROCK_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# ModMed Integration
MODMED_FHIR_API_URL=https://api.modmed.com/fhir
MODMED_CLIENT_ID=your-client-id
MODMED_CLIENT_SECRET=your-client-secret

# Database Configuration (inherited from platform)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# HIPAA Compliance
HIPAA_COMPLIANCE_ENABLED=true
PHI_ENCRYPTION_KEY=your-encryption-key
AUDIT_LOG_LEVEL=comprehensive
```

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] AI conversation engine processes test conversations with >90% accuracy
- [ ] ModMed patient data retrieval working in < 1 second
- [ ] Database schema supports all conversation scenarios
- [ ] HIPAA compliance validated with comprehensive audit logging
- [ ] All conversation turns stored and retrievable with full context
- [ ] AI confidence scores correlate with human assessment

### **Performance Targets**
- Intent recognition accuracy >95% for trained patterns
- Patient lookup speed <500ms average
- Conversation processing <2 seconds end-to-end
- Database operations <200ms response time
- Zero HIPAA compliance violations
- Support 100+ concurrent conversations

---

## 📚 Documentation Requirements

### **Technical Documentation**
- [ ] AI conversation engine architecture and configuration
- [ ] Database schema documentation with relationships
- [ ] ModMed FHIR integration patterns and error handling
- [ ] HIPAA compliance procedures and audit logging
- [ ] Performance optimization guidelines
- [ ] AI training data management procedures

### **API Documentation**
- [ ] AI engine endpoint specifications
- [ ] Patient lookup service documentation
- [ ] Conversation context management APIs
- [ ] Error handling and retry patterns

---

## 🔄 Integration Points with Other Teams

### **Provides to Team 2 (Frontend Dashboard)**
- Conversation data via API endpoints
- Real-time conversation updates via Supabase subscriptions
- Patient context for dashboard display
- AI confidence metrics for UI indicators

### **Provides to Team 3 (VoIP Integration)**
- Processed conversation responses for voice synthesis
- Call transfer triggers and escalation signals
- Patient identification and context data
- Call completion and status updates

### **Receives from Other Teams**
- Raw voice input from Team 3 (VoIP system)
- User interactions and feedback from Team 2 (Frontend)
- Call initiation and termination signals from Team 3

---

*This component focuses exclusively on the AI conversation engine, database infrastructure, and patient data management. Teams 2 and 3 will handle frontend interfaces and VoIP integration respectively.*