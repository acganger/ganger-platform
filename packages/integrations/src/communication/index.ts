// Universal Patient Communication Hub
// HIPAA-compliant messaging service for all Ganger Platform applications

export * from './sms-service';
export * from './consent-manager';
export * from './twilio-mcp-service';
export * from './types';

// Main communication hub - single entry point for all apps
export { PatientCommunicationHub } from './communication-hub';
export { EnhancedCommunicationHub } from './enhanced-communication-hub';

// Enhanced types for MCP integration
export type { CommunicationAnalytics, RealTimeCommunicationEvent } from './enhanced-communication-hub';