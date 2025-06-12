# Ganger Platform - Repository Structure & Commit Guidelines

## 🚀 **Repository Overview**

This is a comprehensive monorepo for the Ganger Platform, containing 16+ medical practice management applications built with Next.js, TypeScript, and Supabase.

## 📁 **Directory Structure**

```
ganger-platform/
├── apps/                          # Next.js Applications
│   ├── config-dashboard/          # ✅ Configuration Management System
│   ├── clinical-staffing/         # ✅ Clinical Staff Management
│   ├── compliance-training/       # ✅ HIPAA Compliance Training
│   ├── eos-l10/                  # ✅ EOS L10 Meeting Management
│   ├── checkin-kiosk/            # ✅ Patient Check-in Kiosk
│   ├── handouts/                 # ✅ Patient Handouts Generator
│   ├── inventory/                # ✅ Medical Inventory Management
│   ├── medication-auth/          # ✅ Medication Authorization
│   ├── pharma-scheduling/        # ✅ Pharmaceutical Rep Scheduling
│   ├── platform-dashboard/       # ✅ Platform Entry Dashboard
│   ├── integration-status/       # ✅ Integration Status Monitor
│   ├── socials-reviews/          # ✅ Social Media & Reviews
│   ├── batch-closeout/           # ✅ Batch Processing System
│   ├── call-center-ops/          # ✅ Call Center Operations
│   ├── ai-receptionist/          # ✅ AI Phone Agent
│   └── staff/                    # 🚧 Staff Management (Legacy Migration)
├── packages/                     # Shared Libraries
│   ├── auth/                     # ✅ Authentication & OAuth
│   ├── db/                       # ✅ Database & Supabase Client
│   ├── ui/                       # ✅ Shared UI Components
│   └── utils/                    # ✅ Shared Utilities
├── supabase/                     # Database & Backend
│   ├── migrations/               # ✅ 25+ Database Migrations
│   └── functions/                # ✅ Edge Functions
├── docs/                         # Documentation
├── scripts/                      # Automation Scripts
├── mcp-servers/                  # 8 Active MCP Servers
└── legacy-a2hosting-apps/        # Legacy PHP Migration Data
```

## 🛡️ **Security & Gitignore Configuration**

### **Protected Files** (Automatically Excluded)
- `**/.env*` - Environment variables (except .env.example)
- `**/node_modules/` - Dependencies (3000+ directories)
- `**/*.log` - Log files
- `**/.turbo/` - Turborepo cache
- `**/coverage/` - Test coverage reports
- `**/*.tsbuildinfo` - TypeScript build cache
- `legacy-a2hosting-apps/mysql*/` - Legacy database dumps
- `CLAUDE.md` - Contains sensitive project information
- `**/uploads/` - User uploaded files

### **Development Files** (Excluded)
- SSH tunnel scripts
- Database access automation
- Credential files
- Large binary files (*.tar.gz, *.zip)

## 📊 **Repository Statistics**

- **Applications**: 16 Next.js apps
- **Shared Packages**: 4 core packages
- **Database Migrations**: 25+ migrations
- **MCP Servers**: 8 active integrations
- **Total Dependencies**: ~3000 node_modules directories
- **Technology Stack**: Next.js 15, TypeScript, Supabase, Tailwind CSS

## 🔄 **Development Workflow**

### **First-Time Setup**
```bash
# Clone repository
git clone https://github.com/acganger/ganger-platform.git
cd ganger-platform

# Install dependencies
npm install

# Start local development
npm run dev
```

### **Monorepo Commands**
```bash
# Development
npm run dev              # Start all apps
npm run build            # Build all apps
npm run type-check       # TypeScript validation
npm run lint             # ESLint all packages
npm run test             # Run all tests

# Database
npm run supabase:start   # Start local Supabase
npm run db:migrate       # Run migrations
```

## 🚀 **Deployment Status**

### **Production Ready Applications**
- ✅ Config Dashboard - Enterprise configuration management
- ✅ Clinical Staffing - Real-time staff scheduling
- ✅ Compliance Training - HIPAA training system
- ✅ Platform Dashboard - Central entry point
- ✅ Integration Status - Third-party monitoring

### **MCP-Enhanced Infrastructure**
- ✅ Supabase MCP - Database operations
- ✅ Google Sheets MCP - Spreadsheet integration
- ✅ Time MCP - HIPAA-compliant timestamps
- ✅ Cloudflare MCP - Edge deployment
- ✅ GitHub MCP - Repository automation

## 📝 **Commit Guidelines**

### **What's Included in Version Control**
- Source code for all applications
- Shared packages and utilities
- Database migration files
- Configuration examples (.env.example)
- Documentation and guides
- Build and deployment scripts

### **What's Excluded** 
- Environment variables with credentials
- Node modules and build artifacts
- Log files and temporary files
- Legacy database dumps
- SSH/tunnel automation scripts
- User uploaded content

## 🏥 **Medical Platform Compliance**

This is a **private medical platform** for Ganger Dermatology:
- HIPAA-compliant architecture
- Secure patient data handling
- Enterprise-grade authentication
- Audit logging and compliance tracking
- Private internal tooling (not open source)

## 📞 **Support & Development**

For development questions or infrastructure support:
- Review `/docs/` for technical documentation
- Check `/true-docs/` for implementation guides  
- Refer to `CLAUDE.md` for project instructions (excluded from version control)

---

**Last Updated**: January 12, 2025  
**Platform Version**: 2.0.0  
**Repository Status**: ✅ Ready for Initial Commit