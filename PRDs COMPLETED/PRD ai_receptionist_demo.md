# AI Receptionist Demo - Product Requirements Document

## Executive Summary

**Objective**: Create a functional AI receptionist demo to evaluate voice quality, conversation latency, and booking capabilities before building the full production system.

**Leveraging Existing Infrastructure**: 
- ✅ **Twilio Integration**: Active account with Universal Communication Hub
- ✅ **Google Cloud MCP Server**: Speech services ready via existing MCP
- ✅ **ModMed FHIR Capability**: Integration patterns proven in platform
- ✅ **Supabase Infrastructure**: Database, auth, real-time, storage ready
- ✅ **Universal Hub Architecture**: Proven integration patterns for external services
- ✅ **Quality Gates**: Automated TypeScript/build verification prevents production bugs
- ✅ **Monorepo Structure**: Established patterns for rapid feature development

## Demo Architecture

### Technology Stack (Leveraging Existing Platform)
- **Voice Processing**: Google Cloud Speech APIs (via existing Google Cloud MCP server)
- **Conversation AI**: Google Vertex AI Gemini Pro (via existing Google Cloud MCP server)
- **Phone Integration**: Twilio Voice (via existing Universal Communication Hub)
- **Backend**: Next.js API routes (following existing app patterns in monorepo)
- **Database**: Existing Supabase infrastructure with RLS policies
- **Authentication**: Existing @ganger/auth for admin dashboard
- **Quality Assurance**: Existing automated quality gates and TypeScript enforcement

### System Flow
```
Incoming Call → Twilio → Webhook → Speech-to-Text → 
Gemini Pro → Appointment Logic → Text-to-Speech → 
Twilio → Caller
```

## Functional Requirements

### Core Demo Capabilities

**Phase 1: Basic Conversation (MVP Demo)**
- Answer incoming calls with professional greeting
- Handle basic appointment inquiries
- Demonstrate natural conversation flow
- Mock appointment availability checking
- Graceful escalation to human when needed

**Phase 2: Enhanced Demo (If Phase 1 Successful)**
- Real appointment slot checking (mock calendar)
- Basic patient information capture
- Appointment confirmation workflow
- SMS confirmation (via existing Twilio)

### Conversation Flows

**Primary Flow: New Appointment Request**
```
AI: "Thank you for calling Ganger Dermatology. How can I help you today?"
Patient: "I need an appointment for a skin concern"
AI: "I'd be happy to help schedule that. Can you describe the concern briefly?"
Patient: "I have a mole that's changed color"
AI: "That sounds like something Dr. Ganger should see promptly. Let me check our availability for this week..."
[Mock calendar check]
AI: "I have an opening tomorrow at 2 PM or Thursday at 10 AM. Which works better?"
```

**Escalation Triggers**
- Patient sounds distressed or urgent
- Complex medical questions
- Multiple appointment requests
- Technical difficulties
- Patient requests human assistance

### Technical Implementation

**New Components to Build**
1. **Voice Webhook Handler** (`/api/voice/incoming`) - ~2 hours
2. **Speech Processing Integration** (using existing Google Cloud MCP) - ~3 hours
3. **Conversation Manager** (Gemini Pro via existing MCP) - ~4 hours
4. **Mock Appointment Service** (following existing database patterns) - ~2 hours
5. **Call State Management** (using existing session patterns) - ~2 hours

**Total New Development: ~13 hours (1.5 days)**

**Leveraging Existing Infrastructure**
- ✅ Universal Communication Hub (Twilio integration ready)
- ✅ Google Cloud MCP server (Speech services ready)
- ✅ Supabase database with RLS policies (call logging ready)
- ✅ @ganger/auth authentication (admin dashboard ready)
- ✅ Quality gates (TypeScript/build verification automatic)
- ✅ Monorepo patterns (rapid app development proven)

## Technical Specifications

### API Endpoints

**Voice Webhook** (`/api/voice/incoming`)
```typescript
interface VoiceWebhookRequest {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: string;
}

interface VoiceWebhookResponse {
  response: TwiMLResponse;
  actions: VoiceAction[];
}
```

**Speech Processing** (`/api/voice/process-speech`)
```typescript
interface SpeechProcessingRequest {
  callSid: string;
  audioUrl: string;
  conversationContext: ConversationContext;
}

interface SpeechProcessingResponse {
  transcription: string;
  aiResponse: string;
  audioUrl: string;
  nextAction: 'continue' | 'escalate' | 'end';
}
```

### Database Schema

**Demo Call Logs**
```sql
CREATE TABLE demo_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT UNIQUE NOT NULL,
  caller_phone TEXT NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  conversation_transcript JSONB,
  outcome TEXT, -- 'completed', 'escalated', 'dropped'
  escalation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Mock Appointments**
```sql
CREATE TABLE demo_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT REFERENCES demo_call_logs(call_sid),
  appointment_time TIMESTAMPTZ,
  patient_concern TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Configuration

**Environment Variables**
```bash
# Existing (already configured)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# New for demo
DEMO_PHONE_NUMBER=+1...  # Twilio number for demo
DEMO_MODE=true
ESCALATION_PHONE=+1...   # Number to transfer calls
```

## Demo Success Metrics

### Technical Performance
- **Latency**: < 2 seconds from speech to response
- **Voice Quality**: Clear, natural-sounding speech
- **Accuracy**: >90% speech recognition accuracy
- **Uptime**: 99% during demo period

### Conversation Quality
- **Natural Flow**: Conversations feel natural, not robotic
- **Context Retention**: AI remembers conversation context
- **Appropriate Escalation**: Escalates when it should
- **Professional Tone**: Maintains medical office professionalism

### Functional Validation
- **Appointment Booking**: Can successfully book mock appointments
- **Information Capture**: Accurately captures patient information
- **Conflict Handling**: Gracefully handles booking conflicts
- **Integration**: SMS confirmations work properly

## Implementation Plan

### Day 1: Setup & Basic Call Handling (4 hours)
**Leverage Existing Infrastructure**
- Create new app: `apps/ai-receptionist-demo` (following established monorepo patterns)
- Set up voice webhook using Universal Communication Hub patterns
- Configure Twilio number via existing Twilio integration
- Test basic call answer/hangup using existing quality gates

### Day 2: Speech Integration (4 hours)  
**Use Existing Google Cloud MCP**
- Integrate Speech-to-Text via existing Google Cloud MCP server
- Integrate Text-to-Speech via existing Google Cloud MCP server
- Test voice quality and latency using existing performance monitoring
- Implement streaming using established patterns

### Day 3: AI Conversation (5 hours)
**Leverage Existing MCP Architecture**
- Connect Vertex AI Gemini Pro via existing Google Cloud MCP server
- Create conversation prompts following existing AI workflow patterns
- Implement mock appointment logic using existing database patterns
- Test complete conversation flow with existing verification gates

**Total Implementation: 13 hours across 3 days**

*This timeline leverages the mature Ganger Platform infrastructure, eliminating weeks of infrastructure setup that would be required for greenfield development.*

## File Structure (Following Established Patterns)

```
apps/ai-receptionist-demo/
├── pages/
│   ├── api/voice/
│   │   ├── incoming.ts           # Voice webhook (Universal Hub pattern)
│   │   ├── process-speech.ts     # Speech processing (Google MCP)
│   │   └── escalate.ts          # Human escalation (Twilio Hub)
│   └── index.tsx                # Admin dashboard (existing auth)
├── src/
│   ├── services/
│   │   ├── speechService.ts      # Google MCP integration
│   │   ├── conversationService.ts # Gemini Pro via MCP
│   │   ├── appointmentService.ts  # Database service (@ganger/db)
│   │   └── voiceService.ts       # Universal Communication Hub
│   ├── types/
│   │   └── voice.ts             # TypeScript definitions
│   └── utils/
│       ├── twiml.ts             # TwiML helpers
│       └── conversationState.ts  # Session management
├── package.json                 # Workspace dependencies
└── README.md                   # Following documentation standards
```

*This structure follows the established Ganger Platform patterns for rapid development and automatic quality enforcement.*

## Risk Mitigation

### Technical Risks
**Voice Latency**: Use streaming APIs and optimize response times
**Speech Recognition**: Implement fallback to DTMF input
**Service Downtime**: Build failover to human operator
**Integration Issues**: Use existing MCP patterns proven in platform

### Business Risks
**Poor Voice Quality**: Test extensively with different phone types
**Inappropriate Responses**: Implement strict conversation guardrails
**HIPAA Concerns**: Log minimal PHI, implement proper security
**Cost Overruns**: Set strict usage limits for demo period

## Success Criteria & Next Steps

### Demo Success Criteria
1. ✅ Answer calls reliably
2. ✅ Natural conversation flow
3. ✅ Successful appointment booking
4. ✅ Appropriate escalation
5. ✅ <2 second response latency
6. ✅ Professional voice quality

### Production Decision Factors
If demo successful, proceed with:
- Full ModMed FHIR integration
- Real appointment calendar integration
- Advanced conversation training
- HIPAA compliance implementation
- Multi-location support
- Production monitoring

### Investment Decision
**Demo Cost**: ~$200-500 in API costs (3 days of testing)
**Production Build Cost**: ~$3,000-8,000 development (62-90 hours)
**Ongoing Operational Cost**: ~$67/day as previously calculated

*Costs significantly reduced due to existing infrastructure eliminating weeks of setup work required for greenfield development.*

**ROI Threshold**: If demo shows >80% successful appointment bookings and positive user feedback, proceed to production.

## Conclusion

This demo leverages the mature Ganger Platform infrastructure to validate the AI receptionist concept with **minimal new development**. The established Universal Hub architecture, MCP integrations, and quality gates provide a **3-day path to working demo** compared to weeks required for greenfield development.

**Key Infrastructure Advantages**:
- ✅ Proven Universal Hub patterns for external service integration
- ✅ Google Cloud MCP server eliminates API setup complexity  
- ✅ Existing Twilio integration via Universal Communication Hub
- ✅ Automated quality gates ensure production-ready code
- ✅ Supabase infrastructure handles data/auth requirements
- ✅ Monorepo patterns enable rapid app development

**Competitive Advantage**: Your platform's maturity means you can iterate and deploy AI receptionist capabilities **10x faster** than competitors building from scratch.