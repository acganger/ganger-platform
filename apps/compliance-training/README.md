# Compliance Training Manager Dashboard - Frontend

A React/Next.js frontend application for managing and tracking employee compliance training across Ganger Dermatology locations.

## 🎯 Overview

This frontend application provides a comprehensive dashboard for managers, HR staff, and administrators to:

- **View Compliance Matrix**: Interactive grid showing employee vs training completion status
- **Real-time Updates**: Live compliance status updates via Supabase subscriptions
- **Advanced Filtering**: Filter by department, location, status, and search employees
- **Export Reports**: Generate CSV and PDF compliance reports
- **Mobile Responsive**: Optimized interface for tablet and mobile manager access

## 🏗️ Architecture

### Frontend Technology Stack
- **Framework**: Next.js 14 with App Router
- **State Management**: React Context + useReducer
- **UI Components**: @ganger/ui component library (mandatory)
- **Authentication**: @ganger/auth/client
- **Data Visualization**: Chart.js + react-chartjs-2
- **Real-time**: Supabase subscriptions
- **Styling**: Tailwind CSS with compliance-specific design tokens

### Client-Server Boundaries
- **Frontend (this app)**: UI components, state management, real-time updates
- **Backend (API routes)**: Data fetching, external integrations, server-side validation
- **Shared**: TypeScript types, authentication, utilities

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Access to @ganger/* workspace packages
- Valid @gangerdermatology.com authentication

### Development
```bash
# Install dependencies
npm install

# Start development server (runs on port 3007)
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build
```

### Environment Variables
```bash
# Client-side (public) variables
NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://compliance.gangerdermatology.com
```

## 📱 Features

### Core Dashboard Components
- **ComplianceMatrix**: Main grid view of employee compliance status
- **ComplianceFilters**: Interactive filtering and search
- **ComplianceStats**: Summary statistics and KPIs
- **ComplianceCharts**: Visual analytics and trends
- **ExportControls**: Report generation and download

### Real-time Features
- Live compliance status updates
- Instant filter application
- Real-time sync status indicators
- Automatic data refresh

### Mobile Responsiveness
- Touch-optimized interface
- Responsive compliance matrix
- Mobile-friendly filters
- Tablet dashboard view

## 🎨 UI Standards

### Component Usage
```typescript
// ✅ REQUIRED - Use @ganger/ui exclusively
import { 
  AppLayout, PageHeader, Card, Button, DataTable,
  LoadingSpinner, Modal, Toast, ErrorBoundary 
} from '@ganger/ui';

// ❌ PROHIBITED - No custom UI components
const CustomButton = () => <button>...</button>; // Don't do this
```

### Compliance Color System
- **Completed**: `emerald-500` (training completed)
- **Overdue**: `red-500` (overdue training)
- **In Progress**: `yellow-500` (training in progress)
- **Not Started**: `gray-400` (not started)
- **Not Required**: `gray-300` (not required for employee)

## 🔌 API Integration

### Backend Dependencies
The backend terminal must provide these API endpoints:

```typescript
// Required API routes (handled by backend terminal)
GET  /api/compliance/dashboard     // Dashboard data with matrix
GET  /api/compliance/employees     // Employee list
GET  /api/compliance/matrix        // Compliance matrix
POST /api/compliance/sync          // Trigger external sync
POST /api/compliance/export        // Export reports
```

### Error Handling
- Automatic retry for network errors
- User-friendly error messages
- Graceful degradation for missing data
- Loading states for all async operations

## 🧪 Testing

### Component Testing
```bash
# Run component tests
npm run test

# Test with coverage
npm run test:coverage

# Accessibility testing
npm run test:a11y
```

### Quality Gates
```bash
# TypeScript compilation (must pass with 0 errors)
npm run type-check

# Production build verification
npm run build

# UI component compliance audit
npm run audit:ui-compliance
```

## 📊 Performance

### Performance Budgets
- **Initial Load**: < 2 seconds
- **Filter Response**: < 100ms
- **Real-time Updates**: < 500ms
- **Chart Rendering**: < 1 second
- **Export Generation**: < 3 seconds

### Bundle Optimization
- Tree-shaking for unused code
- Code splitting for lazy loading
- Image optimization with WebP
- Client-server boundary enforcement

## 🔒 Security & Access Control

### Authentication
- Google OAuth with @gangerdermatology.com domain restriction
- Manager+ role required for dashboard access
- Session management via @ganger/auth

### Data Protection
- Client-side input validation
- No sensitive data in client state
- Secure API communication
- HIPAA-compliant data handling

## 📚 Documentation

### Component Documentation
- ComplianceMatrix usage patterns
- Real-time update implementation
- Filter state management
- Export functionality guide

### Development Patterns
- Context provider setup
- API client implementation
- Error handling strategies
- Performance optimization techniques

## 🚀 Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Verify build output
npm run start
```

### Environment Configuration
- Cloudflare Workers deployment
- Static export optimization
- CDN asset optimization
- Real-time WebSocket connections

## 🔄 Coordination with Backend

This frontend application works in coordination with the backend terminal that provides:

1. **API Endpoints**: All `/api/compliance/*` routes
2. **External Integrations**: Google Classroom and Zenefits sync
3. **Database Operations**: Supabase queries and mutations
4. **Authentication Middleware**: Server-side auth validation
5. **Real-time Triggers**: Database change notifications

See `PRD_Compliance_Training_Backend.md` for backend specifications.

---

**Frontend Development Terminal - Compliance Training Dashboard**  
*Built with @ganger/ui component library and Next.js 14*