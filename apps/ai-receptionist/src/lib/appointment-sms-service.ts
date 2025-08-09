// Appointment SMS Service for AI Receptionist
// Sends appointment information via SMS to verified employees

import { ZenefitsEmployee } from '@/types';

interface AppointmentInfo {
  id: string;
  patient_name: string;
  date: Date;
  time: string;
  provider: string;
  location: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

interface SMSResult {
  success: boolean;
  message_sid?: string;
  error?: string;
}

export class AppointmentSMSService {
  
  constructor() {}

  /**
   * Get mock appointment data for an employee
   */
  private getMockAppointmentData(employee: ZenefitsEmployee): AppointmentInfo[] {
    // Get current time in Eastern Time (Ganger Dermatology timezone)
    const now = new Date('2025-06-12T10:46:00-04:00'); // Current time from Time MCP
    const mockAppointments: AppointmentInfo[] = [];

    // Create realistic mock appointments based on employee role
    if (employee.title?.toLowerCase().includes('chief') || employee.title?.toLowerCase().includes('ceo')) {
      // Executive appointments
      mockAppointments.push({
        id: 'apt_001',
        patient_name: 'Board Meeting',
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now (June 14, 2025)
        time: '10:00 AM',
        provider: 'Board of Directors',
        location: 'Conference Room A',
        type: 'Administrative Meeting',
        status: 'confirmed',
        notes: 'Q4 financial review and strategic planning'
      });
      
      mockAppointments.push({
        id: 'apt_002',
        patient_name: 'Staff Review Meeting',
        date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now (June 17, 2025)
        time: '2:00 PM',
        provider: 'HR Department',
        location: 'Ann Arbor Office',
        type: 'Performance Review',
        status: 'confirmed'
      });

    } else if (employee.title?.toLowerCase().includes('nurse') || employee.title?.toLowerCase().includes('medical')) {
      // Medical staff appointments
      mockAppointments.push({
        id: 'apt_003',
        patient_name: 'Training Session',
        date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now (June 13, 2025)
        time: '9:00 AM',
        provider: 'Continuing Education',
        location: 'Training Room',
        type: 'Dermatology Update Course',
        status: 'confirmed',
        notes: 'Latest treatments for psoriasis and eczema'
      });

      mockAppointments.push({
        id: 'apt_004',
        patient_name: 'Patient Care Meeting',
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now (June 15, 2025)
        time: '11:30 AM',
        provider: 'Dr. Ganger',
        location: 'Ann Arbor Office',
        type: 'Care Coordination',
        status: 'confirmed'
      });

    } else {
      // General staff appointments
      mockAppointments.push({
        id: 'apt_005',
        patient_name: 'Team Meeting',
        date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now (June 13, 2025)
        time: '3:00 PM',
        provider: 'Department Head',
        location: 'Main Office',
        type: 'Weekly Team Sync',
        status: 'confirmed'
      });

      mockAppointments.push({
        id: 'apt_006',
        patient_name: 'Training Workshop',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now (June 19, 2025)
        time: '1:00 PM',
        provider: 'IT Department',
        location: 'Computer Lab',
        type: 'Software Training',
        status: 'confirmed',
        notes: 'New patient management system training'
      });
    }

    return mockAppointments;
  }

  /**
   * Send SMS using Twilio (mock implementation for demo)
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    try {
      // In production, this would use the actual Twilio integration
      console.log(`📱 Appointment SMS - TO: ${phoneNumber}`);
      console.log(`📱 Appointment SMS - MESSAGE: ${message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simulate successful SMS
      return {
        success: true,
        message_sid: `SM${Math.random().toString(36).substr(2, 32)}`
      };

    } catch (error) {
      console.error('Appointment SMS send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Format appointment for SMS
   */
  private formatAppointmentForSMS(appointment: AppointmentInfo): string {
    const dateStr = appointment.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let message = `📅 Ganger Dermatology - Next Appointment\n\n`;
    message += `Event: ${appointment.patient_name}\n`;
    message += `Date: ${dateStr}\n`;
    message += `Time: ${appointment.time}\n`;
    message += `With: ${appointment.provider}\n`;
    message += `Location: ${appointment.location}\n`;
    message += `Type: ${appointment.type}\n`;
    
    if (appointment.notes) {
      message += `\nNotes: ${appointment.notes}\n`;
    }
    
    message += `\nStatus: ${appointment.status.toUpperCase()}\n`;
    message += `\nQuestions? Call (734) 344-4567`;

    return message;
  }

  /**
   * Get next appointment for an employee
   */
  getNextAppointment(employee: ZenefitsEmployee): AppointmentInfo | null {
    const appointments = this.getMockAppointmentData(employee);
    const now = new Date();
    
    // Find the next upcoming appointment
    const upcomingAppointments = appointments
      .filter(apt => apt.date > now && apt.status !== 'cancelled')
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcomingAppointments.length > 0 ? upcomingAppointments[0]! : null;
  }

  /**
   * Send next appointment via SMS
   */
  async sendNextAppointmentSMS(employee: ZenefitsEmployee, phoneNumber: string): Promise<{
    success: boolean;
    appointment_found: boolean;
    message_sid?: string;
    appointment_details?: string;
    error?: string;
  }> {
    try {
      console.log(`📅 Looking up next appointment for ${employee.first_name} ${employee.last_name}`);
      
      const nextAppointment = this.getNextAppointment(employee);
      
      if (!nextAppointment) {
        // No upcoming appointments
        const message = `📅 Ganger Dermatology\n\nHi ${employee.preferred_name || employee.first_name}!\n\nYou don't have any upcoming appointments scheduled at this time.\n\nTo schedule an appointment, please call (734) 344-4567 or visit our website.\n\nThank you!`;
        
        const smsResult = await this.sendSMS(phoneNumber, message);
        
        return {
          success: smsResult.success,
          appointment_found: false,
          message_sid: smsResult.message_sid,
          appointment_details: 'No upcoming appointments',
          error: smsResult.error
        };
      }

      // Format and send appointment details
      const appointmentMessage = this.formatAppointmentForSMS(nextAppointment);
      const smsResult = await this.sendSMS(phoneNumber, appointmentMessage);

      if (smsResult.success) {
        console.log(`✅ Appointment SMS sent successfully to ${employee.first_name} ${employee.last_name}`);
        console.log(`📅 Next appointment: ${nextAppointment.patient_name} on ${nextAppointment.date.toLocaleDateString()}`);
      }

      return {
        success: smsResult.success,
        appointment_found: true,
        message_sid: smsResult.message_sid,
        appointment_details: `${nextAppointment.patient_name} on ${nextAppointment.date.toLocaleDateString()} at ${nextAppointment.time}`,
        error: smsResult.error
      };

    } catch (error) {
      console.error('Failed to send appointment SMS:', error);
      return {
        success: false,
        appointment_found: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send all upcoming appointments (for comprehensive requests)
   */
  async sendAllAppointmentsSMS(employee: ZenefitsEmployee, phoneNumber: string): Promise<{
    success: boolean;
    appointments_count: number;
    message_sid?: string;
    error?: string;
  }> {
    try {
      const appointments = this.getMockAppointmentData(employee);
      const now = new Date();
      
      const upcomingAppointments = appointments
        .filter(apt => apt.date > now && apt.status !== 'cancelled')
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (upcomingAppointments.length === 0) {
        const message = `📅 Ganger Dermatology\n\nHi ${employee.preferred_name || employee.first_name}!\n\nYou don't have any upcoming appointments scheduled.\n\nTo schedule an appointment, call (734) 344-4567.\n\nThank you!`;
        
        const smsResult = await this.sendSMS(phoneNumber, message);
        
        return {
          success: smsResult.success,
          appointments_count: 0,
          message_sid: smsResult.message_sid,
          error: smsResult.error
        };
      }

      // Format all appointments
      let message = `📅 Ganger Dermatology - Your Upcoming Appointments\n\n`;
      message += `Hi ${employee.preferred_name || employee.first_name}!\n\n`;
      message += `You have ${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length > 1 ? 's' : ''}:\n\n`;

      upcomingAppointments.forEach((apt, index) => {
        const dateStr = apt.date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        message += `${index + 1}. ${apt.patient_name}\n`;
        message += `   ${dateStr} at ${apt.time}\n`;
        message += `   With: ${apt.provider}\n`;
        message += `   Location: ${apt.location}\n\n`;
      });

      message += `Questions? Call (734) 344-4567`;

      const smsResult = await this.sendSMS(phoneNumber, message);

      return {
        success: smsResult.success,
        appointments_count: upcomingAppointments.length,
        message_sid: smsResult.message_sid,
        error: smsResult.error
      };

    } catch (error) {
      console.error('Failed to send all appointments SMS:', error);
      return {
        success: false,
        appointments_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get appointment summary for voice response
   */
  getAppointmentSummary(employee: ZenefitsEmployee): string {
    const nextAppointment = this.getNextAppointment(employee);
    
    if (!nextAppointment) {
      return `You don't have any upcoming appointments scheduled. Would you like me to help you schedule one?`;
    }

    const dateStr = nextAppointment.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    return `Your next appointment is ${nextAppointment.patient_name} on ${dateStr} at ${nextAppointment.time} with ${nextAppointment.provider}. Would you like me to send the details to your phone?`;
  }
}

// Export singleton instance
export const appointmentSMSService = new AppointmentSMSService();