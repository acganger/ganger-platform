# AI Purchasing Agent

AI-powered medical supply procurement optimization for Ganger Dermatology.

## Overview

The AI Purchasing Agent intercepts medical supply procurement requests, performs real-time multi-vendor price comparison, and recommends optimal purchasing decisions to reduce costs and improve procurement efficiency.

## Features

- **Shopping Cart Interceptor**: Captures purchase requests before checkout
- **Multi-Vendor Price Engine**: Real-time price comparison across vendors
- **Product Matching AI**: Identifies equivalent products across catalogs
- **Contract Pricing Validator**: Ensures GPO/negotiated pricing is applied
- **Recommendation Engine**: Suggests optimal purchasing decisions
- **Approval Workflow**: Routes decisions based on savings potential

## Tech Stack

- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase for database and auth
- OpenAI for product matching
- Shared Ganger Platform packages

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check
```

## Environment Variables

Required environment variables (set in Vercel):
- All standard Ganger Platform variables
- `OPENAI_API_KEY` - For AI product matching
- Vendor API keys (when available)

## Deployment

This app follows the standard Ganger Platform deployment process via Vercel.