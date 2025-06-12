# AI Receptionist Demo

A comprehensive AI-powered phone agent demonstration leveraging the existing Ganger Platform infrastructure.

## Overview

This demo showcases an intelligent AI receptionist system that integrates with:
- ✅ **Universal Communication Hub** (Twilio MCP integration)
- ✅ **Enhanced Database Client** (Supabase MCP with real-time monitoring)
- ✅ **Shared UI Components** (@ganger/ui with medical design system)
- ✅ **Authentication System** (@ganger/auth with Google OAuth)
- ✅ **Time MCP** (HIPAA-compliant timestamps)
- ✅ **Zenefits HR Integration** (Employee recognition and personalized greetings)

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

### Employee Recognition
- Automatic employee identification by phone number lookup
- Personalized AI greetings for recognized staff members
- Integration with Zenefits HR system for real-time employee status
- Fallback to demo data when Zenefits API unavailable

### Integration Showcase
- Communication Hub integration for message delivery
- Database operations with real-time updates
- Authentication with role-based access control
- HIPAA-compliant audit logging
- HR system integration for employee recognition

## Development

```bash
# Start the demo
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

### Environment Variables

Required for Zenefits employee recognition:

```bash
# Zenefits HR Integration
ZENEFITS_API_KEY=your_api_key_here
ZENEFITS_COMPANY_ID=your_company_id
ZENEFITS_API_URL=https://api.zenefits.com/core
```

**Note**: The system gracefully falls back to demo employee data if Zenefits credentials are not configured.

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