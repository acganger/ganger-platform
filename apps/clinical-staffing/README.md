# Clinical Staffing Optimization Frontend

A React/Next.js frontend application for optimizing clinical support staff assignments at Ganger Dermatology locations.

## 🚀 Features

- **Interactive Schedule Builder**: Drag & drop interface for staff assignments
- **Real-time Updates**: Live synchronization of schedule changes
- **Mobile-First Design**: Responsive interface optimized for mobile devices
- **Analytics Dashboard**: Performance metrics and optimization insights
- **Staff Management**: Availability tracking and preference management
- **AI Suggestions**: Automated optimization recommendations

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS with @ganger/ui design system
- **Authentication**: @ganger/auth integration
- **Real-time**: Supabase subscriptions
- **Testing**: Jest with React Testing Library

### Component Structure
```
src/
├── components/
│   ├── layout/          # Main layout components
│   ├── schedule/        # Schedule builder components
│   ├── staff/           # Staff management components
│   ├── forms/           # Form components with validation
│   ├── mobile/          # Mobile-specific components
│   └── analytics/       # Analytics and visualization
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and API clients
├── pages/               # Next.js pages
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

## 🎯 Key Components

### StaffingDashboard
Main dashboard component with desktop and mobile views.

**Features:**
- Real-time schedule updates
- Location filtering
- Date navigation
- Error handling and loading states

### ScheduleBuilder
Interactive schedule management interface.

**Features:**
- Staff assignment grid
- Provider schedule visualization
- Form validation
- Optimistic updates

### MobileScheduleView
Touch-optimized mobile interface.

**Features:**
- Tab-based navigation
- Touch-friendly controls
- Responsive design
- Simplified workflows

### CoverageAnalytics
Performance metrics and insights dashboard.

**Features:**
- Coverage rate tracking
- Cost analysis
- Optimization metrics
- Trend visualization

## 📱 Responsive Design

The application uses a mobile-first approach with:

- **Desktop (lg+)**: Full grid layout with sidebar
- **Mobile (<lg)**: Stacked layout with tab navigation
- **Touch-optimized**: Large touch targets and gestures
- **Design tokens**: Consistent spacing and colors from @ganger/ui

## 🔄 Real-time Features

Real-time updates powered by Supabase:

- **Live schedule changes**: Immediate updates across all clients
- **Connection monitoring**: Visual indicators for connection status
- **Automatic reconnection**: Handles network interruptions
- **Optimistic updates**: Immediate UI feedback

## 🧪 Testing

### Test Setup
- Jest configuration with Next.js integration
- React Testing Library for component testing
- @ganger package mocking
- Accessibility testing with jest-axe

### Running Tests
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run accessibility tests
npm run test:a11y

# Run performance tests
npm run test:performance
```

### Test Coverage
- Component rendering
- User interactions
- Error handling
- Accessibility compliance
- Real-time functionality

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm 9+
- Access to @ganger workspace packages

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3005
```

### Available Scripts
```bash
npm run dev              # Development server
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint
npm run type-check       # TypeScript compilation
npm test                 # Run tests
npm run analyze:bundle   # Bundle analysis
```

### Code Quality
- **TypeScript**: Zero compilation errors enforced
- **ESLint**: Consistent code style
- **@ganger/ui**: Mandatory component library usage
- **Client-server boundaries**: Proper 'use client' directive usage

## 📊 Performance

### Budgets
- **Bundle size**: <250KB gzipped
- **Load time**: <2s first contentful paint
- **Interaction**: <100ms response time
- **Memory**: Efficient subscription management

### Optimization
- **Code splitting**: Dynamic imports for analytics
- **Lazy loading**: Components loaded on demand
- **Bundle analysis**: Webpack Bundle Analyzer integration
- **Memory management**: Proper cleanup of subscriptions

## 🔒 Security

### Client-side Security
- **Input validation**: Comprehensive form validation
- **XSS protection**: Sanitized data rendering
- **CSRF protection**: Secure form submissions
- **Authentication**: @ganger/auth integration

### Data Protection
- **Client-safe APIs**: No sensitive data exposure
- **Secure tokens**: Proper token management
- **HTTPS enforcement**: Secure communication only

## 🌐 Deployment

### Build Process
```bash
# Production build
npm run build

# Verify build
npm start
```

### Environment Variables
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deployment Targets
- **Cloudflare Workers**: Primary deployment target
- **Static export**: For CDN distribution
- **Edge functions**: For optimal performance

## 🔗 Integration

### Backend Dependencies
The frontend integrates with backend APIs:

- `GET /api/staff-schedules` - Schedule data
- `POST /api/staff-schedules` - Create schedules
- `PUT /api/staff-schedules/:id` - Update schedules
- `GET /api/staff-members` - Staff data
- `GET /api/providers` - Provider data
- `POST /api/staffing/suggestions` - AI suggestions
- `GET /api/analytics/staffing` - Analytics data

### Package Dependencies
- `@ganger/ui` - Design system components
- `@ganger/auth` - Authentication utilities
- `@ganger/utils` - Shared utilities
- `@ganger/types` - Type definitions

## 📚 Documentation

### API Documentation
All API endpoints follow standard response format:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: PaginationMeta;
  };
}
```

### Component Documentation
Each component includes:
- TypeScript interfaces
- Props documentation
- Usage examples
- Accessibility notes

## 🐛 Troubleshooting

### Common Issues

**TypeScript errors:**
```bash
npm run type-check
```

**Build failures:**
```bash
npm run clean
npm install
npm run build
```

**Test failures:**
```bash
npm test -- --verbose
```

**Bundle size issues:**
```bash
npm run analyze:bundle
```

### Development Tips
- Use React Developer Tools for debugging
- Check browser Network tab for API issues
- Monitor console for real-time connection issues
- Use accessibility tools for testing

## 📄 License

Private internal application for Ganger Dermatology.

---

*Last updated: January 2025*
*Version: 1.0.0*