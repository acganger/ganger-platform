# AI Receptionist Demo

A comprehensive AI-powered phone agent demonstration leveraging the existing Ganger Platform infrastructure.

## Overview

This demo showcases an intelligent AI receptionist system that integrates with:
- ✅ **Universal Communication Hub** (Twilio MCP integration)
- ✅ **Enhanced Database Client** (Supabase MCP with real-time monitoring)
- ✅ **Shared UI Components** (@ganger/ui with medical design system)
- ✅ **Authentication System** (@ganger/auth with Google OAuth)
- ✅ **Time MCP** (HIPAA-compliant timestamps)

## Features

### Live Call Monitoring
- Real-time call dashboard with conversation flow visualization
- AI confidence indicators and intent recognition display
- One-click transfer with context preservation
- Emergency override controls

### Mock AI Engine
- Simulated conversation turns with realistic AI responses
- Intent recognition (appointment scheduling, billing inquiries, etc.)
- Sentiment analysis and confidence scoring
- Escalation triggers for clinical questions

### Integration Showcase
- Communication Hub integration for message delivery
- Database operations with real-time updates
- Authentication with role-based access control
- HIPAA-compliant audit logging

## Development

```bash
# Start the demo
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## Architecture

Built following Ganger Platform standards:
- Next.js 14 with TypeScript
- Tailwind CSS with Ganger Design System
- Shared packages via workspace protocol
- Quality gates and performance budgets enforced

## Demo Scenarios

1. **Appointment Scheduling**: AI handles routine appointment requests
2. **Billing Inquiries**: Balance lookups and payment processing
3. **Clinical Escalation**: Emergency transfer to medical staff
4. **Multi-language Support**: Spanish conversation handling
5. **System Failures**: Graceful fallback procedures

## Access

- **URL**: http://localhost:3007
- **Authentication**: @gangerdermatology.com domain required
- **Roles**: Manager, Superadmin (full access), Staff (location-based access)