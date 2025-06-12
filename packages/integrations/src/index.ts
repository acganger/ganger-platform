// Google integrations
export { GoogleCalendarClient } from './google/calendar';
export { GoogleSheetsClient } from './google/sheets';
export type { CalendarEvent, CalendarListOptions } from './google/calendar';
export type { SheetData, SheetInfo } from './google/sheets';

// Email integration
export { EmailClient } from './email/client';
export type { EmailConfig, EmailMessage, EmailTemplate, EmailAttachment } from './email/client';

// SMS integration
export { TwilioSMSClient } from './sms/twilio';
export type { SMSMessage, SMSConfig, SMSTemplate } from './sms/twilio';

// PDF generation
export { PDFGenerator } from './pdf/generator';
export type { PDFOptions, PDFContent, HandoutData } from './pdf/generator';

// Communication system (Patient Communication Hub)
export * from './communication';

// Payment system (Universal Payment Processing Hub)
export * from './payments';

// Database system (Supabase MCP Integration)
export * from './database';

// React providers for Universal Hubs
export { CommunicationProvider, useCommunication } from './providers/CommunicationProvider';
export { PaymentProvider, usePayment } from './providers/PaymentProvider';