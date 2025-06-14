# PRD: Fix L10 App Deployment & Import Ninety.io Data
**Project**: EOS L10 App Deployment Fix & Data Migration  
**Version**: 1.0  
**Date**: January 10, 2025  
**Author**: Anand Ganger  
**Status**: Critical Fix Required  

---

## 🚨 **CRITICAL ISSUE IDENTIFIED**

### **Problem Statement**
The L10 route at `https://staff.gangerdermatology.com/l10` is serving **static mock HTML** instead of the actual Next.js EOS-L10 application. Users see sample data and non-functional pop-ups instead of their real ninety.io data.

### **Root Cause Analysis**
1. **Mock Deployment**: Staff router serves static HTML from `getEOSL10App()` function
2. **Real App Not Deployed**: The actual Next.js EOS-L10 app (`apps/eos-l10`) builds successfully but isn't deployed
3. **Missing Data Connection**: No integration with user's existing ninety.io account
4. **Routing Misconfiguration**: L10 route points to mock instead of real application

---

## 📋 **IMMEDIATE FIXES REQUIRED**

### **Phase 1: Fix Deployment Architecture (Priority 1)**

#### **Option A: Dedicated Subdomain (Recommended)**
```bash
# Deploy EOS-L10 to its own subdomain
Target: https://l10.gangerdermatology.com
Benefits: 
- Full Next.js functionality with SSR/SSG
- Independent deployment pipeline
- No routing conflicts with staff portal
- Better performance and caching
```

#### **Option B: Update Staff Router**
```bash
# Update staff router to proxy to real EOS-L10 deployment
Target: https://staff.gangerdermatology.com/l10 → proxy to real app
Benefits:
- Maintains single domain structure
- Preserves existing URLs
- Requires proxy configuration
```

### **Phase 2: Import Ninety.io Data (Priority 2)**

#### **Data Migration Strategy**
```typescript
interface NinetyioMigration {
  // Core EOS Data to Import:
  rocks: QuarterlyRock[];        // Quarterly goals and progress
  scorecard: ScorecardMetric[];  // Weekly/monthly metrics
  issues: Issue[];               // IDS (Identify, Discuss, Solve) items
  todos: ActionItem[];           // Action items and assignments
  meetings: MeetingHistory[];    // L10 meeting notes and outcomes
  vto: VisionTractionOrganizer; // Vision/Traction Organizer data
}
```

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Fix 1: Deploy Real EOS-L10 App**

#### **Cloudflare Pages Deployment**
```bash
# Create new Cloudflare Pages project for L10
Project Name: ganger-l10-production
Domain: l10.gangerdermatology.com
Build Command: cd apps/eos-l10 && npm run build
Output Directory: apps/eos-l10/.next
Framework: Next.js
```

#### **Wrangler Configuration Update**
```toml
# apps/eos-l10/wrangler.toml
name = "ganger-l10-production"
compatibility_date = "2024-01-01"
routes = [
  { pattern = "l10.gangerdermatology.com/*", zone_name = "gangerdermatology.com" }
]

[env.production]
name = "ganger-l10-production"
routes = [
  { pattern = "l10.gangerdermatology.com/*", zone_name = "gangerdermatology.com" }
]
```

#### **DNS Configuration**
```bash
# Add CNAME record in Cloudflare DNS
Type: CNAME
Name: l10
Content: ganger-l10-production.pages.dev
Proxy: Enabled
```

### **Fix 2: Remove Mock Implementation**

#### **Update Staff Router**
```javascript
// cloudflare-workers/staff-router.js
if (pathname === '/l10') {
  // Redirect to dedicated L10 subdomain
  return Response.redirect('https://l10.gangerdermatology.com', 301);
}

// Remove getEOSL10App() function entirely
```

### **Fix 3: Ninety.io Data Import**

#### **Ninety.io API Integration**
```typescript
// lib/ninety-import.ts
class NinetyioImporter {
  private apiKey: string;
  private baseUrl = 'https://app.ninety.io/api';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async importUserData(): Promise<NinetyioMigration> {
    // Import all EOS data from ninety.io account
    const [rocks, scorecard, issues, todos, meetings, vto] = await Promise.all([
      this.fetchRocks(),
      this.fetchScorecard(),
      this.fetchIssues(),
      this.fetchTodos(),
      this.fetchMeetings(),
      this.fetchVTO()
    ]);
    
    return { rocks, scorecard, issues, todos, meetings, vto };
  }
  
  private async fetchRocks(): Promise<QuarterlyRock[]> {
    // Fetch quarterly rocks/goals
    const response = await fetch(`${this.baseUrl}/rocks`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }
  
  // Additional fetch methods for each data type...
}
```

#### **Data Population Service**
```typescript
// services/data-migration.ts
class DataMigrationService {
  async migrateFromNinety(userId: string, ninetyData: NinetyioMigration) {
    // Populate Supabase with imported ninety.io data
    await Promise.all([
      this.populateRocks(userId, ninetyData.rocks),
      this.populateScorecard(userId, ninetyData.scorecard),
      this.populateIssues(userId, ninetyData.issues),
      this.populateTodos(userId, ninetyData.todos),
      this.populateMeetings(userId, ninetyData.meetings),
      this.populateVTO(userId, ninetyData.vto)
    ]);
  }
  
  private async populateRocks(userId: string, rocks: QuarterlyRock[]) {
    const { error } = await supabase
      .from('quarterly_rocks')
      .insert(rocks.map(rock => ({
        user_id: userId,
        title: rock.title,
        description: rock.description,
        owner: rock.owner,
        due_date: rock.dueDate,
        progress: rock.progress,
        status: rock.status,
        created_at: rock.createdAt,
        quarter: rock.quarter,
        year: rock.year
      })));
    
    if (error) throw error;
  }
  
  // Additional population methods...
}
```

### **Fix 4: Authentication Integration**

#### **Google OAuth Configuration**
```typescript
// lib/auth-eos.tsx
export const authConfig = {
  providers: [
    {
      name: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scope: 'openid email profile',
      domain: 'gangerdermatology.com' // Restrict to company domain
    }
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Verify user is from gangerdermatology.com domain
      return profile?.email?.endsWith('@gangerdermatology.com') ?? false;
    },
    async session({ session, token }) {
      // Add user role and team information
      session.user.role = await getUserRole(session.user.email);
      session.user.teams = await getUserTeams(session.user.email);
      return session;
    }
  }
};
```

---

## 📅 **IMPLEMENTATION TIMELINE**

### **Phase 1: Emergency Deployment Fix (Day 1)**
- [ ] **Hour 1-2**: Deploy EOS-L10 app to l10.gangerdermatology.com
- [ ] **Hour 3-4**: Configure DNS and SSL
- [ ] **Hour 5-6**: Update staff router redirect
- [ ] **Hour 7-8**: Test deployment and authentication

### **Phase 2: Data Import Setup (Day 2)**
- [ ] **Hour 1-4**: Get ninety.io API credentials and test connection
- [ ] **Hour 5-8**: Build data import service and test with sample data

### **Phase 3: Full Data Migration (Day 3)**
- [ ] **Hour 1-4**: Run complete data import from ninety.io
- [ ] **Hour 5-8**: Validate data integrity and test application functionality

### **Phase 4: User Acceptance Testing (Day 4)**
- [ ] **Hour 1-4**: User testing with real data
- [ ] **Hour 5-8**: Fix any issues and optimize performance

---

## 🔍 **DATA IMPORT REQUIREMENTS**

### **Ninety.io Account Access**
```bash
# Required Information:
Ninety.io Username: [USER_PROVIDED]
Ninety.io Password: [USER_PROVIDED]
API Key: [USER_PROVIDED] (if available)
Organization ID: [USER_PROVIDED]
Team IDs: [USER_PROVIDED]
```

### **Data Mapping Requirements**
```typescript
// Map ninety.io data to EOS-L10 schema
interface DataMappingConfig {
  rocks: {
    source: 'ninety.rocks',
    target: 'quarterly_rocks',
    mapping: {
      'ninety.title' → 'title',
      'ninety.description' → 'description',
      'ninety.assignee' → 'owner',
      'ninety.dueDate' → 'due_date',
      'ninety.completion' → 'progress'
    }
  },
  scorecard: {
    source: 'ninety.scorecard',
    target: 'scorecard_metrics',
    mapping: {
      'ninety.metric' → 'name',
      'ninety.target' → 'goal',
      'ninety.actual' → 'value',
      'ninety.period' → 'period',
      'ninety.status' → 'status'
    }
  }
  // Additional mappings for issues, todos, meetings, vto...
}
```

---

## ✅ **ACCEPTANCE CRITERIA**

### **Deployment Fix**
- [ ] L10 app accessible at https://l10.gangerdermatology.com
- [ ] All Next.js functionality working (routing, SSR, PWA)
- [ ] Google OAuth authentication working
- [ ] Mobile-responsive design functioning
- [ ] No mock data or non-functional pop-ups

### **Data Import**
- [ ] All ninety.io rocks imported with correct progress
- [ ] Scorecard metrics imported with historical data
- [ ] Issues (IDS) imported with correct priorities
- [ ] Todos imported with assignments and due dates
- [ ] Meeting history imported with notes and outcomes
- [ ] V/TO data imported with complete organizational structure

### **User Experience**
- [ ] Users can access their real EOS data immediately
- [ ] No data loss during migration
- [ ] Performance matches or exceeds ninety.io
- [ ] Mobile experience is superior to ninety.io
- [ ] Offline functionality works as designed

---

## 🚀 **IMMEDIATE NEXT STEPS**

### **Step 1: Deploy Real App**
```bash
cd /mnt/q/Projects/ganger-platform/apps/eos-l10
# Build and deploy to Cloudflare Pages
pnpm build
# Configure domain and SSL
```

### **Step 2: Get Ninety.io Access**
```bash
# User needs to provide:
1. Ninety.io login credentials
2. API access (if available)
3. Organization/team structure
4. Data export preferences
```

### **Step 3: Import Data**
```bash
# Run migration service
npm run migrate:ninety-to-supabase
# Validate data integrity
npm run validate:eos-data
```

---

## 💰 **COST & TIMELINE**

### **Implementation Cost**
- **Development Time**: 4 days (1 developer)
- **Infrastructure**: No additional costs (existing Cloudflare/Supabase)
- **Data Migration**: One-time process
- **Testing**: 1 day user acceptance testing

### **Ongoing Benefits**
- **No ninety.io subscription fees** ($500+/month savings)
- **Complete data ownership** and control
- **Enhanced mobile experience** vs ninety.io
- **Offline capabilities** not available in ninety.io
- **Custom integrations** with existing Ganger systems

---

**🎯 CRITICAL: This fixes a major user experience issue where L10 functionality is completely broken. Users expect to see their real ninety.io data, not mock pop-ups.**