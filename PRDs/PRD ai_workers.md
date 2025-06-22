# PRD: AI Workers Layer for Ganger Platform

**Document ID**: PRD-AI-WORKERS-001  
**Version**: 1.0  
**Date**: June 19, 2025  
**Status**: Ready for Development  
**Priority**: HIGH  
**Estimated Effort**: 3-4 weeks  

---

## 📋 **Executive Summary**

Create a centralized AI Workers layer that provides healthcare-optimized LLM capabilities to all current and future Ganger Platform applications. This system will offer unified AI services, comprehensive usage monitoring, cost controls, and HIPAA-compliant guardrails across the entire medical practice management platform.

**Key Deliverables:**
- Centralized `@ganger/ai` package with healthcare-optimized model selection
- Daily usage monitoring and cost reporting system
- Intelligent guardrails and rate limiting to prevent runaway costs
- HIPAA-compliant safety filtering and audit trails
- Seamless integration with existing 17 applications

---

## 🎯 **Business Objectives**

### **Primary Goals**
1. **Unified AI Infrastructure**: Single point of AI integration for all 17+ Ganger Platform applications
2. **Cost Predictability**: Daily monitoring and automatic controls to prevent unexpected AI costs
3. **Healthcare Optimization**: Purpose-built AI model selection for medical practice workflows
4. **Compliance Assurance**: HIPAA-compliant AI processing with audit trails
5. **Developer Productivity**: Simple, consistent AI API across all applications

### **Success Metrics**
- **Integration Speed**: New apps can add AI features in <2 hours
- **Cost Control**: AI costs stay within 95% of daily budgets
- **Performance**: <200ms average AI response time across edge locations
- **Reliability**: 99.9% AI service uptime
- **Compliance**: 100% of patient data interactions pass safety filters

---

## 🏥 **Healthcare Context & Requirements**

### **Medical Practice AI Use Cases**
- **Patient Communication**: AI Receptionist handling calls, scheduling, basic inquiries
- **Document Processing**: Insurance verification, prescription scanning, form processing
- **Clinical Decision Support**: Staff scheduling optimization, protocol recommendations
- **Business Intelligence**: EOS L10 analysis, performance insights, strategic planning
- **Compliance Monitoring**: Training content safety, communication filtering
- **Patient Education**: Handout generation, multilingual content, accessibility support

### **HIPAA Compliance Requirements**
- All patient data must be processed through safety-validated models
- Audit trails for all AI interactions involving PHI (Protected Health Information)
- Content filtering to prevent accidental PHI exposure
- Data residency within Cloudflare's HIPAA-compliant infrastructure

---

## 🧠 **Optimal AI Model Selection**

### **Primary Models (Tier 1 - Production Ready)**

**Medical Conversation & Decision Support**
- **Model**: `llama-4-scout-17b-16e-instruct`
- **Use Cases**: AI Receptionist, clinical documentation, complex medical interactions
- **Features**: Native multimodal (text + images), function calling
- **Cost**: ~$0.125 per 1M neurons
- **Applications**: ai-receptionist, clinical-staffing, medication-auth

**Fast Real-Time Chat**
- **Model**: `llama-3.3-70b-instruct-fp8-fast`
- **Use Cases**: Staff portal chat, quick responses, real-time assistance
- **Features**: Optimized for speed, batch processing, function calling
- **Cost**: ~$0.125 per 1M neurons
- **Applications**: All staff-facing apps, platform-dashboard

**HIPAA Safety & Compliance**
- **Model**: `llama-guard-3-8b`
- **Use Cases**: Content safety, PHI detection, compliance filtering
- **Features**: Medical content classification, safety scoring
- **Cost**: ~$0.011 per 1M neurons
- **Applications**: All patient-facing interactions (mandatory)

### **Specialized Models (Tier 2 - Feature Enhancement)**

**Complex Business Reasoning**
- **Model**: `qwq-32b`
- **Use Cases**: EOS L10 analysis, strategic planning, complex scheduling
- **Features**: Multi-step reasoning, business logic optimization
- **Applications**: eos-l10, clinical-staffing, pharma-scheduling

**Document & Image Processing**
- **Model**: `llama-3.2-11b-vision-instruct`
- **Use Cases**: ID verification, prescription scanning, form processing
- **Features**: Medical document understanding, OCR capabilities
- **Applications**: checkin-kiosk, medication-auth, handouts

**Voice Processing**
- **Speech-to-Text**: `whisper-large-v3-turbo`
- **Text-to-Speech**: `melotts`
- **Use Cases**: AI Receptionist calls, accessibility features
- **Applications**: ai-receptionist, checkin-kiosk

**Knowledge & Search**
- **Embeddings**: `bge-m3`
- **Reranking**: `bge-reranker-base`
- **Use Cases**: Medical knowledge search, document retrieval
- **Applications**: All apps (universal search enhancement)

---

## 🏗️ **System Architecture**

### **Layer 1: Centralized AI Package (`@ganger/ai`)**

```typescript
// Unified API for all applications
import { createGangerAI } from '@ganger/ai';

const ai = createGangerAI(env, {
  app: 'ai-receptionist',
  context: 'patient_communication',
  hipaaCompliant: true
});

// Simple, consistent interface
const response = await ai.chat({ 
  messages: [{ role: 'user', content: userInput }] 
});
```

**Package Structure:**
```
packages/ai/
├── src/
│   ├── client.ts          # Main GangerAI class
│   ├── models.ts          # Model configurations
│   ├── monitoring.ts      # Usage tracking
│   ├── safety.ts          # HIPAA compliance
│   ├── guardrails.ts      # Cost controls
│   └── types.ts           # TypeScript definitions
├── package.json
└── README.md
```

### **Layer 2: Application Integration**

**Seamless integration with existing workers:**
```typescript
// In existing apps/ai-receptionist/worker.js
interface Env {
  // Existing environment...
  AI: Ai;                    // Cloudflare Workers AI
  AI_USAGE_LOG: KVNamespace; // Usage tracking
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const ai = createGangerAI(env, AI_RECEPTIONIST_CONFIG);
    
    // Existing logic enhanced with AI
    const response = await ai.chat({
      messages: [{ role: 'user', content: patientQuestion }]
    });
    
    return new Response(response.data);
  }
}
```

### **Layer 3: Monitoring & Control System**

**Real-time usage tracking and daily reporting:**
```typescript
// Automatic usage logging
class AIUsageMonitor {
  async logUsage(usage: AIUsageEvent): Promise<void> {
    // Store in KV for daily aggregation
    await env.AI_USAGE_LOG.put(
      `${Date.now()}-${usage.app}-${usage.model}`,
      JSON.stringify(usage)
    );
  }

  async generateDailyReport(): Promise<DailyAIReport> {
    // Aggregate last 24 hours of usage
    // Calculate costs, identify trends
    // Generate alerts for unusual usage
  }
}
```

---

## 📊 **Usage Monitoring & Reporting**

### **Daily Usage Summary Requirements**

**Automated Daily Report (Delivered at 8:00 AM EST):**

```markdown
# Ganger Platform AI Usage Report
**Date**: June 19, 2025  
**Period**: Last 24 Hours (8 AM - 8 AM EST)

## Executive Summary
- **Total Requests**: 2,847
- **Total Cost**: $23.45
- **Average Response Time**: 185ms
- **Success Rate**: 99.7%

## Usage by Application
| Application | Requests | Cost | Primary Model | Avg Response |
|-------------|----------|------|---------------|--------------|
| AI Receptionist | 1,245 | $12.30 | llama-4-scout | 220ms |
| Clinical Staffing | 543 | $4.20 | qwq-32b | 340ms |
| Check-in Kiosk | 398 | $3.15 | llama-3.2-vision | 180ms |
| EOS L10 | 245 | $2.80 | qwq-32b | 450ms |
| Other Apps | 416 | $1.00 | llama-3.3-fast | 120ms |

## Model Performance
| Model | Requests | Success Rate | Avg Cost/Request |
|-------|----------|--------------|------------------|
| llama-4-scout-17b | 1,245 | 99.8% | $0.0099 |
| qwq-32b | 788 | 99.5% | $0.0087 |
| llama-3.3-70b-fast | 614 | 99.9% | $0.0024 |
| llama-guard-3-8b | 2,847 | 100% | $0.0012 |

## Alerts & Recommendations
🟡 **Warning**: Clinical Staffing usage up 23% vs yesterday
✅ **Good**: All safety checks passed
💡 **Optimization**: Consider caching for repeated EOS L10 queries

## Cost Projections
- **Current Daily Average**: $23.45
- **Monthly Projection**: $703.50
- **Budget Status**: 78% of allocated AI budget
```

### **Real-Time Monitoring Dashboard**

**Integration with Platform Dashboard (`apps/platform-dashboard`):**

```typescript
// Add AI monitoring to existing dashboard
const aiMetrics = {
  currentUsage: await getAIUsageToday(),
  budgetRemaining: calculateBudgetRemaining(),
  activeRequests: getActiveAIRequests(),
  modelPerformance: getModelHealthStatus(),
  alerts: getAIAlerts()
};
```

---

## 🛡️ **Guardrails & Cost Controls**

### **Tier 1: Real-Time Rate Limiting**

**Per-Application Limits:**
```typescript
const RATE_LIMITS = {
  'ai-receptionist': {
    requestsPerMinute: 100,   // High for real-time calls
    requestsPerHour: 2000,
    dailyBudget: 50.00        // $50/day max
  },
  'clinical-staffing': {
    requestsPerMinute: 20,    // Moderate for planning
    requestsPerHour: 500,
    dailyBudget: 20.00        // $20/day max
  },
  'checkin-kiosk': {
    requestsPerMinute: 50,    // Medium for patient flow
    requestsPerHour: 1000,
    dailyBudget: 25.00        // $25/day max
  }
};
```

**Model-Specific Controls:**
```typescript
const MODEL_CONTROLS = {
  'qwq-32b': {
    maxTokens: 4096,          // Limit expensive reasoning
    cooldownBetweenRequests: 2000, // 2 second minimum
    dailyRequestLimit: 200    // Expensive model limits
  },
  'llama-4-scout-17b-16e-instruct': {
    maxTokens: 2048,
    cooldownBetweenRequests: 1000,
    dailyRequestLimit: 1000
  }
};
```

### **Tier 2: Budget-Based Circuit Breakers**

**Automatic Cost Protection:**
```typescript
class BudgetGuardrails {
  async checkBudget(app: string, estimatedCost: number): Promise<boolean> {
    const todaysUsage = await getTodaysUsage(app);
    const dailyLimit = RATE_LIMITS[app].dailyBudget;
    
    // Stop if we're at 95% of daily budget
    if (todaysUsage + estimatedCost > dailyLimit * 0.95) {
      await sendBudgetAlert(app, todaysUsage, dailyLimit);
      return false; // Block request
    }
    
    return true; // Allow request
  }
}
```

### **Tier 3: Emergency Shutoffs**

**Runaway Protection:**
```typescript
const EMERGENCY_TRIGGERS = {
  costPerHour: 100,           // Emergency stop if >$100/hour
  requestsPerMinute: 500,     // Emergency stop if >500 req/min platform-wide
  errorRate: 0.1,             // Emergency stop if >10% error rate
  consecutiveFailures: 10     // Emergency stop after 10 consecutive failures
};
```

**Automatic Recovery:**
```typescript
// Auto-resume after emergency stop when conditions normalize
class EmergencyRecovery {
  async checkRecovery(): Promise<boolean> {
    // Wait 15 minutes, then check if conditions are normal
    // Gradually restore service with reduced limits
    // Full restoration only after 1 hour of normal operation
  }
}
```

---

## 🔒 **HIPAA Compliance & Safety**

### **Mandatory Safety Pipeline**

**All patient-facing interactions:**
```typescript
async function processPatientInteraction(content: string): Promise<AIResponse> {
  // Step 1: Safety check (mandatory)
  const safetyCheck = await ai.checkSafety({
    content: content,
    context: 'patient_communication'
  });
  
  if (!safetyCheck.success || !safetyCheck.data) {
    return { error: 'Content safety violation detected' };
  }
  
  // Step 2: Process with appropriate model
  const response = await ai.chat({
    messages: [{ role: 'user', content: content }]
  });
  
  // Step 3: Log for audit trail
  await logPHIInteraction({
    input: content,
    output: response.data,
    safetyScore: safetyCheck.data,
    timestamp: new Date(),
    model: response.model_used
  });
  
  return response;
}
```

### **Audit Trail Requirements**

**Comprehensive logging for compliance:**
```typescript
interface AIAuditLog {
  requestId: string;
  timestamp: Date;
  application: string;
  model: string;
  inputHash: string;        // Hashed, not raw PHI
  outputHash: string;       // Hashed, not raw PHI
  safetyScore: number;
  containsPHI: boolean;
  userId?: string;
  patientId?: string;       // If applicable
  responseTime: number;
  cost: number;
}
```

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Core Infrastructure (Week 1-2)**

**Week 1: Foundation**
- [ ] Create `packages/ai/` with base client and types
- [ ] Implement core GangerAI class with primary models
- [ ] Set up usage monitoring and KV storage
- [ ] Create basic safety filtering pipeline

**Week 2: Integration**
- [ ] Integrate with first application (AI Receptionist)
- [ ] Implement rate limiting and budget controls
- [ ] Set up daily reporting pipeline
- [ ] Create emergency shutoff mechanisms

### **Phase 2: Platform Rollout (Week 3)**

**Week 3: Application Integration**
- [ ] Integrate with Clinical Staffing (reasoning models)
- [ ] Integrate with Check-in Kiosk (vision models)
- [ ] Integrate with EOS L10 (business intelligence)
- [ ] Implement comprehensive monitoring dashboard

### **Phase 3: Production Hardening (Week 4)**

**Week 4: Production Ready**
- [ ] Complete HIPAA compliance audit
- [ ] Implement advanced guardrails
- [ ] Performance optimization and caching
- [ ] Documentation and developer guides
- [ ] Production deployment and monitoring

---

## 💰 **Cost Analysis & Budgeting**

### **Estimated Monthly AI Costs**

**Conservative Estimates (Based on Current Usage Patterns):**

| Application | Daily Requests | Model | Daily Cost | Monthly Cost |
|-------------|---------------|-------|------------|--------------|
| AI Receptionist | 1,200 | llama-4-scout | $12.00 | $360 |
| Clinical Staffing | 500 | qwq-32b | $4.50 | $135 |
| Check-in Kiosk | 400 | llama-3.2-vision | $3.20 | $96 |
| EOS L10 | 200 | qwq-32b | $2.00 | $60 |
| Other Apps (13) | 800 | llama-3.3-fast | $2.00 | $60 |
| Safety Checks (All) | 3,100 | llama-guard-3-8b | $3.50 | $105 |
| **Total** | **6,200** | **Mixed** | **$27.20** | **$816** |

**Budget Allocation:**
- **Conservative Budget**: $1,000/month
- **Growth Buffer**: $1,500/month (expansion headroom)
- **Emergency Threshold**: $2,000/month (automatic alerts)

### **Cost Optimization Strategies**

1. **Model Selection**: Use fastest appropriate model for each use case
2. **Caching**: Cache common responses for repeated queries
3. **Batch Processing**: Group requests where possible
4. **Edge Optimization**: Minimize latency to reduce retry costs
5. **Smart Routing**: Route to cheapest model that meets requirements

---

## 📋 **Acceptance Criteria**

### **Functional Requirements**
- [ ] All 17 existing applications can integrate AI with <5 lines of code
- [ ] Daily usage reports automatically generated and delivered
- [ ] Real-time cost monitoring with configurable alerts
- [ ] Automatic shutoffs prevent runaway costs
- [ ] 100% of patient interactions pass safety filtering
- [ ] <200ms average response time for standard chat requests
- [ ] 99.9% uptime for AI services

### **Technical Requirements**
- [ ] TypeScript support with full type safety
- [ ] Integration with existing Cloudflare Workers architecture
- [ ] HIPAA-compliant audit trails for all PHI interactions
- [ ] Seamless deployment with existing CI/CD pipeline
- [ ] Comprehensive error handling and fallback mechanisms
- [ ] Developer documentation and integration guides

### **Business Requirements**
- [ ] AI costs stay within allocated budgets
- [ ] New applications can add AI features in <2 hours
- [ ] Monthly cost reporting for business planning
- [ ] Performance metrics for model optimization
- [ ] Compliance reporting for healthcare audits

---

## 🔄 **Dependencies & Assumptions**

### **Dependencies**
- **Cloudflare Workers AI**: Service availability and model access
- **Existing Infrastructure**: Current monorepo and deployment pipeline
- **KV Storage**: For usage tracking and caching
- **Platform Dashboard**: For monitoring integration

### **Assumptions**
- Cloudflare Workers AI pricing remains stable
- Selected models remain available and supported
- Current traffic patterns continue (6,200 requests/day)
- HIPAA compliance requirements don't change significantly
- Development team maintains existing architecture patterns

### **Risk Mitigation**
- **Model Availability**: Support multiple models per use case
- **Cost Overruns**: Multiple layers of automatic cost controls
- **Performance Issues**: Fallback mechanisms and caching
- **Compliance Changes**: Audit trail system for adaptability

---

## 📞 **Support & Maintenance**

### **Monitoring & Alerting**
- Daily usage reports via email
- Real-time alerts for budget thresholds
- Performance monitoring dashboard
- Weekly optimization recommendations

### **Maintenance Schedule**
- **Daily**: Automated usage analysis and reporting
- **Weekly**: Model performance review and optimization
- **Monthly**: Cost analysis and budget planning
- **Quarterly**: Compliance audit and security review

---

**This PRD provides a comprehensive foundation for implementing a production-ready AI Workers layer that serves all Ganger Platform applications while maintaining strict cost controls, HIPAA compliance, and performance standards.