# @ganger/ai - AI Workers Package

Healthcare-optimized AI capabilities for the Ganger Platform with HIPAA compliance, cost controls, and comprehensive monitoring.

## 🚀 Quick Start

### Server-Side Usage

```typescript
import { createGangerAI } from '@ganger/ai/server';

// Create AI client instance
const ai = createGangerAI(env, {
  app: 'ai-receptionist',
  context: 'patient_communication',
  hipaaCompliant: true,
  user: currentUser
});

// Chat with AI
const response = await ai.chat({
  messages: [
    { role: 'user', content: 'How do I schedule an appointment?' }
  ]
});

console.log(response.data); // AI response
```

### Client-Side Usage (React)

```typescript
import { useAI, AIChatComponent } from '@ganger/ai/client';

function MyComponent() {
  const { chat, loading, error, usage } = useAI({
    app: 'clinical-staffing',
    context: 'business_intelligence'
  });

  const handleChat = async () => {
    try {
      const response = await chat({
        messages: [
          { role: 'user', content: 'Analyze today\'s staffing needs' }
        ]
      });
      console.log('AI Response:', response.data);
    } catch (error) {
      console.error('AI Error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleChat} disabled={loading}>
        Get AI Analysis
      </button>
      
      {/* Or use the pre-built chat component */}
      <AIChatComponent 
        config={{ app: 'clinical-staffing' }}
        onMessage={(message, response) => {
          console.log('New message:', message, response);
        }}
      />
      
      <p>Remaining budget: ${usage.remainingBudget}</p>
    </div>
  );
}
```

## 📋 Features

### ✅ Core Features
- **Healthcare-optimized AI models** - Specialized model selection for medical contexts
- **HIPAA-compliant safety filtering** - Automatic PHI detection and content safety
- **Real-time cost tracking** - Monitor usage and costs across all applications
- **Rate limiting & budget controls** - Prevent runaway costs with automatic limits
- **Comprehensive monitoring** - Daily reports and real-time alerts
- **React components** - Pre-built UI components for chat and monitoring

### 🛡️ Safety & Compliance
- **PHI Detection** - Automatic detection of Protected Health Information
- **Content Safety** - Multi-layered safety filtering for medical content
- **Audit Logging** - Complete audit trails for HIPAA compliance
- **Emergency Controls** - Automatic shutoffs for cost and safety violations

### 💰 Cost Management
- **Budget Controls** - Per-app daily budget limits with warnings
- **Usage Monitoring** - Real-time usage tracking and projections
- **Cost Optimization** - Intelligent model selection for cost efficiency
- **Emergency Shutoffs** - Automatic stops when limits are exceeded

## 🏗️ Architecture

### Package Structure
```
packages/ai/
├── src/
│   ├── client/          # React hooks and components (client-side)
│   │   ├── hooks.ts     # useAI, useAIChat, useAIUsage hooks
│   │   ├── components.tsx # AIChatComponent, AIUsageMonitor
│   │   └── index.ts     # Client exports
│   ├── server/          # Server-side AI functionality
│   │   ├── client.ts    # Main GangerAI class
│   │   ├── safety.ts    # HIPAA safety filtering
│   │   ├── monitoring.ts # Usage tracking and reporting
│   │   └── index.ts     # Server exports
│   ├── shared/          # Shared types and constants
│   │   ├── types.ts     # TypeScript definitions
│   │   ├── constants.ts # Model configs and limits
│   │   └── index.ts     # Shared exports
│   └── index.ts         # Main package entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Integration Points
- **@ganger/auth** - Authentication and user management
- **@ganger/db** - Database operations and audit logging
- **@ganger/utils** - Shared utilities and validation
- **@ganger/ui** - UI components and design system

## 🤖 Supported AI Models

### Tier 1 - Production Ready
- **llama-4-scout-17b-16e-instruct** - Medical conversation & decision support
- **llama-3.3-70b-instruct-fp8-fast** - Fast real-time chat
- **llama-guard-3-8b** - HIPAA safety & compliance (mandatory)

### Tier 2 - Feature Enhancement
- **qwq-32b** - Complex business reasoning (EOS L10, analytics)
- **llama-3.2-11b-vision-instruct** - Document & image processing
- **whisper-large-v3-turbo** - Speech-to-text
- **melotts** - Text-to-speech
- **bge-m3** - Embeddings for search
- **bge-reranker-base** - Search result reranking

## 📊 Usage Monitoring

### Real-Time Tracking
- Request counts and success rates
- Cost tracking with budget projections
- Model performance metrics
- Safety score monitoring

### Daily Reports
Automated daily reports include:
- Total requests and costs
- Usage breakdown by app and model
- Performance metrics
- Budget status and projections
- Alerts and recommendations

### Budget Controls
- Per-app daily budget limits
- Real-time cost monitoring
- Automatic warnings at 75% and 90%
- Emergency shutoffs at 95%
- Monthly budget projections

## 🔒 HIPAA Compliance

### Safety Filtering Pipeline
1. **Pre-processing** - Content analysis before AI processing
2. **PHI Detection** - Automatic detection of protected health information
3. **Safety Scoring** - Content safety assessment (0-1 scale)
4. **Compliance Check** - HIPAA compliance validation
5. **Audit Logging** - Complete audit trail for all interactions

### Protected Health Information (PHI) Detection
- Names with medical context
- Addresses and geographic locations
- Dates (birth, admission, discharge)
- Phone numbers and email addresses
- Social Security numbers
- Medical record numbers
- Account numbers
- Device identifiers
- Biometric identifiers

### Compliance Levels
- **none** - No PHI restrictions
- **standard** - Basic HIPAA compliance (default)
- **strict** - Enhanced PHI protection
- **audit** - Full audit trail required

## 🚨 Error Handling

### Error Types
```typescript
import { 
  AIError, 
  RateLimitError, 
  BudgetExceededError, 
  SafetyViolationError,
  ModelUnavailableError 
} from '@ganger/ai/server';

try {
  const response = await ai.chat(request);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof BudgetExceededError) {
    console.log(`Budget exceeded: $${error.currentUsage}/$${error.limit}`);
  } else if (error instanceof SafetyViolationError) {
    console.log(`Safety violation. Score: ${error.safetyScore}`);
  }
}
```

## 🔧 API Reference

### Server-Side API

#### `createGangerAI(env, config)`
Creates a new AI client instance.

**Parameters:**
- `env` - Environment variables (Cloudflare, Supabase)
- `config` - AI configuration options

**Returns:** `GangerAI` instance

#### `GangerAI.chat(request)`
Send chat request to AI.

**Parameters:**
- `request.messages` - Array of chat messages
- `request.config` - Optional request configuration

**Returns:** `Promise<AIResponse>`

#### `GangerAI.checkSafety(content)`
Check content safety and PHI detection.

**Parameters:**
- `content.content` - Text content to check
- `content.context` - Use case context

**Returns:** `Promise<SafetyCheckResponse>`

#### `GangerAI.getUsageStats(timeframe)`
Get usage statistics.

**Parameters:**
- `timeframe` - 'hour' | 'day' | 'week'

**Returns:** Usage statistics object

### Client-Side API

#### `useAI(options)`
React hook for AI functionality.

**Parameters:**
- `options.app` - Application context
- `options.context` - Use case context
- `options.onSuccess` - Success callback
- `options.onError` - Error callback

**Returns:**
```typescript
{
  chat: (request) => Promise<AIResponse>,
  loading: boolean,
  error: AIError | null,
  lastResponse: AIResponse | null,
  usage: { requestsToday, costToday, remainingBudget }
}
```

#### `useAIChat(options)`
React hook for chat sessions with history.

**Returns:**
```typescript
{
  messages: ChatMessage[],
  sendMessage: (content: string) => Promise<ChatMessage>,
  clearHistory: () => void,
  loading: boolean,
  error: AIError | null,
  usage: UsageStats
}
```

#### `<AIChatComponent />`
Pre-built chat interface component.

**Props:**
- `config` - AI configuration
- `placeholder` - Input placeholder text
- `onMessage` - Message callback
- `maxMessages` - Maximum message history
- `enableVoice` - Enable voice features
- `enableFileUpload` - Enable file uploads

#### `<AIUsageMonitor />`
Usage monitoring dashboard component.

**Props:**
- `app` - Specific app to monitor
- `timeframe` - 'day' | 'week' | 'month'
- `showCosts` - Show cost information
- `showModels` - Show model usage

## 🔐 Environment Variables

Required environment variables for AI functionality:

```bash
# Cloudflare Workers AI
CLOUDFLARE_AI_TOKEN=your-cloudflare-ai-token
AI_TOKEN=fallback-ai-token

# Supabase (for usage tracking and audit logs)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Custom budget limits
AI_DAILY_BUDGET_OVERRIDE=50.00
AI_MONTHLY_BUDGET_OVERRIDE=1500.00
```

## 🚀 Deployment

### Database Setup
Run the database schema setup:

```sql
-- Import and run the schema
CREATE TABLE IF NOT EXISTS ai_usage_events (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  app TEXT NOT NULL,
  model TEXT NOT NULL,
  user_id UUID,
  request_id TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  response_time INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  error_code TEXT,
  safety_score DECIMAL(3,2),
  contains_phi BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_app ON ai_usage_events(app);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage_events(model);
```

### Next.js API Routes
Create API routes for client-side integration:

```typescript
// pages/api/ai/chat.ts
import { createGangerAI } from '@ganger/ai/server';

export default async function handler(req, res) {
  const ai = createGangerAI(process.env, {
    app: req.body.config?.app || 'staff',
    user: req.user // from authentication middleware
  });

  try {
    const response = await ai.chat(req.body);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message
      }
    });
  }
}
```

### Vercel Deployment
The AI package follows the platform's Vercel distributed deployment strategy:

1. Each app gets AI capabilities via the shared package
2. Environment variables must be set in each Vercel project
3. Database schema is shared across all deployments
4. Usage monitoring aggregates across all apps

## 📈 Performance & Optimization

### Response Time Targets
- **Real-time chat**: <500ms average
- **Complex reasoning**: <2000ms average
- **Safety filtering**: <200ms average

### Cost Optimization
- **Model Selection**: Automatic selection of most cost-effective model
- **Caching**: Response caching for repeated queries
- **Rate Limiting**: Prevents excessive usage
- **Budget Controls**: Automatic cost management

### Monitoring & Alerts
- Real-time usage tracking
- Daily budget notifications
- Performance metric alerts
- Safety violation warnings

## 🆘 Troubleshooting

### Common Issues

**1. Authentication Errors**
```
Error: Authentication required for AI features
```
Solution: Ensure user is authenticated with `@ganger/auth`

**2. Budget Exceeded**
```
Error: Daily AI budget exceeded
```
Solution: Check usage with `useAIUsage()` hook or increase budget limits

**3. Safety Violations**
```
Error: Content safety check failed
```
Solution: Review content for PHI or inappropriate material

**4. Model Unavailable**
```
Error: Model llama-4-scout-17b-16e-instruct is currently unavailable
```
Solution: System will automatically retry with fallback model

### Debug Mode
Enable debug logging:

```typescript
const ai = createGangerAI(env, {
  app: 'your-app',
  debug: true // Enable detailed logging
});
```

## 📚 Examples

### Medical Consultation Assistant
```typescript
const ai = createGangerAI(env, {
  app: 'ai-receptionist',
  context: 'patient_communication',
  hipaaCompliant: true
});

const response = await ai.chat({
  messages: [
    {
      role: 'user',
      content: 'What should I expect during my dermatology appointment?'
    }
  ]
});
```

### Business Intelligence Analysis
```typescript
const ai = createGangerAI(env, {
  app: 'eos-l10',
  context: 'business_intelligence',
  defaultModel: 'qwq-32b'
});

const response = await ai.chat({
  messages: [
    {
      role: 'user',
      content: 'Analyze our Q3 performance metrics and suggest improvements'
    }
  ]
});
```

### Document Processing
```typescript
const ai = createGangerAI(env, {
  app: 'medication-auth',
  context: 'document_processing',
  defaultModel: 'llama-3.2-11b-vision-instruct'
});

const response = await ai.chat({
  messages: [
    {
      role: 'user',
      content: 'Extract key information from this insurance authorization form'
    }
  ]
});
```

## 🤝 Contributing

When contributing to the AI package:

1. **Follow Platform Standards** - Use existing @ganger/* package patterns
2. **Maintain Type Safety** - All code must pass TypeScript compilation
3. **Add Tests** - Include unit tests for new functionality
4. **Update Documentation** - Keep README and code comments current
5. **HIPAA Compliance** - Ensure all changes maintain HIPAA compliance

## 📄 License

This package is part of the Ganger Platform and is proprietary software for internal use at Ganger Dermatology.

---

**Last Updated:** June 27, 2025  
**Version:** 1.0.0  
**Maintainers:** Ganger Platform Development Team