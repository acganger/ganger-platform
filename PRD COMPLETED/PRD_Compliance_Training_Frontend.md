# PRD: Compliance Training Manager Dashboard - Frontend
*Frontend development specifications for parallel beast mode development*

## 📋 Document Information
- **Application Name**: Compliance Training Manager Dashboard (Frontend)
- **PRD ID**: PRD-COMPLIANCE-FRONTEND-001
- **Priority**: Medium
- **Development Timeline**: 3-4 weeks (Frontend portion)
- **Terminal Assignment**: Frontend Terminal
- **Dependencies**: @ganger/ui, @ganger/auth/client, @ganger/utils/client, @ganger/types
- **Backend Coordination**: Requires API endpoints from Backend Terminal (PRD_Compliance_Training_Backend.md)

---

## 🎯 Frontend Product Overview

### **Frontend Scope**
Create a manager-only React/Next.js dashboard that displays real-time employee compliance training progress with interactive filtering, real-time updates, and export capabilities.

### **Target Frontend Users**
- **Primary**: Manager+ role accessing compliance dashboard
- **Secondary**: HR staff using training oversight interfaces
- **Tertiary**: Training administrators managing module configurations

### **Frontend Success Metrics**
- Dashboard loads in < 2 seconds with full data visualization
- Real-time updates appear within 500ms of backend changes
- 100% mobile responsiveness for manager access
- Zero client-side errors in compliance data rendering

---

## 🏗️ Frontend Technical Architecture

### **Required Frontend Packages (CLIENT-SAFE ONLY)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in frontend components
'use client'
import { 
  ComplianceGrid, EmployeeRow, TrainingCard, ProgressChart,
  Button, Input, Modal, DataTable, LoadingSpinner, Chart
} from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { validateForm, formatters, dateUtils } from '@ganger/utils/client';
import type { 
  Employee, TrainingModule, TrainingCompletion, ComplianceMatrix,
  ApiResponse, PaginationMeta, FilterOptions
} from '@ganger/types';

// ❌ PROHIBITED IN FRONTEND - These are handled by backend terminal
// Do NOT import: @ganger/db, @ganger/integrations/server, googleapis, etc.
```

### **Frontend-Specific Technology Stack**
- **Framework**: Next.js 14 with App Router and 'use client' directives
- **State Management**: React hooks + context for dashboard state
- **Data Fetching**: API routes provided by backend terminal
- **Real-time**: Supabase subscriptions for live compliance updates
- **Charts**: Chart.js for compliance visualizations
- **Export**: Client-side CSV/PDF generation for reports

---

## 🎨 Frontend UI Design Standards

### **Compliance Dashboard Color System**
```typescript
// Compliance-specific UI colors for frontend components
const complianceColors = {
  // Status indicators
  completed: 'emerald-500',     // Training completed
  overdue: 'red-500',           // Overdue training
  inProgress: 'yellow-500',     // Training in progress
  notStarted: 'gray-400',       // Not started
  notRequired: 'gray-300',      // Not required for employee
  
  // Interactive elements
  primary: 'blue-600',          // Action buttons
  secondary: 'green-600',       // Success states
  warning: 'amber-600',         // Due soon alerts
  danger: 'red-600'             // Critical compliance issues
};
```

### **Required Frontend Components**
```typescript
// Use these @ganger/ui components exclusively
import {
  // Layout Components
  AppLayout, PageHeader, Sidebar, NavigationTabs,
  
  // Compliance-Specific Components
  ComplianceMatrix,        // Main grid view of employee vs training
  EmployeeComplianceRow,   // Individual employee status row
  TrainingStatusCard,      // Training module status display
  ComplianceTimeline,      // 5-month rolling timeline view
  ProgressIndicator,       // Visual progress bars
  StatusBadge,            // Compliance status indicators
  
  // Data Visualization
  ComplianceChart,        // Completion rate charts
  DepartmentSummary,      // Department breakdown view
  TrendAnalysis,          // Historical compliance trends
  
  // Interactive Controls
  ComplianceFilters,      // Filter panel for dashboard
  ExportControls,         // Report export buttons
  SyncStatusIndicator,    // Real-time sync status
  
  // Standard Components
  DataTable, PaginationControls, FilterPanel,
  Button, Input, Select, DatePicker, LoadingSpinner,
  Modal, Toast, ErrorBoundary, ConfirmDialog
} from '@ganger/ui';
```

---

## 📱 Frontend User Experience Requirements

### **Core Frontend Workflows**
1. **Dashboard Load Sequence**:
   ```typescript
   // Frontend loading pattern
   'use client'
   
   export default function ComplianceDashboard() {
     const [employees, setEmployees] = useState<Employee[]>([]);
     const [trainings, setTrainings] = useState<TrainingModule[]>([]);
     const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       // 1. Load initial data from backend APIs
       loadDashboardData();
       
       // 2. Subscribe to real-time updates
       subscribeToComplianceUpdates();
     }, []);
   }
   ```

2. **Real-time Updates**:
   ```typescript
   // Supabase subscription for live updates
   const subscribeToComplianceUpdates = () => {
     const subscription = supabase
       .channel('compliance-updates')
       .on('postgres_changes', 
         { event: '*', schema: 'public', table: 'training_completions' },
         (payload) => {
           // Update frontend state with real-time changes
           updateComplianceStatus(payload);
         }
       )
       .subscribe();
   };
   ```

3. **Interactive Filtering**:
   ```typescript
   // Frontend filter state management
   const [filters, setFilters] = useState({
     status: 'all',           // all, completed, overdue, in_progress
     department: 'all',       // all, or specific department
     location: 'all',         // all, Ann Arbor, Wixom, Plymouth
     timeRange: 'current'     // current, last_3_months, custom
   });
   
   // Apply filters client-side for responsiveness
   const filteredEmployees = useMemo(() => 
     applyComplianceFilters(employees, completions, filters), 
     [employees, completions, filters]
   );
   ```

### **Required Frontend Features**
- **5-Month Timeline View**: Visual timeline showing past 2 months, current month, next 2 months
- **Matrix Grid Interface**: Employee rows × Training module columns with status indicators
- **Department Breakdown**: Collapsible department sections with summary statistics
- **Export Functionality**: Client-side CSV and PDF report generation
- **Search and Filter**: Real-time filtering by name, department, status
- **Mobile Responsive**: Touch-optimized interface for tablet/mobile manager access

### **Frontend Performance Requirements**
```typescript
// Performance budgets for frontend
const PERFORMANCE_REQUIREMENTS = {
  initialLoad: 2000,        // 2s max dashboard load
  filterResponse: 100,      // 100ms max filter application
  realtimeUpdate: 500,      // 500ms max for live updates
  chartRender: 1000,        // 1s max for chart rendering
  exportGeneration: 3000    // 3s max for report export
};
```

---

## 🔌 Frontend API Integration

### **Required API Endpoints (Provided by Backend Terminal)**
```typescript
// API endpoints that backend terminal must provide
interface ComplianceAPIEndpoints {
  // Data fetching
  'GET /api/compliance/matrix': ComplianceMatrixResponse;
  'GET /api/compliance/employees': Employee[];
  'GET /api/compliance/training-modules': TrainingModule[];
  'GET /api/compliance/completions': TrainingCompletion[];
  
  // Filtering and search
  'GET /api/compliance/dashboard': DashboardData;
  'GET /api/compliance/department/[dept]': DepartmentData;
  'GET /api/compliance/employee/[id]': EmployeeDetail;
  
  // Actions
  'POST /api/compliance/sync': SyncResponse;
  'PUT /api/compliance/exemption/[id]': ExemptionResponse;
  'GET /api/compliance/export': ExportData;
}

// Frontend API client implementation
export class ComplianceAPIClient {
  static async getDashboardData(): Promise<DashboardData> {
    const response = await fetch('/api/compliance/dashboard');
    return response.json();
  }
  
  static async triggerSync(): Promise<SyncResponse> {
    const response = await fetch('/api/compliance/sync', { method: 'POST' });
    return response.json();
  }
  
  static async exportCompliance(format: 'csv' | 'pdf'): Promise<ExportData> {
    const response = await fetch(`/api/compliance/export?format=${format}`);
    return response.json();
  }
}
```

### **Frontend Error Handling**
```typescript
// Comprehensive error handling for frontend
export const useComplianceData = () => {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const handleAPIError = (error: Error) => {
    console.error('Compliance API Error:', error);
    setError(error.message);
    
    // Auto-retry for network errors
    if (error.name === 'NetworkError' && retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetchData();
      }, 1000 * Math.pow(2, retryCount));
    }
  };
  
  return { error, handleAPIError, retryCount };
};
```

---

## 🧪 Frontend Testing Requirements

### **Frontend-Specific Tests**
```typescript
// Component testing patterns
describe('ComplianceDashboard', () => {
  it('renders employee compliance matrix correctly', () => {
    render(<ComplianceDashboard employees={mockEmployees} />);
    expect(screen.getByTestId('compliance-matrix')).toBeInTheDocument();
  });
  
  it('applies filters and updates display', () => {
    const { getByRole } = render(<ComplianceDashboard />);
    fireEvent.change(getByRole('combobox', { name: 'Department' }), {
      target: { value: 'Clinical' }
    });
    expect(screen.getByText('Clinical Department')).toBeInTheDocument();
  });
  
  it('handles real-time updates correctly', async () => {
    render(<ComplianceDashboard />);
    // Simulate real-time update
    act(() => {
      triggerRealtimeUpdate(mockCompletionUpdate);
    });
    await waitFor(() => {
      expect(screen.getByTestId('status-updated')).toBeInTheDocument();
    });
  });
});

// Integration testing with mock APIs
describe('ComplianceAPIClient', () => {
  it('fetches dashboard data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDashboardData)
    });
    
    const data = await ComplianceAPIClient.getDashboardData();
    expect(data.employees).toHaveLength(25);
  });
});
```

---

## 🚀 Frontend Deployment Configuration

### **Next.js Frontend Configuration**
```javascript
// next.config.js for compliance training frontend
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for dashboard performance
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com']
  },
  
  // Enable real-time features
  experimental: {
    serverActions: true
  },
  
  // Bundle optimization for compliance dashboard
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side optimization
      config.resolve.fallback = {
        fs: false,
        net: false,
        dns: false
      };
    }
    return config;
  }
};

module.exports = nextConfig;
```

### **Environment Variables (Frontend)**
```bash
# Client-side environment variables (public)
NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://compliance.gangerdermatology.com

# Performance monitoring
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_COMPLIANCE_DASHBOARD_VERSION=1.0.0
```

---

## 📊 Frontend Success Criteria

### **Frontend Launch Criteria**
- [ ] Compliance matrix renders all employee/training combinations correctly
- [ ] Real-time updates work without page refresh
- [ ] All filter combinations function properly
- [ ] Export functionality generates accurate reports
- [ ] Mobile interface provides full functionality
- [ ] Loading states and error handling work seamlessly

### **Frontend Quality Gates**
```bash
# Required frontend validations
npm run type-check          # 0 TypeScript errors
npm run test:frontend       # All component tests pass
npm run build              # Production build succeeds
npm run audit:ui-compliance # No custom components used
npm run test:a11y          # Accessibility compliance verified
```

---

## 🔄 Coordination with Backend Terminal

### **Backend Dependencies**
**The Backend Terminal (PRD_Compliance_Training_Backend.md) must provide:**

1. **API Endpoints**: All `/api/compliance/*` routes functional
2. **Real-time Subscriptions**: Supabase triggers for live updates
3. **Data Validation**: Server-side validation for all operations
4. **External Integrations**: Google Classroom and Zenefits sync working
5. **Authentication**: Server-side auth middleware operational

### **Frontend-Backend Handoff Points**
```typescript
// Shared TypeScript interfaces (both terminals use)
interface ComplianceMatrix {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: Record<string, TrainingCompletion>;
  summary: ComplianceSummary;
}

interface DashboardData {
  matrix: ComplianceMatrix;
  departments: DepartmentSummary[];
  overallStats: ComplianceStats;
  lastSync: Date;
}
```

### **Development Coordination**
1. **Phase 1**: Backend Terminal creates API routes, Frontend Terminal creates components
2. **Phase 2**: Integration testing with real API endpoints
3. **Phase 3**: Real-time features and final optimization
4. **Phase 4**: End-to-end testing and deployment

---

## 📚 Frontend Documentation Requirements

### **Component Documentation**
- [ ] ComplianceMatrix component usage guide
- [ ] Real-time update implementation patterns
- [ ] Filter state management documentation
- [ ] Export functionality user guide

### **Integration Documentation** 
- [ ] API client implementation guide
- [ ] Error handling and retry logic
- [ ] Performance optimization techniques
- [ ] Mobile responsiveness patterns

---

*This frontend PRD enables parallel development with the backend terminal while ensuring seamless integration and optimal user experience for the Compliance Training Manager Dashboard.*

**🔗 Companion Document**: [PRD_Compliance_Training_Backend.md](./PRD_Compliance_Training_Backend.md) - Backend development specifications