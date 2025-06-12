---

## 📁 **Enhanced Data Sources (June 2025)**

### **Location-Specific Henry Schein Catalogs**
**Source**: `Q:\Projects\ganger-platform\PRDs\HenrySchein\`

#### **Barcode Reference PDFs**
- **Ann Arbor**: `barcodes-AA.pdf` - Complete product catalog with images and barcodes
- **Wixom**: `barcodes-WX.pdf` - Location-specific frequently ordered items
- **Plymouth**: `barcodes-PY.pdf` - Tailored product selection with visual references

**Benefits**:
- ✅ **Visual Product Verification**: Staff can verify products by image before scanning
- ✅ **Barcode Reference**: Quick lookup for damaged or missing barcodes
- ✅ **Location Optimization**: Only relevant products shown per location
- ✅ **Faster Training**: New staff can learn products visually

#### **Comprehensive Product Database**
- **All Locations Summary**: `ALL Items Purchased ALL Locations.xls`
- **Historical Purchasing Data**: Complete order history for intelligent reordering
- **Price Comparison Foundation**: Baseline for multi-vendor price analysis
- **Autoship Optimization**: Data for setting up automated reorder points

**Intelligence Features**:
- ✅ **Predictive Ordering**: Suggest reorder quantities based on usage patterns
- ✅ **Seasonal Adjustments**: Identify seasonal purchasing trends
- ✅ **Cost Optimization**: Compare historical prices for negotiation insights
- ✅ **Cross-Location Analysis**: Identify bulk purchasing opportunities

#### **Materials Safety Data Sheets (MSDS)**
- **Safety Database**: `MSDS.xls` - Complete hazardous materials reference
- **Emergency Access**: Quick lookup for chemical accidents or allergic reactions
- **Compliance Tracking**: Ensure all hazardous materials have current MSDS
- **Staff Safety**: First aid and emergency procedure access

**Safety Features**:
- ✅ **Emergency Lookup**: < 10 seconds access during incidents
- ✅ **Chemical Identification**: CAS numbers and hazard classifications
- ✅ **First Aid Instructions**: Immediate emergency response guidance
- ✅ **Compliance Assurance**: Regulatory requirement fulfillment

### **Future Multi-Vendor Integration**
**Planned Data Sources**:
- 🔄 **Amazon Business**: Historical purchasing data for price comparison
- 🔄 **Staples Business**: Office supply purchasing history
- 🔄 **Additional Vendors**: Expand price comparison ecosystem

**Expected Benefits**:
- 30-40% cost savings through vendor optimization
- Automated price alerts for better purchasing decisions
- Consolidated purchasing intelligence across all vendors

### **Slack Integration Workflow**
**Purchasing Channel Integration**: `#purchasing`

**Automated Order Process**:
1. **Inventory Completion** → Generate order summary
2. **Slack Notification** → Post to #purchasing channel with:
   - Location and date
   - Complete item list with quantities
   - Total estimated cost
   - Priority items flagged
   - Alternative vendor suggestions
3. **Buyer Action** → Purchasing team processes order
4. **Status Updates** → Order confirmations threaded in Slack

**Why Slack Integration**:
- ✅ **No Henry Schein API**: Direct integration not available
- ✅ **Streamlined Workflow**: Familiar purchasing team process
- ✅ **Audit Trail**: Complete order history in Slack threads
- ✅ **Team Collaboration**: Easy communication about orders

---

## 🎆 **Business Value Enhancement**

### **Operational Efficiency Gains**
- **75% faster inventory counting** through location-specific catalogs
- **90% reduction in product lookup time** with visual verification
- **60% faster order processing** through Slack automation
- **100% MSDS compliance** with integrated safety database

### **Cost Savings Opportunities**
- **Price Comparison Intelligence**: Multi-vendor cost analysis
- **Bulk Purchasing Optimization**: Cross-location volume discounts
- **Automated Reorder Points**: Prevent stockouts and overstocking
- **Historical Trend Analysis**: Seasonal purchasing optimization

### **Safety and Compliance**
- **Emergency Response**: Instant MSDS access during incidents
- **Regulatory Compliance**: Complete hazardous materials tracking
- **Staff Safety Training**: Visual product identification reduces errors
- **Audit Trail**: Complete purchasing and safety documentation

# Inventory Scan & Order Assistant - Ganger Platform Standard
*Mobile-first barcode scanning solution for inventory management*

## 📋 Document Information
- **Application Name**: Inventory Scan & Order Assistant (SPA)
- **Priority**: Medium
- **Development Timeline**: 3-4 weeks
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations
- **Integration Requirements**: Google Sheets API, Henry Schein API, Barcode scanning libraries

---

## 🎯 Product Overview

### **Purpose Statement**
Enable inventory counters to scan barcodes with mobile devices, match products to comprehensive location-specific catalogs with images and pricing, input quantities, and streamline ordering through Slack integration with Henry Schein workflow optimization.

### **Enhanced Features (June 2025)**
✅ **Location-Specific Product Catalogs**: Pre-loaded catalogs for Ann Arbor, Wixom, and Plymouth based on historical purchasing data
✅ **Visual Product Recognition**: Product images and barcodes from Henry Schein for easier identification
✅ **MSDS Integration**: Complete Materials Safety Data Sheet database for hazardous chemical safety
✅ **Proactive Ordering Intelligence**: Historical purchasing analysis for autoship and price comparison opportunities
✅ **Slack Integration**: Automated order summaries posted to #purchasing channel for buyer processing
✅ **Multi-Vendor Intelligence**: Foundation for Amazon and Staples historical data integration

### **Target Users**
- **Primary**: Inventory Staff with mobile scanning responsibilities
- **Secondary**: Practice Managers overseeing inventory processes and safety compliance
- **Tertiary**: Purchasing team receiving automated order notifications via Slack
- **Safety Officers**: Staff needing quick access to MSDS information during emergencies

### **Success Metrics**
- 75% reduction in inventory counting time (enhanced from location-specific catalogs)
- 98%+ barcode recognition accuracy (improved with visual product matching)
- 100% elimination of manual transcription errors
- < 15 seconds to identify and verify products (enhanced with images)
- 90% reduction in product lookup time through pre-loaded location catalogs
- < 30 seconds to generate Slack order summaries
- 100% MSDS availability for hazardous materials within 10 seconds

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard)**
```yaml
Frontend: Next.js 14+ with TypeScript
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers (with static asset support)
Styling: Tailwind CSS + Ganger Design System
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
```

### **Required Shared Packages**
```typescript
import { Button, Card, DataTable, FormField, LoadingSpinner, Camera } from '@ganger/ui';
import { useAuth, withAuth, requireRole } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { GoogleSheetsClient, BarcodeScanner, SlackClient } from '@ganger/integrations';
import { analytics, notifications, fileUpload } from '@ganger/utils';
```

### **App-Specific Technology**
- **PWA with Camera Access**: Service worker for offline scanning capability
- **Barcode Libraries**: html5-qrcode, @zxing/library for multi-format scanning
- **Location-Specific Catalogs**: Pre-loaded product databases with images from Henry Schein
- **MSDS Database**: Comprehensive Materials Safety Data Sheet integration
- **Slack Integration**: @ganger/integrations SlackClient for automated purchasing notifications
- **Visual Product Matching**: Product images and visual verification system
- **Historical Analytics**: Multi-vendor purchasing history analysis (Henry Schein, Amazon, Staples)
- **Offline Storage**: IndexedDB for offline scan storage and sync

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'inventory_counter';

interface InventoryPermissions {
  scan: UserRole[];
  export: UserRole[];
  admin: UserRole[];
  viewAllSessions: UserRole[];
}

// Location-based access control
interface LocationAccess {
  locationId: string;
  permissions: string[];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Location-Based Access**: Users can scan inventory for assigned locations
- **Session Isolation**: Users can only access their own scanning sessions
- **Manager Override**: Managers can view all sessions across locations

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
file_uploads, document_storage
```

### **App-Specific Tables**
```sql
-- Inventory scanning sessions
CREATE TABLE inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  session_name TEXT NOT NULL,
  location_id UUID REFERENCES locations(id) NOT NULL,
  session_type TEXT NOT NULL, -- 'on_hand', 'needed', 'full_count'
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'exported'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  exported_at TIMESTAMPTZ,
  google_sheet_id TEXT,
  google_sheet_url TEXT,
  total_items_scanned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual scanned items
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  product_name TEXT,
  product_description TEXT,
  henry_schein_sku TEXT,
  henry_schein_price DECIMAL(10,2),
  manufacturer TEXT,
  category TEXT,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  total_value DECIMAL(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,
  location_in_facility TEXT, -- Shelf, room, cabinet location
  scan_timestamp TIMESTAMPTZ DEFAULT NOW(),
  manually_entered BOOLEAN DEFAULT FALSE,
  verified_by_user BOOLEAN DEFAULT FALSE,
  notes TEXT,
  image_url TEXT, -- Optional product photo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced local product database with location-specific catalogs
CREATE TABLE products_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL,
  henry_schein_sku TEXT,
  product_name TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,
  category TEXT,
  unit_cost DECIMAL(10,2),
  unit_size TEXT,
  package_quantity INTEGER,
  product_image_url TEXT, -- Henry Schein product images
  barcode_image_url TEXT, -- Barcode reference images
  
  -- Location-specific data
  ann_arbor_last_ordered DATE,
  ann_arbor_frequency INTEGER DEFAULT 0, -- Orders per year
  ann_arbor_avg_quantity INTEGER DEFAULT 0,
  wixom_last_ordered DATE,
  wixom_frequency INTEGER DEFAULT 0,
  wixom_avg_quantity INTEGER DEFAULT 0,
  plymouth_last_ordered DATE,
  plymouth_frequency INTEGER DEFAULT 0,
  plymouth_avg_quantity INTEGER DEFAULT 0,
  
  -- Purchasing intelligence
  preferred_vendor TEXT DEFAULT 'henry_schein',
  amazon_available BOOLEAN DEFAULT FALSE,
  amazon_price DECIMAL(10,2),
  amazon_sku TEXT,
  staples_available BOOLEAN DEFAULT FALSE,
  staples_price DECIMAL(10,2),
  staples_sku TEXT,
  
  -- Metadata
  is_hazardous BOOLEAN DEFAULT FALSE,
  msds_required BOOLEAN DEFAULT FALSE,
  last_updated_from_api TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Create composite index for barcode + location queries
  UNIQUE(barcode, henry_schein_sku)
);

-- Materials Safety Data Sheets database
CREATE TABLE msds_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  chemical_name TEXT,
  cas_number TEXT, -- Chemical Abstracts Service number
  msds_url TEXT NOT NULL, -- Link to MSDS document
  msds_file_path TEXT, -- Local file storage path
  hazard_classification TEXT[], -- Array of hazard types
  safety_precautions TEXT,
  emergency_procedures TEXT,
  first_aid_instructions TEXT,
  
  -- Product associations
  henry_schein_skus TEXT[], -- Array of related SKUs
  barcodes TEXT[], -- Array of related barcodes
  
  -- Document metadata
  msds_date DATE,
  revision_number TEXT,
  language TEXT DEFAULT 'EN',
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order management and Slack integration
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES inventory_sessions(id),
  location_id UUID REFERENCES locations(id) NOT NULL,
  order_name TEXT NOT NULL,
  vendor TEXT NOT NULL DEFAULT 'henry_schein',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent_to_slack', 'ordered', 'received', 'cancelled')),
  
  -- Order details
  total_items INTEGER DEFAULT 0,
  estimated_total DECIMAL(12,2) DEFAULT 0,
  actual_total DECIMAL(12,2),
  
  -- Slack integration
  slack_message_ts TEXT, -- Slack message timestamp for thread updates
  slack_channel TEXT DEFAULT '#purchasing',
  slack_sent_at TIMESTAMPTZ,
  slack_sent_by UUID REFERENCES users(id),
  
  -- Order processing
  ordered_by TEXT,
  ordered_at TIMESTAMPTZ,
  henry_schein_order_number TEXT,
  tracking_number TEXT,
  expected_delivery DATE,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  
  -- Product details
  barcode TEXT NOT NULL,
  henry_schein_sku TEXT,
  product_name TEXT NOT NULL,
  manufacturer TEXT,
  
  -- Ordering details
  quantity_needed INTEGER NOT NULL,
  quantity_ordered INTEGER,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity_ordered * COALESCE(unit_cost, 0)) STORED,
  
  -- Alternative vendors
  alternative_vendor TEXT,
  alternative_price DECIMAL(10,2),
  price_difference DECIMAL(10,2), -- Savings/cost difference from alternatives
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical purchasing data for intelligence
CREATE TABLE purchasing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  vendor TEXT NOT NULL,
  
  -- Product identification
  vendor_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  barcode TEXT,
  manufacturer TEXT,
  category TEXT,
  
  -- Purchase details
  quantity_ordered INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  
  -- Order context
  order_number TEXT,
  invoice_number TEXT,
  
  -- Data source tracking
  data_source TEXT DEFAULT 'manual', -- 'henry_schein', 'amazon', 'staples', 'manual'
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  imported_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product matching suggestions for unrecognized barcodes
CREATE TABLE unmatched_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL,
  user_suggested_name TEXT,
  user_suggested_sku TEXT,
  suggested_henry_schein_match TEXT,
  match_confidence DECIMAL(3,2), -- 0.00-1.00 confidence score
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  scan_count INTEGER DEFAULT 1, -- How many times this was scanned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location-specific inventory settings
CREATE TABLE location_inventory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) UNIQUE,
  default_session_type TEXT DEFAULT 'on_hand',
  auto_export_enabled BOOLEAN DEFAULT FALSE,
  google_drive_folder_id TEXT,
  preferred_sheet_template TEXT,
  barcode_duplicate_handling TEXT DEFAULT 'prompt', -- 'prompt', 'update', 'skip'
  require_quantity_verification BOOLEAN DEFAULT TRUE,
  enable_location_tracking BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scanning session analytics
CREATE TABLE session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  total_scan_time_seconds INTEGER,
  average_scan_time_seconds DECIMAL(6,2),
  successful_scans INTEGER DEFAULT 0,
  failed_scans INTEGER DEFAULT 0,
  manual_entries INTEGER DEFAULT 0,
  unique_products_scanned INTEGER DEFAULT 0,
  total_estimated_value DECIMAL(12,2),
  efficiency_score DECIMAL(5,2), -- Calculated efficiency metric
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_inventory_sessions_user ON inventory_sessions(user_id);
CREATE INDEX idx_inventory_sessions_location ON inventory_sessions(location_id);
CREATE INDEX idx_inventory_sessions_status ON inventory_sessions(status);
CREATE INDEX idx_inventory_items_session ON inventory_items(session_id);
CREATE INDEX idx_inventory_items_barcode ON inventory_items(barcode);
CREATE INDEX idx_products_cache_barcode ON products_cache(barcode);
CREATE INDEX idx_products_cache_sku ON products_cache(henry_schein_sku);
CREATE INDEX idx_unmatched_products_barcode ON unmatched_products(barcode);
CREATE INDEX idx_unmatched_products_status ON unmatched_products(status);

-- Row Level Security policies
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_inventory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- Users can access their own sessions and items
CREATE POLICY "Users can access own sessions" ON inventory_sessions
  FOR ALL USING (
    user_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Users can access items from own sessions" ON inventory_items
  FOR ALL USING (
    session_id IN (
      SELECT id FROM inventory_sessions 
      WHERE user_id = auth.uid()
    )
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

-- Products cache is readable by all authenticated users
CREATE POLICY "Authenticated users can read products cache" ON products_cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- Managers can manage unmatched products
CREATE POLICY "Managers can resolve unmatched products" ON unmatched_products
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );
```

### **Data Relationships**
- **Hierarchical**: Locations → Sessions → Items
- **User-Centric**: User → Multiple Active Sessions
- **Product Matching**: Barcode → Product Cache → Henry Schein SKU
- **Analytics**: Session → Performance Metrics → Efficiency Tracking

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
// CRUD operations follow standard patterns
GET    /api/sessions                     // List user's scanning sessions
POST   /api/sessions                     // Create new scanning session
GET    /api/sessions/[id]                // Get session details
PUT    /api/sessions/[id]                // Update session
POST   /api/items                        // Add scanned item to session
GET    /api/items/[barcode]              // Look up product by barcode

// Real-time subscriptions
WS     /api/sessions/[id]/subscribe      // Live session updates
```

### **App-Specific Endpoints**
```typescript
// Enhanced inventory functionality
POST   /api/inventory/scan               // Process barcode scan with visual verification
GET    /api/inventory/products/lookup    // Location-specific product catalog lookup
GET    /api/inventory/products/image     // Get product image by barcode/SKU
POST   /api/inventory/export/sheets      // Export to Google Sheets
POST   /api/inventory/suggestions        // Submit product suggestions
GET    /api/inventory/analytics          // Session performance analytics
POST   /api/inventory/bulk-update        // Bulk quantity updates

// MSDS safety integration
GET    /api/inventory/msds/search        // Search MSDS by product name/chemical
GET    /api/inventory/msds/[id]          // Get specific MSDS document
POST   /api/inventory/msds/emergency     // Quick MSDS lookup for emergencies
GET    /api/inventory/hazardous          // List all hazardous materials by location

// Purchasing and ordering
POST   /api/orders/create               // Create purchase order from inventory session
POST   /api/orders/slack                // Send order summary to Slack #purchasing
GET    /api/orders/[id]                 // Get order details
PUT    /api/orders/[id]/status          // Update order status
GET    /api/orders/history              // Order history by location

// Price comparison and intelligence
GET    /api/pricing/compare             // Compare prices across vendors
GET    /api/pricing/alternatives        // Get alternative vendor options
POST   /api/pricing/alert               // Set up price alert for products
GET    /api/analytics/purchasing        // Historical purchasing analytics

// Location-specific catalogs
GET    /api/catalog/[location]          // Get location-specific product catalog
GET    /api/catalog/[location]/popular  // Most ordered items by location
GET    /api/catalog/[location]/reorder  // Suggested reorder items
POST   /api/catalog/sync                // Sync with Henry Schein data
```

### **External Integrations**
- **Slack API**: Automated order summaries posted to #purchasing channel via @ganger/integrations
- **Henry Schein Product Data**: Location-specific catalogs with product images and barcodes
- **Google Sheets API**: Enhanced inventory export with location-specific templates
- **Camera APIs**: Web-based barcode scanning with visual product verification
- **MSDS Database**: Materials Safety Data Sheet integration for hazardous materials
- **Multi-Vendor Intelligence**: Foundation for Amazon and Staples pricing integration

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System with inventory-specific colors
colors: {
  primary: 'blue-600',      // Standard interface
  secondary: 'green-600',   // Successful scans
  accent: 'orange-600',     // Inventory alerts
  neutral: 'slate-600',     // Text and borders
  warning: 'amber-600',     // Missing items
  danger: 'red-600'         // Scan errors
}

// Inventory-specific color coding
inventoryColors: {
  scanned: 'green-500',     // Successfully scanned items
  pending: 'blue-500',      // Items pending verification
  missing: 'amber-500',     // Missing or unmatched items
  error: 'red-500'          // Scan failures
}
```

### **Component Usage**
```typescript
// Use shared components with inventory customization
import {
  CameraView, BarcodeScanner, ProductCard, QuantityInput,
  SessionHeader, ScanProgress, ExportButton, ProductGrid,
  BarcodeLookup, ManualEntry, SessionSummary
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **Touch-First Design**: Large buttons optimized for handheld scanning
- **Camera Integration**: Full-screen camera view with barcode detection overlay
- **Offline Indicators**: Clear visual feedback for offline mode
- **Quick Actions**: One-tap quantity adjustments and product verification
- **Progress Tracking**: Real-time session completion progress

---

## 📱 User Experience

### **User Workflows**
1. **Enhanced Session Creation**: Start inventory session with location-specific catalog pre-loaded (15 seconds)
2. **Visual Barcode Scanning**: Scan → visual product verification with image → quantity entry (5-8 seconds per item)
3. **MSDS Safety Lookup**: Quick safety data access for hazardous materials (< 10 seconds)
4. **Smart Product Suggestions**: AI-powered reorder suggestions based on historical data (real-time)
5. **Slack Order Creation**: Generate and send order summary to #purchasing channel (20 seconds)
6. **Price Comparison**: Compare vendor options for cost optimization (15 seconds)
7. **Session Analytics**: Real-time efficiency tracking and historical comparison (continuous)

### **Performance Requirements**
- **Visual Product Recognition**: < 1 second from barcode scan to product image display
- **Location Catalog Loading**: < 3 seconds to load location-specific product database
- **MSDS Emergency Lookup**: < 5 seconds for hazardous material safety data
- **Slack Integration**: < 15 seconds to post order summary to #purchasing channel
- **Price Comparison**: < 3 seconds to display vendor alternatives
- **Offline Capability**: 1000+ scanned items stored locally with location catalog
- **Sync Performance**: < 45 seconds to upload completed session with order generation

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Accessible for all inventory staff
- **Voice Commands**: Voice quantity entry for hands-free operation
- **High Contrast**: Clear visibility in warehouse lighting conditions
- **Touch Targets**: Minimum 44px buttons for mobile scanning

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
// Inventory-specific test coverage
Unit Tests: 85%+ coverage for scanning logic
Integration Tests: Google Sheets API, Henry Schein lookup
E2E Tests: Complete scan-to-export workflow
Mobile Tests: iOS Safari, Android Chrome camera access
Offline Tests: Local storage and sync functionality
Performance Tests: Large session handling (1000+ items)
```

### **Test Scenarios**
- **Barcode Recognition**: Various barcode formats and qualities
- **Product Matching**: Known products, unknown products, manual entry
- **Session Management**: Multiple concurrent sessions, session recovery
- **Offline Operation**: Scan while offline, sync when online
- **Export Functionality**: Google Sheets formatting, data accuracy

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export with PWA optimization
CDN: Cloudflare global edge network
Database: Supabase with automated backups
Monitoring: Real-time scanning performance analytics
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# Inventory-specific variables
GOOGLE_SHEETS_API_KEY=your_sheets_api_key
HENRY_SCHEIN_API_KEY=your_henry_schein_key
HENRY_SCHEIN_API_URL=https://api.henryschein.com
BARCODE_SCANNING_TIMEOUT=10000
DEFAULT_EXPORT_TEMPLATE=ganger_inventory_template
```

### **PWA Configuration**
- **Service Worker**: Offline scanning and sync capabilities
- **App Manifest**: Install prompt for mobile home screen
- **Cache Strategy**: Critical resources cached for offline use
- **Background Sync**: Automatic upload when connection restored

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Daily scanning sessions, items scanned per user
- **Performance Metrics**: Scan success rates, session completion times
- **Feature Usage**: Manual entry frequency, export success rates
- **Mobile Usage**: Device types, offline usage patterns

### **App-Specific Analytics**
- **Scanning Efficiency**: Items scanned per minute, session duration
- **Product Recognition**: Barcode success rates, manual entry frequency
- **Inventory Insights**: Most scanned products, missing product patterns
- **Location Performance**: Scanning efficiency by location
- **Cost Analysis**: Total inventory value tracked per session

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Data Encryption**: All inventory data encrypted at rest and in transit
- **Session Isolation**: Users can only access their own scanning sessions
- **Audit Logging**: Complete trail of scanning activities
- **Secure Export**: Encrypted transmission to Google Sheets

### **Data Privacy**
- **Minimal Data Collection**: Only necessary inventory information stored
- **Local Processing**: Barcode recognition performed locally when possible
- **Secure API Keys**: Encrypted storage of third-party API credentials
- **Data Retention**: Configurable retention policies for completed sessions

### **App-Specific Security**
- **Camera Permissions**: Secure handling of device camera access
- **Offline Security**: Encrypted local storage for offline scans
- **API Rate Limiting**: Protect against excessive Henry Schein API calls
- **Export Validation**: Verify Google Sheets export integrity

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] Barcode scanning works on iOS Safari and Android Chrome
- [ ] Google Sheets export generates properly formatted inventory reports
- [ ] Offline scanning supports 100+ items with sync capability
- [ ] Product lookup success rate > 90% for common medical supplies
- [ ] Complete user training and documentation available

### **Success Metrics (3 months)**
- 50% reduction in time to complete monthly inventory counts
- 95%+ barcode recognition accuracy for known products
- 100% elimination of manual transcription errors
- 90%+ user adoption across all locations
- < 2 second average time per item scanned

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Product Database Updates**: Weekly sync with Henry Schein catalog
- **Barcode Library Updates**: Monthly updates to scanning libraries
- **Performance Optimization**: Quarterly review of scanning efficiency
- **User Feedback Integration**: Continuous improvement based on usage

### **Future Enhancements**
- **AI Product Recognition**: Image-based product identification
- **Predictive Ordering**: Automatic reorder point suggestions
- **Multi-Vendor Support**: Integration with additional suppliers
- **Advanced Analytics**: Inventory trend analysis and forecasting

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] Barcode scanning implementation guide
- [ ] Google Sheets API integration documentation
- [ ] PWA offline functionality architecture
- [ ] Product matching algorithm documentation

### **User Documentation**
- [ ] Mobile scanning tutorial with screenshots
- [ ] Session management and export guide
- [ ] Troubleshooting guide for common scanning issues
- [ ] Product database management procedures

---

*This Inventory Scan & Order Assistant transforms manual inventory processes into efficient, mobile-first workflows while maintaining accuracy and providing seamless integration with existing Google Sheets workflows.*