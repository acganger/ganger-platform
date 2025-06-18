## ⚡ **Performance Budgets & Monitoring**

### **Mandatory Performance Standards**

**Page Load Performance Budgets:**
```typescript
const SOCIALS_REVIEWS_PERFORMANCE_BUDGETS = {
  // First Contentful Paint
  fcp: 1200, // 1.2s max (critical for dashboard responsiveness)
  
  // Largest Contentful Paint
  lcp: 2000, // 2.0s max (dashboard with data tables)
  
  // Cumulative Layout Shift
  cls: 0.1, // Max 0.1 CLS score (stable grid layouts)
  
  // Time to Interactive
  tti: 3000, // 3.0s max (real-time features)
  
  // First Input Delay
  fid: 100 // 100ms max (responsive "GD It" buttons)
};
```

**Bundle Size Budgets (gzipped):**
```typescript
const BUNDLE_SIZE_LIMITS = {
  'pages/_app.js': 120000,    // 120KB max app shell
  'pages/index.js': 200000,   // 200KB max dashboard page
  'pages/reviews.js': 180000, // 180KB max reviews page
  'pages/social.js': 200000,  // 200KB max social monitoring
  'pages/content.js': 160000, // 160KB max content library
  
  // Component-specific limits
  'components/ReviewCard.js': 15000,     // 15KB max per review card
  'components/SocialPostCard.js': 20000, // 20KB max per post card
  'components/ContentModal.js': 25000,   // 25KB max adaptation modal
};
```

**Real-time Performance Monitoring:**
```typescript
'use client'

import { useEffect } from 'react';

export function usePerformanceMonitoring() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            if (entry.startTime > 1200) {
              console.warn(`FCP budget exceeded: ${entry.startTime}ms`);
            }
          }
        }
      }).observe({ entryTypes: ['paint'] });
      
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.startTime > 2000) {
            console.warn(`LCP budget exceeded: ${entry.startTime}ms`);
          }
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        if (clsValue > 0.1) {
          console.warn(`CLS budget exceeded: ${clsValue}`);
        }
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }, []);
}
```

### **Component Performance Standards**

**React Component Optimization:**
```typescript
'use client'

import { memo, useMemo, useCallback } from 'react';
import { ReviewCard } from './ReviewCard';

// ✅ REQUIRED: Memoization for expensive list rendering
export const ReviewsList = memo(function ReviewsList({ 
  reviews, 
  onUpdate 
}: {
  reviews: GoogleBusinessReview[];
  onUpdate: () => void;
}) {
  // Memoize expensive calculations
  const sortedReviews = useMemo(() => {
    return reviews.sort((a, b) => 
      new Date(b.review_date).getTime() - new Date(a.review_date).getTime()
    );
  }, [reviews]);
  
  // Memoize callback functions
  const handleReviewUpdate = useCallback((reviewId: string) => {
    onUpdate();
  }, [onUpdate]);
  
  return (
    <div className="space-y-4">
      {sortedReviews.map(review => (
        <ReviewCard 
          key={review.id}
          review={review}
          onUpdate={() => handleReviewUpdate(review.id)}
        />
      ))}
    </div>
  );
});
```

**Image Optimization Requirements:**
```typescript
'use client'

import Image from 'next/image';

// ✅ REQUIRED: Next.js Image optimization for all media
export function SocialPostImage({ 
  src, 
  alt, 
  width = 400, 
  height = 300 
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="rounded-lg object-cover"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R"
      priority={false}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

### **Build Performance Optimization**

**Webpack Bundle Analysis:**
```bash
# Add to package.json scripts
{
  "scripts": {
    "analyze": "cross-env ANALYZE=true next build",
    "audit:performance": "node scripts/audit-performance-budget.js"
  }
}
```

**Performance Audit Script:**
```javascript
// scripts/audit-performance-budget.js
const fs = require('fs');
const path = require('path');

const PERFORMANCE_BUDGETS = {
  'static/js/pages/_app.js': 120000,
  'static/js/pages/index.js': 200000,
  'static/css/main.css': 30000
};

function auditPerformanceBudget() {
  const buildDir = path.join(process.cwd(), '.next');
  let violations = 0;
  
  Object.entries(PERFORMANCE_BUDGETS).forEach(([filePath, budget]) => {
    const fullPath = path.join(buildDir, filePath);
    
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.size > budget) {
        console.error(`❌ ${filePath}: ${stats.size} bytes exceeds budget of ${budget} bytes`);
        violations++;
      } else {
        console.log(`✅ ${filePath}: ${stats.size} bytes within budget`);
      }
    }
  });
  
  if (violations > 0) {
    console.error(`\n❌ ${violations} performance budget violations detected`);
    process.exit(1);
  }
  
  console.log('\n✅ All performance budgets met');
}

auditPerformanceBudget();
```

---

## 🔄 API Integration

### **Client-Side API Calls**
```typescript
'use client'

export const socialsApi = {
  // Reviews
  async getReviews(filters: { location?: string; status?: string; page?: number }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    const response = await fetch(`/api/reviews?${params}`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },

  async generateReviewResponse(reviewId: string) {
    const response = await fetch('/api/reviews/generate-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId })
    });
    if (!response.ok) throw new Error('Failed to generate response');
    return response.json();
  },

  async approveReviewResponse(reviewId: string, response: string) {
    const result = await fetch('/api/reviews/approve-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, response })
    });
    if (!result.ok) throw new Error('Failed to approve response');
    return result.json();
  },

  // Social Media
  async getHighPerformingPosts(filters: { platform?: string; sortBy?: string }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`/api/social/trending?${params}`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  },

  async adaptContent(originalPostId: string, targetPlatforms: string[]) {
    const response = await fetch('/api/content/adapt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalPostId, targetPlatforms })
    });
    if (!response.ok) throw new Error('Failed to adapt content');
    return response.json();
  },

  async scheduleContent(contentId: string, publishAt: Date, platforms: string[]) {
    const response = await fetch(`/api/content/${contentId}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishAt: publishAt.toISOString(), platforms })
    });
    if (!response.ok) throw new Error('Failed to schedule content');
    return response.json();
  },

  // Analytics
  async getDashboardMetrics() {
    const response = await fetch('/api/analytics/dashboard');
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  }
};
```

---

## 🔍 **Quality Gates & Verification Requirements**

### **Pre-Commit Quality Gates (MANDATORY)**

**ALL commits must pass these quality gates:**
```bash
# 1. TypeScript Compilation - ZERO ERRORS TOLERANCE
npm run type-check
# Expected output: "Found 0 errors"

# 2. Component Library Compliance - NO CUSTOM COMPONENTS
npm run audit:ui-compliance
# Expected output: "✅ UI component compliance verified"

# 3. Client Directive Validation - PROPER 'use client' USAGE
npm run audit:use-client-directive
# Expected output: "✅ All interactive components properly use 'use client' directive"

# 4. Server Import Prevention - NO SERVER CODE IN CLIENT
npm run audit:server-imports
# Expected output: "✅ No server imports found in client code"

# 5. Performance Budget Compliance - BUNDLE SIZE LIMITS
npm run audit:performance-budget
# Expected output: "✅ Performance budget compliance verified"

# 6. Build Verification - PRODUCTION BUILD SUCCESS
npm run build
# Expected output: Build completed successfully
```

### **Development Quality Checks**

**Required Scripts (package.json):**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "audit:ui-compliance": "node scripts/audit-ui-compliance.js",
    "audit:use-client-directive": "node scripts/audit-use-client-directive.js",
    "audit:server-imports": "node scripts/audit-server-imports.js",
    "audit:performance-budget": "node scripts/audit-performance-budget.js",
    "pre-commit": "npm run type-check && npm run audit:ui-compliance && npm run audit:use-client-directive && npm run audit:server-imports && npm run audit:performance-budget"
  }
}
```

### **Prohibited Patterns Enforcement**

**UI Compliance Audit Script:**
```javascript
// scripts/audit-ui-compliance.js
const fs = require('fs');
const glob = require('glob');

const PROHIBITED_UI_PATTERNS = [
  // Custom button implementations
  /const.*Button.*=.*\(.*\).*=>.*<button/,
  /const.*Input.*=.*\(.*\).*=>.*<input/,
  /const.*Modal.*=.*\(.*\).*=>.*<div.*modal/,
  /const.*Card.*=.*\(.*\).*=>.*<div.*card/,
  
  // Inline styles
  /style={{/,
  
  // Direct HTML input elements
  /<input(?!.*from.*@ganger\/ui)/,
  /<button(?!.*from.*@ganger\/ui)/,
  /<select(?!.*from.*@ganger\/ui)/,
  /<textarea(?!.*from.*@ganger\/ui)/
];

function auditUICompliance() {
  const files = glob.sync('src/**/*.{ts,tsx}', { cwd: process.cwd() });
  let violations = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    PROHIBITED_UI_PATTERNS.forEach(pattern => {
      if (pattern.test(content)) {
        console.error(`❌ ${file}: Custom UI component detected. Use @ganger/ui exclusively.`);
        violations++;
      }
    });
  });
  
  if (violations > 0) {
    console.error(`\n❌ ${violations} UI compliance violations detected`);
    process.exit(1);
  }
  
  console.log('✅ UI component compliance verified');
}

auditUICompliance();
```

**Client Directive Audit Script:**
```javascript
// scripts/audit-use-client-directive.js
const fs = require('fs');
const glob = require('glob');

const REACT_HOOKS = [
  'useState', 'useEffect', 'useCallback', 'useMemo',
  'useReducer', 'useContext', 'useRef', 'useLayoutEffect'
];

function auditUseClientDirective() {
  const files = glob.sync('src/**/*.{ts,tsx}', { cwd: process.cwd() });
  let violations = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check if file uses React hooks
    const usesHooks = REACT_HOOKS.some(hook => 
      content.includes(`${hook}(`)
    );
    
    if (usesHooks && !content.includes("'use client'")) {
      console.error(`❌ ${file}: Component uses React hooks but missing 'use client' directive`);
      violations++;
    }
  });
  
  if (violations > 0) {
    console.error(`\n❌ ${violations} 'use client' directive violations detected`);
    process.exit(1);
  }
  
  console.log('✅ All interactive components properly use \'use client\' directive');
}

auditUseClientDirective();
```

### **Build Verification Requirements**

**TypeScript Configuration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**ESLint Configuration (.eslintrc.json):**
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### **Continuous Integration Requirements**

**GitHub Actions Workflow (.github/workflows/frontend-quality.yml):**
```yaml
name: Frontend Quality Gates

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: TypeScript compilation check
      run: npm run type-check
      
    - name: ESLint check
      run: npm run lint
      
    - name: UI compliance audit
      run: npm run audit:ui-compliance
      
    - name: Client directive audit
      run: npm run audit:use-client-directive
      
    - name: Server imports audit
      run: npm run audit:server-imports
      
    - name: Performance budget audit
      run: npm run audit:performance-budget
      
    - name: Build verification
      run: npm run build
```

---

## 🧪 **Comprehensive Testing Strategy**

### **Testing Pyramid Implementation**

**Test Coverage Requirements:**
- **Unit Tests**: 90%+ coverage for all components
- **Integration Tests**: 80%+ coverage for user workflows
- **E2E Tests**: 100% coverage for critical paths
- **Accessibility Tests**: 100% WCAG 2.1 AA compliance

### **Unit Testing (Jest + React Testing Library)**

**Test Setup (jest.config.js):**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@ganger/(.*)$': '<rootDir>/../packages/$1/src'
  },
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

**Component Testing Best Practices:**
```typescript
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReviewCard } from './ReviewCard';
import { mockReview, mockApiResponse } from '../__mocks__/reviewData';

expect.extend(toHaveNoViolations);

// Mock API calls
jest.mock('@/api/reviews', () => ({
  generateResponse: jest.fn(),
  submitResponse: jest.fn()
}));

describe('ReviewCard Component', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('renders review information correctly', () => {
      render(<ReviewCard review={mockReview} onUpdate={jest.fn()} />);
      
      expect(screen.getByText(mockReview.reviewer_name)).toBeInTheDocument();
      expect(screen.getByText(mockReview.review_text)).toBeInTheDocument();
      
      // Test star rating display
      const stars = screen.getAllByRole('img', { name: /star/i });
      expect(stars).toHaveLength(5);
      
      // Test sentiment badge
      expect(screen.getByText(mockReview.sentiment_category)).toBeInTheDocument();
    });
    
    it('displays urgency indicator for urgent reviews', () => {
      const urgentReview = { ...mockReview, urgency_level: 'urgent' };
      render(<ReviewCard review={urgentReview} onUpdate={jest.fn()} />);
      
      expect(screen.getByText('Urgent')).toBeInTheDocument();
      expect(screen.getByRole('article')).toHaveClass('border-red-500');
    });
  });
  
  describe('Interactions', () => {
    it('generates AI response when button clicked', async () => {
      const mockOnUpdate = jest.fn();
      const mockGenerate = require('@/api/reviews').generateResponse;
      mockGenerate.mockResolvedValue(mockApiResponse);
      
      render(<ReviewCard review={mockReview} onUpdate={mockOnUpdate} />);
      
      const generateButton = screen.getByRole('button', { name: /generate ai response/i });
      await user.click(generateButton);
      
      expect(generateButton).toBeDisabled();
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith({ reviewId: mockReview.id });
      });
    });
    
    it('handles API errors gracefully', async () => {
      const mockGenerate = require('@/api/reviews').generateResponse;
      mockGenerate.mockRejectedValue(new Error('API Error'));
      
      render(<ReviewCard review={mockReview} onUpdate={jest.fn()} />);
      
      const generateButton = screen.getByRole('button', { name: /generate ai response/i });
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      const { container } = render(<ReviewCard review={mockReview} onUpdate={jest.fn()} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('supports keyboard navigation', async () => {
      render(<ReviewCard review={mockReview} onUpdate={jest.fn()} />);
      
      const card = screen.getByRole('article');
      card.focus();
      
      expect(card).toHaveFocus();
      expect(card).toHaveAttribute('tabIndex', '0');
      
      // Test keyboard activation
      await user.keyboard('{Enter}');
      // Verify appropriate action taken
    });
  });
  
  describe('Loading States', () => {
    it('shows loading spinner during API calls', async () => {
      const mockGenerate = require('@/api/reviews').generateResponse;
      mockGenerate.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(mockApiResponse), 100);
      }));
      
      render(<ReviewCard review={mockReview} onUpdate={jest.fn()} />);
      
      const generateButton = screen.getByRole('button', { name: /generate ai response/i });
      await user.click(generateButton);
      
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
      });
    });
  });
});
```

### **Integration Testing**

**User Workflow Testing:**
```typescript
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialsReviewsDashboard } from '@/components/SocialsReviewsDashboard';
import { AuthProvider } from '@ganger/auth/client';
import { mockUser, mockReviews, mockPosts } from '../__mocks__/testData';

// Mock API modules
jest.mock('@/api/reviews');
jest.mock('@/api/social');

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider initialUser={mockUser}>
      {component}
    </AuthProvider>
  );
};

describe('Socials & Reviews Dashboard Integration', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default API responses
    require('@/api/reviews').getReviews.mockResolvedValue({
      success: true,
      data: mockReviews
    });
    
    require('@/api/social').getHighPerformingPosts.mockResolvedValue({
      success: true,
      data: mockPosts
    });
  });
  
  describe('Review Management Workflow', () => {
    it('allows user to filter and respond to reviews', async () => {
      renderWithProviders(<SocialsReviewsDashboard />);
      
      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('Review Management')).toBeInTheDocument();
      });
      
      // Test filtering
      const locationFilter = screen.getByLabelText(/location/i);
      await user.selectOptions(locationFilter, 'ann_arbor');
      
      await waitFor(() => {
        expect(require('@/api/reviews').getReviews).toHaveBeenCalledWith(
          expect.objectContaining({ location: 'ann_arbor' })
        );
      });
      
      // Test review response generation
      const firstReview = screen.getAllByRole('article')[0];
      const generateButton = within(firstReview).getByRole('button', { 
        name: /generate ai response/i 
      });
      
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(require('@/api/reviews').generateResponse).toHaveBeenCalled();
      });
    });
  });
  
  describe('Social Media Monitoring Workflow', () => {
    it('allows user to adapt content for Ganger Dermatology', async () => {
      renderWithProviders(<SocialsReviewsDashboard />);
      
      // Switch to Social Monitoring tab
      const socialTab = screen.getByRole('tab', { name: /social monitoring/i });
      await user.click(socialTab);
      
      await waitFor(() => {
        expect(screen.getByText('High-Performing Posts')).toBeInTheDocument();
      });
      
      // Test "GD It" functionality
      const firstPost = screen.getAllByTestId('social-post-card')[0];
      const gdItButton = within(firstPost).getByRole('button', { name: /gd it/i });
      
      await user.click(gdItButton);
      
      // Verify adaptation modal opens
      await waitFor(() => {
        expect(screen.getByRole('dialog', { 
          name: /adapt content for ganger dermatology/i 
        })).toBeInTheDocument();
      });
    });
  });
  
  describe('Real-time Updates', () => {
    it('displays new review notifications', async () => {
      // Mock WebSocket connection
      const mockWebSocket = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn()
      };
      
      global.WebSocket = jest.fn(() => mockWebSocket);
      
      renderWithProviders(<SocialsReviewsDashboard />);
      
      // Simulate new review notification
      const newReviewEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'new_review',
          data: mockReviews[0]
        })
      });
      
      // Trigger WebSocket message handler
      const messageHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1];
      messageHandler(newReviewEvent);
      
      await waitFor(() => {
        expect(screen.getByText(/1 new review/i)).toBeInTheDocument();
      });
    });
  });
});
```

### **End-to-End Testing (Playwright)**

**Critical User Journeys:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Socials & Reviews E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as authenticated user
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@gangerdermatology.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to Socials & Reviews dashboard
    await page.goto('/socials-reviews');
    await expect(page.locator('h1')).toContainText('Socials & Reviews');
  });
  
  test('complete review response workflow', async ({ page }) => {
    // Navigate to pending reviews
    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await page.click('[data-testid="refresh-button"]');
    
    // Wait for reviews to load
    await expect(page.locator('[data-testid="review-card"]').first()).toBeVisible();
    
    // Generate AI response
    await page.click('[data-testid="generate-response-button"]');
    
    // Wait for response modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Edit generated response
    await page.fill('[data-testid="response-textarea"]', 
      'Thank you for your feedback! We appreciate your business and look forward to serving you again.');
    
    // Submit response
    await page.click('[data-testid="submit-response-button"]');
    
    // Verify success notification
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify review status updated
    await expect(page.locator('[data-testid="review-status"]').first())
      .toContainText('published');
  });
  
  test('social media content adaptation workflow', async ({ page }) => {
    // Switch to Social Monitoring tab
    await page.click('[role="tab"][name="Social Monitoring"]');
    
    // Wait for posts to load
    await expect(page.locator('[data-testid="social-post-card"]').first()).toBeVisible();
    
    // Click "GD It" button
    await page.hover('[data-testid="social-post-card"]');
    await page.click('[data-testid="gd-it-button"]');
    
    // Wait for adaptation modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Adapt Content for Ganger Dermatology');
    
    // Wait for AI adaptation to generate
    await expect(page.locator('[data-testid="adapted-caption"]')).not.toBeEmpty();
    
    // Customize adaptation
    await page.fill('[data-testid="call-to-action-input"]', 
      'Schedule your dermatology consultation today!');
    
    // Save to content library
    await page.click('[data-testid="save-to-library-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });
  
  test('performance benchmarks', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to dashboard
    await page.goto('/socials-reviews');
    
    // Wait for critical content to load
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Verify performance budget
    expect(loadTime).toBeLessThan(2000); // 2 second budget
    
    // Check Core Web Vitals
    const fcp = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
            }
          }
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    expect(fcp).toBeLessThan(1200); // FCP budget: 1.2s
  });
});
```

### **Performance Testing**

**Bundle Size Testing:**
```typescript
import { analyzeBundle } from '@/scripts/bundle-analyzer';

describe('Bundle Size Tests', () => {
  it('meets performance budgets', async () => {
    const bundleStats = await analyzeBundle();
    
    expect(bundleStats.mainBundle).toBeLessThan(200000); // 200KB
    expect(bundleStats.vendorBundle).toBeLessThan(120000); // 120KB
    expect(bundleStats.cssBundle).toBeLessThan(30000); // 30KB
  });
});
```

### **Test Data Management**

**Mock Data Factory:**
```typescript
// __mocks__/testData.ts
import { GoogleBusinessReview, SocialMediaPost, User } from '@ganger/types';

export const createMockReview = (overrides?: Partial<GoogleBusinessReview>): GoogleBusinessReview => ({
  id: 'review-1',
  reviewer_name: 'John Doe',
  rating: 5,
  review_text: 'Excellent service and professional staff!',
  review_date: '2024-01-15T10:30:00Z',
  sentiment_category: 'positive',
  urgency_level: 'normal',
  response_status: 'pending',
  key_topics: ['service', 'staff'],
  ...overrides
});

export const createMockPost = (overrides?: Partial<SocialMediaPost>): SocialMediaPost => ({
  id: 'post-1',
  platform: 'instagram',
  caption: 'Amazing skincare transformation! ✨',
  media_urls: ['https://example.com/image.jpg'],
  likes_count: 1250,
  comments_count: 89,
  shares_count: 34,
  is_high_performing: true,
  relevance_score: 0.89,
  content_topics: ['skincare', 'transformation'],
  hashtags: ['skincare', 'dermatology', 'transformation'],
  ...overrides
});

export const mockUser: User = {
  id: 'user-1',
  email: 'test@gangerdermatology.com',
  name: 'Test User',
  role: 'manager'
};

export const mockReviews = [
  createMockReview(),
  createMockReview({ id: 'review-2', rating: 3, sentiment_category: 'neutral' }),
  createMockReview({ id: 'review-3', rating: 1, sentiment_category: 'negative', urgency_level: 'urgent' })
];

export const mockPosts = [
  createMockPost(),
  createMockPost({ id: 'post-2', platform: 'facebook', is_high_performing: false }),
  createMockPost({ id: 'post-3', platform: 'tiktok', likes_count: 5600 })
];
```

---

## ♿ **Accessibility Compliance (WCAG 2.1 AA)**

### **Mandatory Accessibility Standards**

**ZERO TOLERANCE for accessibility violations** - All components must meet WCAG 2.1 AA standards.

**Keyboard Navigation Requirements:**
```typescript
'use client'

import { useCallback, useRef } from 'react';
import { Button, Card } from '@ganger/ui';

// ✅ REQUIRED: Full keyboard navigation support
export function AccessibleReviewCard({ review }: { review: GoogleBusinessReview }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ': // Space key
        e.preventDefault();
        // Activate primary action
        break;
      case 'Escape':
        // Close modal or cancel action
        break;
      case 'Tab':
        // Allow default tab behavior
        break;
    }
  }, []);
  
  return (
    <Card 
      ref={cardRef}
      tabIndex={0}
      role="article"
      aria-label={`Review by ${review.reviewer_name}, ${review.rating} stars`}
      onKeyDown={handleKeyDown}
      className="focus:ring-2 focus:ring-primary-500 focus:outline-none"
    >
      <div className="p-6">
        {/* Review content with proper semantic structure */}
        <header className="mb-4">
          <h3 className="text-lg font-semibold" id={`review-${review.id}-title`}>
            {review.reviewer_name || 'Anonymous Reviewer'}
          </h3>
          <div 
            role="img" 
            aria-label={`${review.rating} out of 5 stars`}
            className="flex mt-1"
          >
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-lg ${
                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
          </div>
        </header>
        
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {review.review_text}
          </p>
        </div>
        
        <footer className="flex justify-between items-center">
          <time 
            dateTime={review.review_date}
            className="text-sm text-gray-500"
          >
            {formatDate(review.review_date)}
          </time>
          
          <div className="flex space-x-2" role="group" aria-label="Review actions">
            <Button
              size="sm"
              variant="primary"
              aria-describedby={`review-${review.id}-title`}
            >
              Generate Response
            </Button>
          </div>
        </footer>
      </div>
    </Card>
  );
}
```

**Screen Reader Support:**
```typescript
'use client'

import { useState, useCallback } from 'react';
import { Button, Modal, FormField, TextArea } from '@ganger/ui';

export function AccessibleResponseModal({ 
  isOpen, 
  onClose, 
  review 
}: {
  isOpen: boolean;
  onClose: () => void;
  review: GoogleBusinessReview;
}) {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Submit logic here
      // Announce success to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.textContent = 'Response submitted successfully';
      announcement.className = 'sr-only';
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
      
      onClose();
    } catch (error) {
      // Announce error to screen readers
      const errorAnnouncement = document.createElement('div');
      errorAnnouncement.setAttribute('aria-live', 'assertive');
      errorAnnouncement.setAttribute('aria-atomic', 'true');
      errorAnnouncement.textContent = 'Failed to submit response. Please try again.';
      errorAnnouncement.className = 'sr-only';
      document.body.appendChild(errorAnnouncement);
      
      setTimeout(() => {
        document.body.removeChild(errorAnnouncement);
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  }, [response, onClose]);
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      aria-labelledby="response-modal-title"
      aria-describedby="response-modal-description"
    >
      <div className="p-6">
        <h2 id="response-modal-title" className="text-xl font-semibold mb-2">
          Respond to Review
        </h2>
        
        <p id="response-modal-description" className="text-gray-600 mb-6">
          Craft a professional response to {review.reviewer_name}'s {review.rating}-star review.
        </p>
        
        <form onSubmit={handleSubmit}>
          <FormField 
            label="Response"
            required
            error={!response.trim() && 'Response is required'}
          >
            <TextArea
              value={response}
              onChange={setResponse}
              placeholder="Enter your professional response..."
              rows={4}
              aria-describedby="response-help"
              required
            />
            <div id="response-help" className="text-sm text-gray-500 mt-1">
              Keep your response professional and address the customer's concerns.
            </div>
          </FormField>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!response.trim() || isSubmitting}
              aria-describedby={isSubmitting ? 'submitting-status' : undefined}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Button>
          </div>
          
          {isSubmitting && (
            <div id="submitting-status" className="sr-only" aria-live="polite">
              Submitting your response, please wait.
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}
```

**Color Contrast & Visual Accessibility:**
```typescript
// Accessibility-compliant color system
const ACCESSIBLE_COLORS = {
  // High contrast ratios (4.5:1 minimum)
  text: {
    primary: 'text-gray-900',      // Contrast ratio: 21:1
    secondary: 'text-gray-700',    // Contrast ratio: 12.63:1
    muted: 'text-gray-600',        // Contrast ratio: 7.23:1
  },
  
  // Status colors with sufficient contrast
  status: {
    success: 'text-green-800 bg-green-100',     // Contrast ratio: 5.37:1
    warning: 'text-amber-800 bg-amber-100',     // Contrast ratio: 5.74:1
    error: 'text-red-800 bg-red-100',           // Contrast ratio: 5.36:1
    info: 'text-blue-800 bg-blue-100',          // Contrast ratio: 5.14:1
  },
  
  // Focus indicators
  focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none'
};

// Accessible badge component
export function AccessibleBadge({ 
  variant, 
  children, 
  ...props 
}: { 
  variant: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}) {
  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${ACCESSIBLE_COLORS.status[variant]}
        ${ACCESSIBLE_COLORS.focus}
      `}
      role="status"
      aria-label={`Status: ${children}`}
      {...props}
    >
      {children}
    </span>
  );
}
```

**Alternative Text and Descriptions:**
```typescript
'use client'

import Image from 'next/image';

export function AccessibleSocialPostImage({ 
  post, 
  className 
}: { 
  post: SocialMediaPost;
  className?: string;
}) {
  // Generate meaningful alt text
  const generateAltText = (post: SocialMediaPost) => {
    const platform = post.platform;
    const topics = post.content_topics?.slice(0, 2).join(' and ') || 'social media';
    const engagement = `${post.likes_count} likes`;
    
    return `${platform} post about ${topics} with ${engagement}`;
  };
  
  if (!post.media_urls?.length) {
    return null;
  }
  
  return (
    <figure className={className}>
      <Image
        src={post.media_urls[0]}
        alt={generateAltText(post)}
        width={400}
        height={300}
        className="rounded-lg object-cover"
        loading="lazy"
      />
      
      {post.caption && (
        <figcaption className="mt-2 text-sm text-gray-600">
          <span className="sr-only">Post caption: </span>
          {post.caption.slice(0, 100)}
          {post.caption.length > 100 && '...'}
        </figcaption>
      )}
    </figure>
  );
}
```

### **Accessibility Testing Requirements**

**Automated Testing:**
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { ReviewCard } from './ReviewCard';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('meets WCAG 2.1 AA standards', async () => {
    const mockReview = {
      id: '1',
      reviewer_name: 'John Doe',
      rating: 5,
      review_text: 'Great service!',
      review_date: '2024-01-01'
    };
    
    const { container } = render(<ReviewCard review={mockReview} />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
  
  it('supports keyboard navigation', () => {
    const { getByRole } = render(<ReviewCard review={mockReview} />);
    const card = getByRole('article');
    
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveClass('focus:ring-2');
  });
  
  it('provides proper ARIA labels', () => {
    const { getByLabelText } = render(<ReviewCard review={mockReview} />);
    
    expect(getByLabelText(/Review by John Doe, 5 stars/)).toBeInTheDocument();
  });
});
```

**Manual Testing Checklist:**
- [ ] All interactive elements accessible via keyboard
- [ ] Screen reader announces all important information
- [ ] Color contrast ratios meet WCAG AA standards (4.5:1 minimum)
- [ ] Focus indicators clearly visible
- [ ] Alternative text provided for all images
- [ ] Form labels properly associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Loading states announced to screen readers

---

## 📈 Success Criteria

### **Frontend Launch Criteria**

**Quality Gates (MANDATORY):**
- [ ] TypeScript compilation: 0 errors
- [ ] Component library compliance: 100% @ganger/ui usage
- [ ] Client-server boundaries: No server imports in client code
- [ ] Performance budgets: All limits met
- [ ] Accessibility compliance: WCAG 2.1 AA certified
- [ ] Build verification: Production build succeeds

**Functional Requirements:**
- [ ] Dashboard loads and displays all tabs correctly
- [ ] Review cards render with proper sentiment indicators  
- [ ] "GD It" button functionality works for social posts
- [ ] Real-time notifications appear for new reviews/posts
- [ ] Content adaptation modal generates and displays adaptations
- [ ] All forms validate input and display errors appropriately
- [ ] Mobile responsive design works on all screen sizes
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen readers announce all important information

**Testing Requirements:**
- [ ] Unit test coverage: >90%
- [ ] Integration test coverage: >80%
- [ ] E2E test coverage: 100% critical paths
- [ ] Accessibility test coverage: 100% components
- [ ] Performance tests: All budgets verified

### **Frontend Success Metrics**

**Performance Benchmarks:**
- Dashboard loads in <1.2 seconds (FCP)
- Largest Contentful Paint: <2.0 seconds
- Cumulative Layout Shift: <0.1
- Real-time updates appear within 3 seconds
- "GD It" adaptation completes in <10 seconds
- All interactive elements respond within 100ms

**Quality Metrics:**
- 100% accessibility compliance (WCAG 2.1 AA)
- Zero client-side JavaScript errors in production
- 90%+ unit test coverage maintained
- 100% of components use @ganger/ui exclusively
- 100% proper 'use client' directive usage
- Bundle size within performance budgets

**User Experience Metrics:**
- Task completion rate: >95%
- Time to complete review response: <2 minutes
- Time to adapt social content: <1 minute
- User satisfaction score: >4.5/5
- Mobile usability score: >90%

---

---

## 🛠️ **Development Environment Setup**

### **Required Development Tools**

```bash
# Node.js and Package Manager
node --version  # Must be 18+
npm --version   # Latest stable

# Development Dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-axe \
  @playwright/test \
  eslint \
  @typescript-eslint/eslint-plugin \
  prettier

# VS Code Extensions (Recommended)
# - ES7+ React/Redux/React-Native snippets
# - Tailwind CSS IntelliSense
# - TypeScript Importer
# - axe Accessibility Linter
```

### **Project Structure**

```
apps/socials-reviews/
├── src/
│   ├── components/
│   │   ├── dashboard/           # Dashboard components
│   │   ├── reviews/             # Review management
│   │   ├── social/              # Social monitoring  
│   │   ├── content/             # Content library
│   │   └── shared/              # Shared components
│   ├── hooks/
│   │   ├── useRealtimeSocials.ts
│   │   ├── usePerformanceMonitoring.ts
│   │   └── useAccessibility.ts
│   ├── pages/
│   │   ├── index.tsx            # Main dashboard
│   │   └── _app.tsx             # App wrapper
│   ├── styles/
│   │   └── globals.css
│   └── utils/
│       └── api.ts               # API client functions
├── __tests__/
│   ├── components/          # Component tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
├── scripts/
│   ├── audit-ui-compliance.js
│   ├── audit-performance-budget.js
│   └── audit-accessibility.js
└── next.config.js          # Next.js configuration
```

### **Development Commands**

```bash
# Development
npm run dev                    # Start development server
npm run type-check            # TypeScript compilation check
npm run lint                  # ESLint check
npm run test                  # Run unit tests
npm run test:watch            # Run tests in watch mode

# Quality Gates
npm run audit:ui-compliance   # Check @ganger/ui usage
npm run audit:performance     # Check performance budgets
npm run audit:accessibility   # Check WCAG compliance
npm run pre-commit            # Run all quality gates

# Testing
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests only
npm run test:e2e              # End-to-end tests
npm run test:accessibility    # Accessibility tests

# Build and Deploy
npm run build                 # Production build
npm run start                 # Start production server
npm run analyze               # Bundle analysis
```

---

*This comprehensive frontend PRD provides complete guidance for Terminal 1 to build all React components and user interfaces for the Socials & Reviews Management application, ensuring compliance with all Ganger Platform standards, quality gates, and architectural requirements.*