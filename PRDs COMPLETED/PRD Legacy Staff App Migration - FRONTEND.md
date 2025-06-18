# PRD: Legacy Staff Application Migration to Ganger Platform - FRONTEND TEAM

## 📋 **Executive Summary**

**Project**: Frontend User Interface for Legacy PHP Staff Portal Migration  
**Target Application**: `apps/staff` - React Components, User Interface, and Client-Side Features  
**Migration Scope**: Complete frontend feature parity + modern UX for staff management, ticket systems, and HR workflows  
**Business Impact**: Modernize critical HR and IT support user interfaces serving 50+ employees across 3 locations  

## 🎯 **Frontend Team Objectives**

### **Primary Goals**
1. **React Components**: Modern component library with TypeScript interfaces
2. **User Experience**: Intuitive dashboard and form interfaces replacing legacy PHP
3. **Mobile Optimization**: Responsive design with PWA capabilities
4. **Real-time UI**: Live updates and collaboration features
5. **Accessibility**: WCAG 2.1 AA compliance for all interfaces

### **Success Metrics**
- **Page Load Times**: <500ms for dashboard and forms
- **Mobile Usability**: 95% task completion rate on mobile devices
- **User Adoption**: 100% staff transition within 30 days
- **Accessibility**: WCAG 2.1 AA compliance score
- **User Satisfaction**: >4.5 out of 5 rating

## 🚧 **TEAM COORDINATION & OWNERSHIP**

### **👥 Your Role: Frontend Implementation Team**
You are responsible for all user interface, React components, user experience, and client-side functionality. The Backend team will provide APIs and data that you will consume and display.

### **🤝 Backend Team Role**
They handle all server-side infrastructure, database operations, API endpoints, and external integrations. They will provide working APIs for you to integrate with.

### **📋 Communication Protocols**
- **API Issues**: Report API problems via GitHub issues tagged with `backend-api`
- **Schema Changes**: Backend team will notify you 48 hours before data structure changes
- **Integration Testing**: Coordinate testing schedules weekly
- **Mock Data**: Use provided API stubs during development, switch to production APIs when ready

## 🔗 **API INTERFACE CONTRACT** *(IDENTICAL IN BOTH PRDS)*

### **Authentication Endpoints**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| POST | `/api/auth/google` | Redirect OAuth flow | Google OAuth processing, JWT creation |
| GET | `/api/auth/user` | Get current user data | JWT validation, user profile return |
| POST | `/api/auth/logout` | Sign out button | JWT invalidation, session cleanup |

### **Tickets API**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| GET | `/api/tickets` | Display ticket list | Query staff_tickets with RLS, pagination |
| POST | `/api/tickets` | Submit new ticket form | Validate input, create ticket, trigger notifications |
| GET | `/api/tickets/[id]` | Show ticket detail page | Fetch ticket with comments/attachments |
| PUT | `/api/tickets/[id]` | Update ticket status | Validate permissions, update status, audit log |
| DELETE | `/api/tickets/[id]` | Archive ticket | Soft delete with audit trail |

### **Comments API**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| GET | `/api/tickets/[id]/comments` | Display comment thread | Query comments with author info |
| POST | `/api/tickets/[id]/comments` | Add comment form | Create comment, trigger notifications |
| PUT | `/api/comments/[id]` | Edit comment | Validate author, update content |
| DELETE | `/api/comments/[id]` | Delete comment | Soft delete with audit trail |

### **File Attachments API**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| POST | `/api/tickets/[id]/attachments` | File upload widget | Process upload, virus scan, store in Supabase |
| GET | `/api/tickets/[id]/attachments` | List attachments | Return file metadata and signed URLs |
| GET | `/api/attachments/[id]/download` | Download button | Generate signed download URL |
| DELETE | `/api/attachments/[id]` | Remove attachment | Delete file and metadata |

### **Users API**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| GET | `/api/users` | Staff directory page | Query user profiles with filters |
| POST | `/api/users` | Create user form | Google Admin SDK integration, profile creation |
| GET | `/api/users/[id]` | User profile page | Fetch complete user profile |
| PUT | `/api/users/[id]` | Edit profile form | Update profile, sync with Google Workspace |

### **Data Schemas** *(SHARED BETWEEN TEAMS)*

#### **Ticket Schema**
```typescript
interface Ticket {
  id: string;
  form_type: 'support_ticket' | 'time_off_request' | 'punch_fix' | 'change_of_availability';
  submitter: {
    id: string;
    email: string;
    name: string;
  };
  status: 'pending' | 'open' | 'in_progress' | 'stalled' | 'approved' | 'denied' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: 'Northfield' | 'Woodbury' | 'Burnsville';
  title: string; // Frontend: max 200 chars, Backend: DB constraint
  description: string; // Frontend: max 2000 chars, Backend: sanitization
  form_data: Record<string, any>; // Frontend: type-safe forms, Backend: JSON validation
  assigned_to?: {
    id: string;
    email: string;
    name: string;
  };
  comments: Comment[];
  attachments: Attachment[];
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

#### **Comment Schema**
```typescript
interface Comment {
  id: string;
  ticket_id: string;
  author: {
    id: string;
    email: string;
    name: string;
  };
  content: string; // Frontend: max 1000 chars, Backend: sanitization
  is_internal: boolean; // Frontend: manager-only display, Backend: RLS policy
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

#### **User Profile Schema**
```typescript
interface UserProfile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string; // Frontend: display only, Backend: Google Workspace sync
  department: string;
  role: 'staff' | 'manager' | 'admin'; // Frontend: permission checks, Backend: RLS policies
  location: 'Northfield' | 'Woodbury' | 'Burnsville';
  hire_date?: string; // ISO 8601 date
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  is_active: boolean;
  google_user_data?: Record<string, any>; // Frontend: profile enrichment, Backend: sync cache
}
```

### **Error Response Format** *(STANDARD FOR ALL ENDPOINTS)*
```typescript
interface ErrorResponse {
  error: {
    code: string; // 'VALIDATION_ERROR', 'UNAUTHORIZED', 'NOT_FOUND', etc.
    message: string; // Human-readable error for Frontend display
    details?: Record<string, string[]>; // Field-specific validation errors
    timestamp: string; // ISO 8601
    request_id: string; // For support debugging
  };
}
```

### **Authentication Pattern** *(ALL PROTECTED ENDPOINTS)*
```typescript
// Frontend Request Headers
{
  "Authorization": "Bearer <supabase_jwt_token>",
  "Content-Type": "application/json"
}

// Backend Validation
- Extract JWT from Authorization header
- Verify with Supabase Auth
- Check email domain = 'gangerdermatology.com'
- Apply row-level security based on user role
```

## 📊 **TEAM OWNERSHIP MATRIX**

| Component | Frontend Owns | Backend Owns | Shared Responsibility |
|-----------|---------------|--------------|----------------------|
| **User Input** | Form UI, client validation | Data sanitization, DB validation | Input schemas, validation rules |
| **Data Display** | Component rendering, formatting | Data processing, queries | Response format, error messages |
| **Authentication** | Token storage, login UI | Token validation, session management | JWT format, expiration handling |
| **File Upload** | Upload UI, progress indicators | File processing, virus scanning | File type validation, size limits |
| **Real-time Updates** | UI subscriptions, state updates | WebSocket broadcasting, data changes | Event format, subscription topics |
| **Error Handling** | User-friendly error messages | Error logging, response codes | Error codes, message format |
| **Form Validation** | Immediate UI feedback | Server-side data validation | Validation schemas, error formats |
| **Search/Filtering** | Search UI, filter controls | Database queries, indexing | Query parameters, result format |

## 📂 **FRONTEND IMPLEMENTATION SCOPE**

### **✅ Your Responsibilities:**

#### **User Interface Layer**
- Design and implement all React components in `apps/staff/src/components/`
- Create responsive layouts for desktop, tablet, and mobile in `src/styles/`
- Implement Next.js pages and routing in `apps/staff/src/pages/`
- Build custom hooks for data fetching and state management in `src/hooks/`
- Create reusable UI patterns extending @ganger/ui components

#### **User Experience**
- Form interfaces with real-time validation and user feedback
- Loading states, error handling, and success confirmations
- Intuitive navigation and information architecture
- Accessibility compliance (WCAG 2.1 AA) with keyboard navigation
- Mobile-first responsive design with touch optimizations

#### **Client-Side State Management**
- React Query integration for server state management
- Zustand stores for client-side UI state
- Real-time subscription handling for live updates
- Optimistic updates for better perceived performance
- Local storage management for user preferences

#### **API Integration**
- HTTP client setup with authentication header management
- Error handling and retry logic for API calls
- Data transformation between API and UI formats
- WebSocket subscription management for real-time features
- Mock data integration during development

#### **Performance Optimization**
- Code splitting and lazy loading for large components
- Image optimization and asset management
- Client-side caching strategies
- Bundle size optimization
- Core Web Vitals optimization

### **🚫 Do NOT Implement:**
❌ **Database schemas or migrations** (Backend team responsibility)  
❌ **API route handlers** (Backend team responsibility)  
❌ **Server-side authentication logic** (Backend team responsibility)  
❌ **Business logic processing** (Backend team responsibility)  
❌ **External API integrations** (Backend team responsibility)  
❌ **Email or SMS sending** (Backend team responsibility)  
❌ **File virus scanning or processing** (Backend team responsibility)  
❌ **Database queries or optimization** (Backend team responsibility)

### **🤝 Backend Dependencies:**
- Backend will provide working API endpoints with documented contracts
- Backend will handle all data validation and business logic processing
- Backend will manage authentication tokens and session validation
- Backend will provide real-time WebSocket events for UI updates
- Backend will handle all external service integrations

## 🎨 **Frontend Technical Architecture**

### **Component Design System**
- **Framework**: Next.js 14 with React 18 and TypeScript
- **Styling**: Tailwind CSS with Ganger Design System
- **State Management**: React Query for server state + Zustand for client state
- **Form Management**: React Hook Form with Zod validation
- **UI Components**: @ganger/ui shared component library
- **Real-time**: Supabase client-side subscriptions

### **Technology Stack**
- **Frontend Framework**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) + Zustand
- **Form Handling**: React Hook Form + Zod schemas
- **Animations**: Framer Motion for micro-interactions
- **Icons**: Lucide React icon library
- **Testing**: Jest + React Testing Library

## 🎨 **User Interface Design**

### **Dashboard Layout**
```typescript
interface StaffDashboard {
  header: {
    userProfile: UserProfile;
    notifications: NotificationBadge;
    quickActions: QuickActionMenu;
  };
  sidebar: {
    navigation: NavigationMenu;
    formTypes: FormTypeList;
    filters: FilterPanel;
  };
  main: {
    ticketList: TicketListView;
    ticketDetail: TicketDetailView;
    formEditor: DynamicFormView;
  };
  footer: {
    statusBar: SystemStatusBar;
    helpCenter: HelpCenterLink;
  };
}
```

### **Responsive Design Requirements**
- **Desktop**: Full-featured dashboard with multi-panel layout
- **Tablet**: Collapsible sidebar with touch-optimized controls
- **Mobile**: Stack layout with bottom navigation and swipe gestures
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation

### **Component Hierarchy**

#### **Layout Components**
```typescript
// components/layout/
├── DashboardLayout.tsx        // Main application layout
├── Sidebar.tsx               // Navigation sidebar
├── Header.tsx                // Top navigation bar
├── Footer.tsx                // Footer with status info
└── MobileNav.tsx             // Mobile navigation drawer
```

#### **Ticket Management Components**
```typescript
// components/tickets/
├── TicketList.tsx            // Main ticket listing
├── TicketCard.tsx            // Individual ticket card
├── TicketDetail.tsx          // Detailed ticket view
├── TicketForm.tsx            // Create/edit ticket form
├── StatusBadge.tsx           // Status indicator
├── PriorityIndicator.tsx     // Priority visual indicator
└── TicketFilters.tsx         // Filtering controls
```

#### **Form System Components**
```typescript
// components/forms/
├── DynamicForm.tsx           // Dynamic form renderer
├── FormBuilder.tsx           // Form definition editor
├── FormField.tsx             // Individual form field
├── FormPreview.tsx           // Form preview mode
├── FieldTypes/               // Specific field components
│   ├── TextInput.tsx
│   ├── SelectField.tsx
│   ├── DatePicker.tsx
│   ├── FileUpload.tsx
│   └── RichTextEditor.tsx
└── FormValidation.tsx        // Client-side validation
```

#### **User Management Components**
```typescript
// components/users/
├── UserProfile.tsx           // User profile display
├── UserList.tsx             // Staff directory
├── UserCard.tsx             // User info card
├── UserForm.tsx             // Create/edit user
├── RoleSelector.tsx         // Role management
└── UserSearch.tsx           // User search/filter
```

#### **Communication Components**
```typescript
// components/communication/
├── CommentThread.tsx         // Ticket comments
├── CommentForm.tsx          // Add comment form
├── NotificationCenter.tsx   // Notification panel
├── NotificationItem.tsx     // Individual notification
└── ChatInterface.tsx        // Real-time messaging
```

#### **File Management Components**
```typescript
// components/files/
├── FileUpload.tsx           // File upload interface
├── FileList.tsx             // Attachment listing
├── FilePreview.tsx          // File preview modal
├── FileDownload.tsx         // Download handler
└── ProgressIndicator.tsx    // Upload progress
```

## 📱 **Mobile-First Design**

### **Progressive Web App Features**
```typescript
// components/pwa/
├── InstallPrompt.tsx         // PWA installation banner
├── OfflineIndicator.tsx      // Network status indicator
├── ServiceWorkerManager.tsx  // SW registration
└── PushNotifications.tsx     // Push notification handler
```

### **Mobile-Specific Components**
```typescript
// components/mobile/
├── SwipeActions.tsx          // Swipe-to-action for tickets
├── PullToRefresh.tsx        // Pull-to-refresh functionality
├── MobileForm.tsx           // Mobile-optimized forms
├── TouchGestures.tsx        // Touch interaction handlers
└── MobileSearch.tsx         // Mobile search interface
```

### **Responsive Utilities**
```typescript
// hooks/useResponsive.ts
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setBreakpoint('mobile');
      else if (width < 1024) setBreakpoint('tablet');
      else setBreakpoint('desktop');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return { breakpoint, isMobile: breakpoint === 'mobile' };
};
```

## 🔧 **Frontend Form Specifications**

### **Support Ticket Form**
```typescript
// components/forms/SupportTicketForm.tsx
interface SupportTicketFormData {
  location: 'Northfield' | 'Woodbury' | 'Burnsville';
  requestType: 'General Support' | 'Equipment Issue' | 'Software Problem' | 'Network Issue' | 'Other';
  priority: {
    urgency: 'Urgent' | 'Not Urgent';
    importance: 'Important' | 'Not Important';
  };
  description: string; // max 2000 chars
  attachments: File[]; // max 10 files, 50MB total
}

const SupportTicketForm: React.FC = () => {
  const form = useForm<SupportTicketFormData>({
    resolver: zodResolver(supportTicketSchema),
  });

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Location Selector */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Northfield">Northfield</SelectItem>
                  <SelectItem value="Woodbury">Woodbury</SelectItem>
                  <SelectItem value="Burnsville">Burnsville</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Priority Matrix */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority Matrix *</FormLabel>
              <PriorityMatrix value={field.value} onChange={field.onChange} />
            </FormItem>
          )}
        />

        {/* File Upload */}
        <FormField
          control={form.control}
          name="attachments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attachments</FormLabel>
              <FileUpload
                multiple
                maxFiles={10}
                maxSize={50 * 1024 * 1024} // 50MB
                accept="image/*,.pdf,.doc,.docx"
                onFilesChange={field.onChange}
              />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
};
```

### **Time Off Request Form**
```typescript
// components/forms/TimeOffRequestForm.tsx
interface TimeOffRequestFormData {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  ptoElection: 'Paid Time Off' | 'Unpaid Leave' | 'Sick Leave';
  reason?: string; // max 500 chars
}

const TimeOffRequestForm: React.FC = () => {
  const form = useForm<TimeOffRequestFormData>({
    resolver: zodResolver(timeOffRequestSchema),
  });

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Date Range Picker */}
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Range *</FormLabel>
              <DateRangePicker
                value={field.value}
                onChange={field.onChange}
                minAdvanceNotice={48} // 48 hours
                disabledDates={getHolidayDates()}
              />
            </FormItem>
          )}
        />

        {/* PTO Election */}
        <FormField
          control={form.control}
          name="ptoElection"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Off Type *</FormLabel>
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Paid Time Off" id="pto" />
                  <label htmlFor="pto">Paid Time Off</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Unpaid Leave" id="unpaid" />
                  <label htmlFor="unpaid">Unpaid Leave</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sick Leave" id="sick" />
                  <label htmlFor="sick">Sick Leave</label>
                </div>
              </RadioGroup>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
};
```

### **Punch Fix Form**
```typescript
// components/forms/PunchFixForm.tsx
interface PunchFixFormData {
  employeeSelect: string; // For managers only
  date: Date;
  punchIn?: string; // time string
  punchOut?: string; // time string
  comments: string; // max 500 chars
}

const PunchFixForm: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Employee Selector (Managers Only) */}
        {isManager && (
          <FormField
            control={form.control}
            name="employeeSelect"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee *</FormLabel>
                <EmployeeAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  dataSource="google_directory"
                />
              </FormItem>
            )}
          />
        )}

        {/* Date Picker */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date *</FormLabel>
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                maxPastDays={14}
                disableFuture
              />
            </FormItem>
          )}
        />

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="punchIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punch In Time</FormLabel>
                <TimePicker value={field.value} onChange={field.onChange} />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="punchOut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punch Out Time</FormLabel>
                <TimePicker value={field.value} onChange={field.onChange} />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
};
```

## 🔄 **Frontend State Management**

### **React Query Integration**
```typescript
// hooks/useTickets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useTickets = (filters?: TicketFilters) => {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => fetchTickets(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTicket,
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.setQueryData(['tickets', newTicket.id], newTicket);
    },
  });
};

export const useTicketDetail = (ticketId: string) => {
  return useQuery({
    queryKey: ['tickets', ticketId],
    queryFn: () => fetchTicketDetail(ticketId),
    enabled: !!ticketId,
  });
};
```

### **Client State with Zustand**
```typescript
// stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  currentView: 'list' | 'detail' | 'form';
  selectedTicket: string | null;
  filters: TicketFilters;
  notifications: Notification[];
  
  // Actions
  toggleSidebar: () => void;
  setCurrentView: (view: 'list' | 'detail' | 'form') => void;
  selectTicket: (ticketId: string | null) => void;
  updateFilters: (filters: Partial<TicketFilters>) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentView: 'list',
  selectedTicket: null,
  filters: {},
  notifications: [],
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCurrentView: (view) => set({ currentView: view }),
  selectTicket: (ticketId) => set({ selectedTicket: ticketId }),
  updateFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, notification]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}));
```

### **Real-time Subscriptions**
```typescript
// hooks/useRealtimeSubscriptions.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to ticket changes
    const ticketsSubscription = supabase
      .channel('staff_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_tickets',
        },
        (payload) => {
          // Invalidate and refetch tickets
          queryClient.invalidateQueries({ queryKey: ['tickets'] });
          
          // Update specific ticket if it's in cache
          if (payload.new) {
            queryClient.setQueryData(['tickets', payload.new.id], payload.new);
          }
        }
      )
      .subscribe();

    // Subscribe to comment changes
    const commentsSubscription = supabase
      .channel('staff_comments_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_ticket_comments',
        },
        (payload) => {
          // Update ticket detail with new comment
          queryClient.invalidateQueries({ 
            queryKey: ['tickets', payload.new.ticket_id] 
          });
        }
      )
      .subscribe();

    return () => {
      ticketsSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
    };
  }, [queryClient]);
};
```

## 🔐 **Frontend Authentication**

### **Auth Hook Implementation**
```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase-client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: 'gangerdermatology.com', // Domain restriction
        },
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (error) {
      console.error('Error signing in:', error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      router.push('/auth/login');
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };
};
```

### **Protected Route Component**
```typescript
// components/auth/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@ganger/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'staff' | 'manager' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (requiredRole && !hasRequiredRole(user, requiredRole)) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};
```

## 📊 **Frontend Performance Optimization**

### **Code Splitting Strategy**
```typescript
// Dynamic imports for form components
const SupportTicketForm = dynamic(() => import('@/components/forms/SupportTicketForm'), {
  loading: () => <FormSkeleton />,
});

const TimeOffRequestForm = dynamic(() => import('@/components/forms/TimeOffRequestForm'), {
  loading: () => <FormSkeleton />,
});

// Lazy load heavy components
const ReportsDashboard = lazy(() => import('@/components/reports/ReportsDashboard'));
const AnalyticsCharts = lazy(() => import('@/components/analytics/AnalyticsCharts'));
```

### **Performance Monitoring**
```typescript
// hooks/usePerformanceMonitoring.ts
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Track page load times
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          analytics.track('page_load_time', {
            duration: entry.duration,
            page: window.location.pathname,
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['navigation'] });
    
    return () => observer.disconnect();
  }, []);
};
```

## 📚 **Implementation Standards & Procedures**

### **Development Standards**
This migration follows established Ganger Platform standards:
- **Frontend Development**: `/true-docs/FRONTEND_DEVELOPMENT_GUIDE.md` - Component patterns, state management, and UI standards
- **Shared Infrastructure**: `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md` - Authentication, integrations, and deployment patterns

### **Quality Assurance & Testing**
- **Component Testing**: React Testing Library patterns in `/true-docs/FRONTEND_DEVELOPMENT_GUIDE.md#component-testing`
- **Code Quality**: TypeScript standards and ESLint configurations in `/true-docs/FRONTEND_DEVELOPMENT_GUIDE.md#code-quality`
- **Accessibility Testing**: WCAG compliance validation procedures

### **Training & Change Management**
- **User Training**: Training delivery methodology and materials in `/true-docs/AI_WORKFLOW_GUIDE.md#user-training-protocols`
- **Documentation Standards**: Technical writing and maintenance in `/true-docs/PROJECT_TRACKER.md#documentation-references`

## 🎯 **Frontend User Experience Goals**

### **Legacy UI Comparison**
| Legacy Feature | Modern Implementation | Enhancement |
|---|---|---| 
| Basic PHP forms | React Hook Form + real-time validation | 80% faster form completion |
| Static dashboard | Real-time dashboard with live updates | Immediate status awareness |
| Desktop-only UI | Mobile-first responsive design | 100% mobile compatibility |
| Basic file upload | Progressive upload with preview | Visual upload progress |
| Page refreshes | SPA navigation with smooth transitions | Seamless user experience |
| Limited search | Advanced filtering and search | Instant results |

### **Accessibility Requirements**
- **Keyboard Navigation**: Full keyboard accessibility for all features
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant color ratios
- **Focus Management**: Clear focus indicators and logical tab order
- **Alternative Text**: Descriptive alt text for all images and icons

### **Performance Targets**
- **Initial Page Load**: <500ms Time to Interactive
- **Route Transitions**: <200ms navigation between pages
- **Form Interactions**: <100ms response to user input
- **Real-time Updates**: <50ms UI update latency
- **Mobile Performance**: 90+ Lighthouse score

## 🔄 **CONCURRENT DEVELOPMENT FLOW**

### **Phase 1: Foundation Setup (Week 1)**
#### **✅ Frontend Team Deliverables:**
- [ ] **Project Structure**: Next.js app with TypeScript, Tailwind, and routing
- [ ] **Layout Components**: Header, Sidebar, Footer with responsive design
- [ ] **Authentication UI**: Login page, protected routes, user profile display
- [ ] **Mock Integration**: All components working with mock data from API stubs

#### **🤝 Coordination with Backend:**
- [ ] **API Contract Review**: Validate endpoint specifications and data schemas
- [ ] **Mock Data Integration**: Connect to Backend's API stubs for development
- [ ] **Shared Types Validation**: Ensure TypeScript interfaces match Backend contracts
- [ ] **Authentication Flow**: End-to-end OAuth flow testing

#### **📊 Success Criteria:**
- All major layouts render correctly on desktop and mobile
- Authentication flow works with Backend's OAuth implementation
- Mock data displays properly in all UI components
- Both teams agree on component-to-API mapping

### **Phase 2: Core Implementation (Week 2-3)**
#### **✅ Frontend Team Deliverables:**
- [ ] **Ticket Management UI**: List, detail, and form components with full functionality
- [ ] **Real-time Integration**: Live updates for tickets and comments
- [ ] **File Upload Interface**: Progress indicators, drag-drop, preview
- [ ] **Form System**: All legacy form types with validation and error handling

#### **🤝 Coordination with Backend:**
- [ ] **API Integration**: Switch from mocks to real Backend endpoints
- [ ] **Error Handling**: Coordinate error message formats and user feedback
- [ ] **Real-time Testing**: Validate WebSocket subscriptions and UI updates
- [ ] **Performance Testing**: Ensure UI responds within target times

#### **📊 Success Criteria:**
- All user workflows functional from form submission to approval
- Real-time updates work seamlessly across browser tabs
- File upload with progress tracking fully operational
- UI performance meets <500ms page load targets

### **Phase 3: Advanced Features (Week 4)**
#### **✅ Frontend Team Deliverables:**
- [ ] **Advanced UI Features**: Search/filtering, bulk operations, keyboard shortcuts
- [ ] **Mobile Optimization**: Touch gestures, responsive forms, offline capabilities
- [ ] **Accessibility**: WCAG 2.1 AA compliance, screen reader support
- [ ] **Performance Polish**: Code splitting, image optimization, cache management

#### **🤝 Coordination with Backend:**
- [ ] **End-to-End Testing**: Complete user workflow validation
- [ ] **Performance Validation**: UI + API performance under realistic load
- [ ] **Security Testing**: Frontend security measures validation
- [ ] **Production Deployment**: Coordinated deployment and monitoring

#### **📊 Success Criteria:**
- Mobile experience matches desktop functionality
- Accessibility audit passes with 100% compliance
- Performance targets met under production load
- Ready for user acceptance testing

## 🧪 **INTEGRATION TESTING STRATEGY**

### **API Integration Tests**
```typescript
// Coordinate with Backend team for these tests
describe('API Integration', () => {
  it('displays ticket list from backend API', async () => {
    // Frontend: Renders TicketList component
    render(<TicketList />);
    
    // Backend: Returns structured ticket data
    await waitForElementByText('Support Ticket #123');
    
    // Validation: UI displays backend data correctly
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
  });
  
  it('submits new ticket via form', async () => {
    // Frontend: User fills out form
    render(<TicketForm />);
    await userEvent.type(screen.getByLabelText('Title'), 'Test ticket');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    // Backend: Processes form submission
    // Frontend: Shows success confirmation
    await waitForElementByText('Ticket created successfully');
  });
});
```

### **Real-time Features Testing**
```typescript
describe('Real-time Updates', () => {
  it('updates UI when ticket status changes', async () => {
    // Frontend: Displays ticket with 'pending' status
    render(<TicketDetail ticketId="123" />);
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    
    // Backend: Triggers status update via WebSocket
    // Frontend: Updates UI automatically
    await waitForElementByText('Approved');
    expect(screen.queryByText('Pending Approval')).not.toBeInTheDocument();
  });
});
```

### **Weekly Coordination Schedule**
- **Monday**: Frontend components + Backend API stubs integration
- **Wednesday**: Real-time features coordination and testing
- **Friday**: End-to-end user workflow validation

## 📊 **DEPLOYMENT COORDINATION**

### **Deployment Dependencies**
1. **Backend APIs Ready**: All endpoints tested and returning correct data
2. **Environment Variables**: Client-side configuration updated for production
3. **Asset Optimization**: Images, fonts, and static files optimized for CDN
4. **Browser Compatibility**: Cross-browser testing completed
5. **Mobile Testing**: iOS/Android testing on real devices

### **Frontend Deployment Process**
```bash
# Frontend can deploy after Backend APIs are ready
npm run build              # Production build with optimizations
npm run test:e2e          # End-to-end testing against production APIs
npm run deploy:staging    # Deploy to staging environment
npm run validate:staging  # Validate all features work in staging
npm run deploy:production # Deploy to production after validation
```

### **Post-Deployment Validation**
- [ ] **Core Workflows**: All major user journeys working
- [ ] **Authentication**: Google OAuth integration working in production
- [ ] **Real-time Features**: WebSocket connections established
- [ ] **Mobile Experience**: Touch interface working on real devices
- [ ] **Performance**: Core Web Vitals meeting targets
- [ ] **Accessibility**: Screen reader navigation working

## 🎯 **USER EXPERIENCE VALIDATION**

### **Legacy UI Comparison Testing**
| Legacy Feature | Modern Implementation | User Improvement |
|---|---|---| 
| PHP form page loads | React SPA navigation | 85% faster page transitions |
| Static table display | Real-time dashboard | Immediate status awareness |
| Desktop-only interface | Mobile-first design | 100% mobile task completion |
| File upload with page refresh | Progressive upload with preview | Visual progress + drag-drop |
| Manual refresh for updates | Automatic live updates | Zero manual refresh needed |
| Basic search | Advanced filtering | 90% faster information discovery |

### **Accessibility Validation Protocol**
```typescript
describe('Accessibility Compliance', () => {
  it('supports keyboard navigation', async () => {
    render(<TicketForm />);
    
    // Test tab order and focus management
    await userEvent.tab();
    expect(screen.getByLabelText('Location')).toHaveFocus();
    
    // Test form submission with Enter key
    await userEvent.keyboard('{Enter}');
    await waitForElementByText('Ticket created successfully');
  });
  
  it('provides screen reader announcements', async () => {
    render(<TicketList />);
    
    // Test live region announcements
    await waitForElementByText('3 new tickets available');
    expect(screen.getByRole('status')).toHaveTextContent('3 new tickets');
  });
});
```

### **Mobile Experience Validation**
- **Touch Targets**: Minimum 44px tap targets for all interactive elements
- **Gesture Support**: Swipe-to-refresh, pull-to-load-more functionality
- **Offline Capability**: Forms save locally, sync when connection restored
- **Performance**: 60fps animations, <3s initial load on 3G networks

## 🔧 **DEVELOPMENT TOOLS & SETUP**

### **Required Development Environment**
```bash
# Frontend-specific setup
npm install                    # Install all dependencies
npm run dev                   # Start development server
npm run storybook            # Component development environment
npm run test:watch          # Jest testing in watch mode
npm run type-check          # TypeScript validation
```

### **Browser Development Tools**
- **React DevTools**: Component debugging and performance profiling
- **Redux DevTools**: State management debugging (for Zustand)
- **Lighthouse**: Performance and accessibility auditing
- **Axe DevTools**: Accessibility testing and validation

### **Mock Data Development**
```typescript
// Use during development before Backend APIs ready
const mockTickets: Ticket[] = [
  {
    id: '1',
    form_type: 'support_ticket',
    submitter: { id: '1', email: 'staff@gangerdermatology.com', name: 'Test User' },
    status: 'pending',
    priority: 'medium',
    location: 'Northfield',
    title: 'Test Support Ticket',
    description: 'This is a test ticket for development',
    form_data: {},
    comments: [],
    attachments: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
```

---

**Project Sponsor**: Anand Ganger  
**Frontend Lead**: Frontend Development Team  
**Stakeholders**: Backend Team, HR Department, End Users  
**Estimated Timeline**: 10 weeks frontend development  
**Estimated Effort**: 300-400 frontend development hours  

*This Frontend PRD ensures complete user interface implementation for the modernized staff management platform with clear team boundaries and zero conflicts with backend development.*