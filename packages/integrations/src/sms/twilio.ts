import { Twilio } from 'twilio';

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
}

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SMSTemplate {
  body: string;
  variables?: Record<string, string>;
}

export class TwilioSMSClient {
  private client: Twilio;
  private fromNumber: string;

  constructor(config: SMSConfig) {
    this.client = new Twilio(config.accountSid, config.authToken);
    this.fromNumber = config.fromNumber;
  }

  async sendSMS(message: SMSMessage): Promise<any> {
    try {
      const result = await this.client.messages.create({
        body: message.body,
        from: message.from || this.fromNumber,
        to: message.to,
        mediaUrl: message.mediaUrl,
      });
      return result;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendTemplateSMS(to: string, template: SMSTemplate, variables: Record<string, string> = {}): Promise<any> {
    let body = template.body;

    // Replace variables in template
    const allVariables = { ...template.variables, ...variables };
    Object.entries(allVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      body = body.replace(new RegExp(placeholder, 'g'), value);
    });

    return this.sendSMS({ to, body });
  }

  async sendBulkSMS(messages: SMSMessage[]): Promise<any[]> {
    const results = [];
    for (const message of messages) {
      try {
        const result = await this.sendSMS(message);
        results.push({ success: true, result, to: message.to });
      } catch (error) {
        results.push({ success: false, error, to: message.to });
      }
    }
    return results;
  }

  async sendAppointmentReminder(to: string, patientName: string, appointmentDate: string, appointmentTime: string, location: string): Promise<any> {
    const template: SMSTemplate = {
      body: `Hi {{patientName}}, this is a reminder of your appointment on {{appointmentDate}} at {{appointmentTime}} at {{location}}. Reply CONFIRM to confirm or CANCEL to cancel.`,
    };

    return this.sendTemplateSMS(to, template, {
      patientName,
      appointmentDate,
      appointmentTime,
      location,
    });
  }

  async sendAppointmentConfirmation(to: string, patientName: string, appointmentDate: string, appointmentTime: string, location: string): Promise<any> {
    const template: SMSTemplate = {
      body: `Hello {{patientName}}, your appointment is confirmed for {{appointmentDate}} at {{appointmentTime}} at {{location}}. We look forward to seeing you!`,
    };

    return this.sendTemplateSMS(to, template, {
      patientName,
      appointmentDate,
      appointmentTime,
      location,
    });
  }

  async sendVerificationCode(to: string, code: string): Promise<any> {
    const template: SMSTemplate = {
      body: `Your verification code is: {{code}}. This code will expire in 10 minutes.`,
    };

    return this.sendTemplateSMS(to, template, { code });
  }

  async getMessageStatus(messageSid: string): Promise<any> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
      };
    } catch (error) {
      console.error('Error fetching message status:', error);
      throw error;
    }
  }

  async getAccountInfo(): Promise<any> {
    try {
      const account = await this.client.api.accounts.list({ limit: 1 });
      return account[0];
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const lookup = await this.client.lookups.v1.phoneNumbers(phoneNumber).fetch();
      return !!lookup.phoneNumber;
    } catch (error) {
      console.error('Error validating phone number:', error);
      return false;
    }
  }

  async getIncomingMessages(limit = 20): Promise<any[]> {
    try {
      const messages = await this.client.messages.list({
        to: this.fromNumber,
        limit,
      });
      return messages.map(msg => ({
        sid: msg.sid,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        status: msg.status,
        dateCreated: msg.dateCreated,
        dateSent: msg.dateSent,
      }));
    } catch (error) {
      console.error('Error fetching incoming messages:', error);
      throw error;
    }
  }
}