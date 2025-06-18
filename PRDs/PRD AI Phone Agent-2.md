# PRD: AI-Powered Phone Agent & Patient Communication System - Part 2: Frontend Dashboard & User Interface
*Ganger Platform Standard Application - Frontend User Interface & Real-time Monitoring*

**📚 REQUIRED READING:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development. This is the single source of truth for all platform development patterns, standards, and quality requirements.

## 📋 Document Information
- **Application Component**: Frontend Dashboard & User Interface (Part 2 of 3)
- **PRD ID**: PRD-AI-PHONE-002 (Part 2)
- **Priority**: High
- **Development Timeline**: 4-5 weeks
- **Last Updated**: June 17, 2025
- **Terminal Assignment**: FRONTEND (Terminal 1)
- **Dependencies**: @ganger/ui, @ganger/auth/client, @ganger/utils/client, Part 1 (AI Engine), @ganger/integrations/client
- **MCP Integration Requirements**: Real-time Supabase subscriptions, Payment Hub (Stripe MCP), Communication Hub (Twilio MCP)
- **Integration Requirements**: Real-time Supabase subscriptions, Payment Hub (Stripe MCP)
- **Compliance Requirements**: WCAG 2.1 AA, HIPAA-compliant interfaces

---

## 🎯 Component Overview

### **Purpose Statement**
Create the complete frontend user interface for the AI Phone Agent system, including real-time call monitoring dashboards, conversation analytics, staff management interfaces, and payment processing workflows. This component provides the visual layer that staff use to monitor, manage, and interact with the AI phone system.

### **Scope Boundaries**
**✅ THIS TEAM HANDLES:**
- Complete Next.js frontend application in `/apps/ai-phone-agent/`
- Real-time call monitoring dashboard with live conversation display
- AI confidence visualization and conversation flow interfaces
- Staff call management and transfer interfaces
- Payment processing frontend and billing interfaces
- Call analytics and reporting dashboards
- Mobile-optimized interfaces for call monitoring
- All user authentication and role-based access controls
- Frontend error handling and loading states

**❌ NOT THIS TEAM (Other Parts):**
- AI conversation engine and processing logic (Part 1)
- Database schema and backend APIs (Part 1)
- 3CX VoIP integration and call routing (Part 3)
- Voice processing and speech-to-text (Part 3)

### **Target Users**
- **Primary**: Managers and Superadmins - Full dashboard access and system configuration
- **Secondary**: Reception Staff and Clinical Staff - Call monitoring and quality assurance
- **Tertiary**: AI Trainers and Technicians - System optimization and training data management

### **Success Metrics**
**User Experience (Measured Monthly):**
- **Dashboard Load Time**: < 2 seconds for call monitoring interface
- **Real-time Latency**: < 500ms for live call status updates
- **User Satisfaction**: >4.5/5.0 for staff dashboard usability
- **Mobile Responsiveness**: 100% functionality on tablet/mobile devices

**Operational Efficiency (Measured Daily):**
- **Call Transfer Speed**: < 30 seconds with full context handoff
- **Emergency Transfer**: < 5 seconds for critical escalations
- **Staff Training Time**: < 2 hours to proficiency on dashboard
- **Error Recovery**: Automatic UI recovery from connection issues

---

## 🏗️ Technical Architecture

### **MANDATORY: Cloudflare Workers Architecture**
```yaml
# ✅ REQUIRED: Workers-only deployment (Pages is sunset)
Framework: Next.js 14+ with Workers runtime (runtime: 'edge')
Deployment: Cloudflare Workers (NO Pages deployment)
Build Process: @cloudflare/next-on-pages
Configuration: Workers-compatible next.config.js (NO static export)

# ❌ FORBIDDEN: These patterns cause 405 errors
Static_Export: Never use output: 'export'
Cloudflare_Pages: Sunset for Workers routes
Custom_Routing: Must use Workers request handling
```

### **⚠️ CRITICAL: Anti-Pattern Prevention**
```typescript
// ❌ NEVER USE: Static export configuration (causes 405 errors)
const nextConfig = {
  output: 'export',        // DELETE THIS - breaks Workers
  trailingSlash: true,     // DELETE THIS - static pattern
  distDir: 'dist'          // DELETE THIS - Workers incompatible
}

// ✅ REQUIRED: Workers-compatible configuration
const nextConfig = {
  experimental: {
    runtime: 'edge',         // MANDATORY for Workers
  },
  images: {
    unoptimized: true,       // Required for Workers
  },
  basePath: '/ai-phone',     // Required for staff portal routing
}
```

### **Architecture Verification Requirements**
```bash
# ✅ MANDATORY: Every app must pass these checks
pnpm type-check              # 0 errors required
pnpm build                   # Successful completion required
curl -I [app-url]/health     # HTTP 200 required (not 405)
grep -r "StaffPortalLayout"  # Must find implementation
grep -r "output.*export"     # Must find nothing
```

### **Shared Infrastructure with Pages Sunset Note**
```yaml
Frontend: Next.js 14+ with TypeScript (100% compilation required)
Backend: Next.js API routes + Supabase Edge Functions (Workers runtime)
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers EXCLUSIVELY (Pages sunset for Workers routes)
Styling: Tailwind CSS + Ganger Design System (NO custom CSS allowed)
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
Build System: Turborepo (workspace compliance required)
Quality Gates: Automated pre-commit hooks (see MASTER_DEVELOPMENT_GUIDE.md)
```

### **Platform Constants & Patterns (REQUIRED KNOWLEDGE)**
```typescript
// ✅ MANDATORY: Use platform constants (see @ganger/types)
import { 
  USER_ROLES, 
  LOCATIONS, 
  PRIORITY_LEVELS,
  APPOINTMENT_STATUS,
  CALL_STATUS
} from '@ganger/types/constants';

// ✅ Standard call status values
const CALL_STATUS = [
  'active',
  'on_hold',
  'transferring',
  'completed',
  'abandoned',
  'emergency'
] as const;
```

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

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  User, Patient, Appointment, Provider,
  ApiResponse, PaginationMeta, ValidationRule,
  CallSession, ConversationTurn, AIResponse
} from '@ganger/types';
```

### **Staff Portal Integration (MANDATORY)**
```typescript
// ✅ REQUIRED: AI Phone Agent UI must be accessible through staff portal
import { StaffPortalLayout } from '@ganger/ui/staff';

export default function AIPhoneAgentDashboard() {
  return (
    <StaffPortalLayout 
      appName="ai-phone"
      title="AI Phone Agent Dashboard"
      permissions={['manage_phone_system']}
    >
      <CallMonitoringDashboard />
    </StaffPortalLayout>
  );
}
```

### **Project Structure**
```
/mnt/q/Projects/ganger-platform/apps/ai-phone-agent/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── CallMonitoringDashboard.tsx
│   │   │   ├── ActiveCallsGrid.tsx
│   │   │   ├── ConversationViewer.tsx
│   │   │   └── PerformanceMetrics.tsx
│   │   ├── calls/
│   │   │   ├── CallCard.tsx
│   │   │   ├── CallTransferInterface.tsx
│   │   │   ├── ConversationTranscript.tsx
│   │   │   └── AIConfidenceIndicator.tsx
│   │   ├── analytics/
│   │   │   ├── CallAnalyticsDashboard.tsx
│   │   │   ├── PerformanceCharts.tsx
│   │   │   ├── SatisfactionTrends.tsx
│   │   │   └── RevenueImpactChart.tsx
│   │   ├── payments/
│   │   │   ├── PaymentProcessingInterface.tsx
│   │   │   ├── BillingInquiryForm.tsx
│   │   │   ├── PaymentPlanSetup.tsx
│   │   │   └── PaymentHistory.tsx
│   │   ├── scheduling/
│   │   │   ├── AppointmentBookingInterface.tsx
│   │   │   ├── WaitlistManagement.tsx
│   │   │   ├── SchedulingCalendar.tsx
│   │   │   └── AppointmentConfirmation.tsx
│   │   ├── training/
│   │   │   ├── AITrainingDashboard.tsx
│   │   │   ├── ConversationFeedback.tsx
│   │   │   ├── TrainingDataManager.tsx
│   │   │   └── ModelPerformanceTracker.tsx
│   │   └── shared/
│   │       ├── EmergencyOverride.tsx
│   │       ├── SystemHealthIndicator.tsx
│   │       ├── NotificationCenter.tsx
│   │       └── MobileCallManagement.tsx
│   ├── hooks/
│   │   ├── useRealtimeCalls.ts
│   │   ├── useCallTransfer.ts
│   │   ├── usePaymentProcessing.ts
│   │   ├── useAIMetrics.ts
│   │   └── useCallAnalytics.ts
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── realtime-subscriptions.ts
│   │   ├── payment-utils.ts
│   │   └── call-utils.ts
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── index.tsx (Main Dashboard)
│   │   ├── calls/
│   │   │   ├── index.tsx (Active Calls)
│   │   │   ├── history.tsx (Call History)
│   │   │   └── [callId].tsx (Call Details)
│   │   ├── analytics/
│   │   │   ├── index.tsx (Analytics Dashboard)
│   │   │   ├── performance.tsx
│   │   │   └── revenue.tsx
│   │   ├── payments/
│   │   │   ├── index.tsx (Payment Dashboard)
│   │   │   ├── process.tsx (Payment Processing)
│   │   │   └── plans.tsx (Payment Plans)
│   │   ├── training/
│   │   │   ├── index.tsx (AI Training)
│   │   │   └── feedback.tsx (Training Feedback)
│   │   └── settings/
│   │       ├── index.tsx (System Settings)
│   │       └── emergency.tsx (Emergency Procedures)
│   ├── styles/
│   │   ├── globals.css
│   │   └── dashboard.css
│   └── types/
│       ├── calls.ts
│       ├── dashboard.ts
│       ├── payments.ts
│       └── analytics.ts
├── public/
│   ├── icons/
│   └── audio/ (notification sounds)
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

### **Core Component Architecture**
```typescript
// Main dashboard entry point
// /apps/ai-phone-agent/src/pages/index.tsx
import { CallMonitoringDashboard } from '@/components/dashboard/CallMonitoringDashboard';
import { SystemHealthIndicator } from '@/components/shared/SystemHealthIndicator';
import { useRealtimeCalls } from '@/hooks/useRealtimeCalls';

export default function AIPhoneAgentDashboard() {
  const { activeCalls, callHistory, isConnected } = useRealtimeCalls();
  
  return (
    <AppLayout title="AI Phone Agent">
      <div className="min-h-screen bg-gray-50">
        <SystemHealthIndicator isConnected={isConnected} />
        <CallMonitoringDashboard 
          activeCalls={activeCalls}
          callHistory={callHistory}
        />
      </div>
    </AppLayout>
  );
}
```

---

## 🎨 User Interface Design

### **Design System (Ganger Platform Standard)**
```typescript
// AI Phone Agent specific color extensions
const aiPhoneAgentColors = {
  // Standard Ganger Platform colors
  primary: 'blue-600',      // Medical professional
  secondary: 'green-600',   // Success/health  
  accent: 'purple-600',     // Analytics/insights
  neutral: 'slate-600',     // Text/borders
  warning: 'amber-600',     // Alerts
  danger: 'red-600',        // Errors/critical
  
  // AI-specific status colors
  aiActive: 'emerald-500',     // AI handling calls
  aiConfident: 'blue-500',     // High confidence (>0.8)
  aiUncertain: 'yellow-500',   // Low confidence (<0.5)
  humanTransfer: 'orange-500', // Transferred to human
  emergency: 'red-700',        // Emergency situations
  
  // Call status colors
  callActive: 'green-400',     // Active call
  callHold: 'amber-400',       // Call on hold
  callTransfer: 'blue-400',    // Transfer in progress
  callComplete: 'gray-400'     // Call completed
};
```

### **Key Interface Components**

#### **1. Real-time Call Monitoring Dashboard**
```typescript
// /components/dashboard/CallMonitoringDashboard.tsx
export function CallMonitoringDashboard({ activeCalls, callHistory }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Active Calls Grid */}
      <div className="lg:col-span-2">
        <ActiveCallsGrid calls={activeCalls} />
      </div>
      
      {/* System Status & Metrics */}
      <div className="space-y-6">
        <PerformanceMetrics />
        <SystemHealthIndicator />
        <QuickActions />
      </div>
    </div>
  );
}

// Real-time active calls with AI confidence visualization
export function ActiveCallsGrid({ calls }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {calls.map(call => (
        <CallCard 
          key={call.id}
          call={call}
          showTransferButton
          showConfidenceIndicator
          onTransfer={handleTransfer}
        />
      ))}
    </div>
  );
}
```

#### **2. AI Confidence Visualization**
```typescript
// /components/calls/AIConfidenceIndicator.tsx
export function AIConfidenceIndicator({ confidence, intent }) {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-500 bg-emerald-50';
    if (score >= 0.5) return 'text-blue-500 bg-blue-50';
    return 'text-yellow-500 bg-yellow-50';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
        {Math.round(confidence * 100)}% confident
      </div>
      <span className="text-sm text-gray-600">Intent: {intent}</span>
    </div>
  );
}
```

#### **3. Emergency Transfer Interface**
```typescript
// /components/calls/CallTransferInterface.tsx
export function CallTransferInterface({ call, onTransfer }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Transfer Call</h3>
        <AIConfidenceIndicator 
          confidence={call.ai_confidence_score}
          intent={call.current_intent}
        />
      </div>
      
      {/* Emergency transfer button */}
      <Button
        variant="danger"
        size="lg"
        onClick={() => onTransfer(call.id, 'emergency')}
        className="w-full mb-3"
      >
        🚨 Emergency Transfer (< 5 sec)
      </Button>
      
      {/* Regular transfer options */}
      <div className="space-y-2">
        <Button 
          variant="warning" 
          onClick={() => onTransfer(call.id, 'clinical')}
          className="w-full"
        >
          Transfer to Clinical Staff
        </Button>
        <Button 
          variant="primary" 
          onClick={() => onTransfer(call.id, 'reception')}
          className="w-full"
        >
          Transfer to Reception
        </Button>
      </div>
    </div>
  );
}
```

#### **4. Payment Processing Interface**
```typescript
// /components/payments/PaymentProcessingInterface.tsx
export function PaymentProcessingInterface({ patientId, callId }) {
  const { processPayment, isProcessing } = usePaymentProcessing();
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <PageHeader 
        title="Process Payment" 
        subtitle="HIPAA-compliant payment collection"
      />
      
      <FormBuilder>
        <FormField label="Patient Balance" type="currency" readonly />
        <FormField label="Payment Amount" type="currency" required />
        <FormField label="Payment Method" type="select" options={paymentMethods} />
        
        <Button 
          type="submit" 
          variant="primary" 
          loading={isProcessing}
          className="w-full"
        >
          Process Secure Payment
        </Button>
      </FormBuilder>
    </div>
  );
}
```

---

## 🔌 Frontend API Integration

### **Real-time Data Hooks**
```typescript
// /hooks/useRealtimeCalls.ts
export function useRealtimeCalls() {
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to real-time call updates via Supabase
    const subscription = supabase
      .channel('call_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'phone_calls' },
        handleCallUpdate
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const handleCallUpdate = (payload) => {
    // Update active calls based on real-time changes
    // Handle call status changes, new calls, completed calls
  };

  return { activeCalls, callHistory, isConnected };
}

// /hooks/useCallTransfer.ts
export function useCallTransfer() {
  const transferCall = async (callId: string, transferType: string) => {
    // Call transfer API with context preservation
    const response = await apiClient.post(`/api/calls/${callId}/transfer`, {
      transferType,
      preserveContext: true,
      urgency: transferType === 'emergency' ? 'critical' : 'normal'
    });
    
    // Update UI immediately for emergency transfers
    if (transferType === 'emergency') {
      toast.success('Emergency transfer initiated - <5 seconds');
    }
  };

  return { transferCall };
}
```

### **Payment Processing Integration**
```typescript
// /hooks/usePaymentProcessing.ts
export function usePaymentProcessing() {
  const processPayment = async (paymentData: PaymentRequest) => {
    // Integration with Payment Hub (Stripe MCP)
    const response = await apiClient.post('/api/payments/process', {
      ...paymentData,
      hipaaCompliant: true,
      callId: paymentData.callId
    });

    if (response.success) {
      // Update call record with payment status
      // Show success confirmation
      // Track revenue attribution
    }
  };

  return { processPayment, isProcessing };
}
```

---

## 📱 Mobile-Optimized Interface

### **Touch-Optimized Call Management**
```typescript
// /components/shared/MobileCallManagement.tsx
export function MobileCallManagement({ calls }) {
  return (
    <div className="md:hidden">
      {/* Swipe-enabled call cards */}
      <div className="space-y-3 p-4">
        {calls.map(call => (
          <SwipeableCallCard
            key={call.id}
            call={call}
            onSwipeLeft={() => transferCall(call.id)}
            onSwipeRight={() => viewCallDetails(call.id)}
            onTap={() => openCallActions(call.id)}
          />
        ))}
      </div>
      
      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex space-x-2">
          <Button variant="danger" size="sm" className="flex-1">
            🚨 Emergency
          </Button>
          <Button variant="primary" size="sm" className="flex-1">
            📞 Transfer
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### **Component Testing**
```typescript
// Focus on UI interactions and real-time updates
describe('CallMonitoringDashboard', () => {
  test('displays active calls in real-time');
  test('shows AI confidence indicators correctly');
  test('handles emergency transfer button clicks');
  test('updates call status without page refresh');
  test('maintains connection status display');
});

describe('PaymentProcessingInterface', () => {
  test('validates payment amounts correctly');
  test('processes payments securely');
  test('displays HIPAA-compliant confirmations');
  test('handles payment failures gracefully');
});

describe('Mobile Interface', () => {
  test('swipe gestures work on touch devices');
  test('emergency buttons are easily accessible');
  test('interface adapts to different screen sizes');
});
```

### **E2E Testing with Playwright**
- Complete call monitoring workflow
- Emergency transfer procedures
- Payment processing flow
- Real-time updates and notifications
- Mobile touch interactions

---

## ♿ Accessibility Requirements

### **WCAG 2.1 AA Compliance**
```typescript
// Accessibility features for call monitoring
export function AccessibleCallCard({ call }) {
  return (
    <div 
      role="article"
      aria-label={`Call from ${call.caller_name}, AI confidence ${call.ai_confidence_score}`}
      tabIndex={0}
      className="focus:ring-2 focus:ring-blue-500"
    >
      {/* Screen reader announcements for status changes */}
      <div aria-live="polite" className="sr-only">
        {call.status_changed && `Call status changed to ${call.status}`}
      </div>
      
      {/* Keyboard navigation support */}
      <div onKeyDown={handleKeyboardNavigation}>
        <CallContent call={call} />
      </div>
    </div>
  );
}
```

### **Audio Accessibility**
- Screen reader support for all call information
- Audio alerts for emergency situations (optional)
- High contrast mode for AI confidence indicators
- Keyboard navigation for all transfer functions

---

## 🚀 Performance Requirements

### **Real-time Performance**
- **Dashboard Load**: < 2 seconds for initial load
- **Live Updates**: < 500ms latency for call status changes
- **Transfer Actions**: < 30 seconds with full context
- **Emergency Transfer**: < 5 seconds critical response
- **Mobile Responsiveness**: 60fps touch interactions

### **Bundle Optimization**
```typescript
// Code splitting for optimal loading
const CallAnalytics = dynamic(() => import('@/components/analytics/CallAnalyticsDashboard'));
const PaymentInterface = dynamic(() => import('@/components/payments/PaymentProcessingInterface'));
const AITraining = dynamic(() => import('@/components/training/AITrainingDashboard'));

// Bundle size targets
// Initial bundle: < 100KB (excluding shared packages)
// Route chunks: < 50KB each
// Shared UI components: Loaded from @ganger/ui
```

---

## 🔒 Security & Frontend Compliance

### **HIPAA-Compliant UI**
- No PHI displayed in URLs or browser history
- Secure session management with automatic timeouts
- Encrypted data transmission for all patient information
- Audit logging for all user interactions with patient data

### **Frontend Security**
```typescript
// Secure data handling in components
export function SecurePatientDisplay({ patientData }) {
  // PHI protection in frontend
  const sanitizedData = useMemo(() => 
    sanitizePatientData(patientData), [patientData]
  );
  
  // No PHI in console logs or error messages
  const handleError = (error: Error) => {
    logger.error('Patient display error', { 
      callId: patientData.callId,
      // No PHI in error logs
      timestamp: new Date().toISOString()
    });
  };

  return <PatientInfoCard data={sanitizedData} />;
}
```

---

## 🔄 Integration Points with Other Teams

### **Receives from Team 1 (AI Engine)**
- Real-time conversation data via Supabase subscriptions
- AI confidence scores and intent recognition results
- Patient context and identification information
- Call status updates and completion notifications

### **Receives from Team 3 (VoIP Integration)**
- Call initiation and termination events
- Voice quality metrics and connection status
- Transfer completion confirmations
- Emergency override triggers

### **Provides to Other Teams**
- User-initiated transfer requests to Team 3
- Training feedback data to Team 1
- Call quality ratings and satisfaction scores
- System configuration changes and preferences

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] Real-time call dashboard displays active calls with <500ms latency
- [ ] Emergency transfer button initiates transfer in <5 seconds
- [ ] Payment processing interface completes transactions securely
- [ ] Mobile interface supports all critical functions with touch optimization
- [ ] WCAG 2.1 AA accessibility compliance verified
- [ ] All user roles can access appropriate dashboard sections

### **Performance Targets**
- Dashboard loads in <2 seconds on 3G
- Real-time updates with <500ms latency
- 100% mobile functionality parity
- >4.5/5.0 staff usability rating
- Zero PHI exposure in frontend logs
- <30 second transfer times with full context

---

## 📚 Documentation Requirements

### **User Documentation**
- [ ] Call monitoring dashboard user guide with screenshots
- [ ] Emergency transfer procedures with step-by-step instructions
- [ ] Payment processing workflow documentation
- [ ] Mobile interface usage guide
- [ ] Troubleshooting guide for common UI issues

### **Technical Documentation**
- [ ] Component architecture and state management
- [ ] Real-time subscription setup and error handling
- [ ] Payment integration security procedures
- [ ] Accessibility implementation guide
- [ ] Performance optimization techniques

---

*This component provides the complete frontend user experience for the AI Phone Agent system, integrating seamlessly with the AI engine (Part 1) and VoIP system (Part 3) while maintaining the highest standards of usability and compliance.*