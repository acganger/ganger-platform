# Inventory Management SPA

**Ganger Platform - Phase 1 Application**

A comprehensive medical supply inventory tracking and management system built with Next.js and the Ganger Platform shared infrastructure.

<!-- Vercel deployment test: June 24, 2025 -->
<!-- GitHub integration test: June 24, 2025 22:55 -->

## 🎯 Purpose

Enable efficient tracking and management of medical supplies across multiple clinic locations with real-time stock monitoring, automated reordering, and comprehensive audit trails.

## 🏗️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase PostgreSQL + Edge Functions
- **Authentication**: Google OAuth (@gangerdermatology.com)
- **Styling**: Tailwind CSS + Ganger Design System
- **Deployment**: Cloudflare Workers (static export)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project setup
- Google OAuth credentials

### Development Setup

```bash
# Install dependencies (from monorepo root)
npm install

# Start development server
npm run dev:inventory

# Or run from this directory
cd apps/inventory
npm run dev
```

The application will be available at http://localhost:3001

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
apps/inventory/
├── src/
│   ├── pages/           # Next.js pages
│   │   ├── dashboard/   # Main dashboard views
│   │   ├── auth/        # Authentication pages
│   │   └── api/         # API routes (if needed)
│   ├── components/      # App-specific components
│   ├── lib/            # Utilities and configurations
│   ├── types/          # TypeScript type definitions
│   ├── hooks/          # Custom React hooks
│   └── styles/         # Global styles
├── public/             # Static assets
└── README.md          # This file
```

## 🧩 Features

### Core Functionality
- ✅ Real-time inventory tracking
- ✅ Multi-location stock management
- ✅ Automated low stock alerts
- ✅ Purchase order management
- ✅ Supplier relationship tracking
- ✅ Barcode scanning support
- ✅ Expiration date monitoring
- ✅ Stock count/audit sessions

### User Roles & Permissions
- **Staff**: View inventory, create requests
- **Manager**: Full inventory management, reporting
- **Superadmin**: System administration, multi-location access

## 🔌 Shared Package Integration

This application utilizes the Ganger Platform shared packages:

```typescript
import { Button, DataTable, LoadingSpinner } from '@ganger/ui';
import { useAuth, withAuth } from '@ganger/auth'; 
import { db, InventoryItem } from '@ganger/db';
import { analytics, notifications } from '@ganger/utils';
```

## 🗄️ Database Schema

Uses shared database tables plus inventory-specific tables:

- `inventory_items` - Product catalog and stock levels
- `inventory_categories` - Product categorization
- `suppliers` - Vendor information
- `purchase_orders` - Order management
- `inventory_transactions` - Stock movement tracking
- `stock_count_sessions` - Audit and counting

## 🔒 Security & Compliance

- **Authentication**: Google OAuth with domain restriction
- **Authorization**: Role-based access control
- **Data Protection**: Encrypted sensitive information
- **Audit Logging**: Complete transaction history
- **Session Management**: Secure JWT tokens

## 📊 Analytics & Monitoring

- **Usage Tracking**: User interactions and feature adoption
- **Performance Metrics**: Page load times, API response times
- **Business Metrics**: Stock turns, order frequency, cost analysis
- **Error Tracking**: Application errors and user feedback

## 🧪 Testing

```bash
# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

Automated deployment via GitHub Actions to Cloudflare Workers:

1. **Staging**: Deploy to `inventory-staging.pages.dev` on `staging` branch
2. **Production**: Deploy to `inventory.gangerdermatology.com` on `main` branch

## 🔄 Migration from Legacy System

This application replaces the legacy PHP inventory system with:

- **Modern Architecture**: React/Next.js vs PHP
- **Real-time Updates**: WebSocket connections vs page refreshes  
- **Mobile Responsive**: Touch-friendly interface
- **Enhanced Security**: Modern authentication and encryption
- **Better Performance**: Static generation + edge deployment

## 📈 Success Metrics

- **Efficiency**: 70% reduction in inventory management time
- **Accuracy**: 99% stock level accuracy
- **Cost Savings**: 15% reduction in overstocking
- **User Adoption**: 90% staff adoption within 30 days

## 🔧 Configuration

Environment variables required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://inventory.gangerdermatology.com
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [User Guide](./docs/user-guide.md)
- [Development Guide](./docs/development.md)

---

**Part of the Ganger Platform - Modern Healthcare Technology Solutions**