import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
  variables?: Record<string, string>;
}

export class EmailClient {
  private transporter: Transporter;
  private fromAddress: string;

  constructor(config: EmailConfig, fromAddress: string) {
    this.transporter = nodemailer.createTransport(config);
    this.fromAddress = fromAddress;
  }

  static createGmailClient(email: string, password: string) {
    return new EmailClient({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: password,
      },
    }, email);
  }

  static createOffice365Client(email: string, password: string) {
    return new EmailClient({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: password,
      },
    }, email);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }

  async sendEmail(message: EmailMessage): Promise<any> {
    try {
      const mailOptions: SendMailOptions = {
        from: this.fromAddress,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        cc: Array.isArray(message.cc) ? message.cc.join(', ') : message.cc,
        bcc: Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
        replyTo: message.replyTo,
        priority: message.priority,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendTemplateEmail(to: string | string[], template: EmailTemplate, variables: Record<string, string> = {}): Promise<any> {
    let subject = template.subject;
    let html = template.html;
    let text = template.text;

    // Replace variables in template
    const allVariables = { ...template.variables, ...variables };
    Object.entries(allVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      html = html.replace(new RegExp(placeholder, 'g'), value);
      if (text) {
        text = text.replace(new RegExp(placeholder, 'g'), value);
      }
    });

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  async sendBulkEmails(messages: EmailMessage[]): Promise<any[]> {
    const results = [];
    for (const message of messages) {
      try {
        const result = await this.sendEmail(message);
        results.push({ success: true, result, message: message.subject });
      } catch (error) {
        results.push({ success: false, error, message: message.subject });
      }
    }
    return results;
  }

  async sendWelcomeEmail(to: string, name: string, loginUrl: string): Promise<any> {
    const template: EmailTemplate = {
      subject: 'Welcome to Ganger Platform',
      html: `
        <h1>Welcome {{name}}!</h1>
        <p>Your account has been created successfully.</p>
        <p>You can log in at: <a href="{{loginUrl}}">{{loginUrl}}</a></p>
        <p>Best regards,<br>Ganger Platform Team</p>
      `,
      text: `
        Welcome {{name}}!
        
        Your account has been created successfully.
        You can log in at: {{loginUrl}}
        
        Best regards,
        Ganger Platform Team
      `,
    };

    return this.sendTemplateEmail(to, template, { name, loginUrl });
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<any> {
    const template: EmailTemplate = {
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>Hi {{name}},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="{{resetUrl}}">Reset Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Ganger Platform Team</p>
      `,
      text: `
        Password Reset
        
        Hi {{name}},
        
        You requested a password reset. Click the link below to reset your password:
        {{resetUrl}}
        
        This link will expire in 24 hours.
        If you didn't request this, please ignore this email.
        
        Best regards,
        Ganger Platform Team
      `,
    };

    return this.sendTemplateEmail(to, template, { name, resetUrl });
  }

  async sendNotificationEmail(to: string, subject: string, message: string, actionUrl?: string): Promise<any> {
    const template: EmailTemplate = {
      subject,
      html: `
        <h1>{{subject}}</h1>
        <p>{{message}}</p>
        ${actionUrl ? `<p><a href="{{actionUrl}}">View Details</a></p>` : ''}
        <p>Best regards,<br>Ganger Platform Team</p>
      `,
      text: `
        {{subject}}
        
        {{message}}
        
        ${actionUrl ? 'View Details: {{actionUrl}}' : ''}
        
        Best regards,
        Ganger Platform Team
      `,
    };

    return this.sendTemplateEmail(to, template, { subject, message, actionUrl: actionUrl || '' });
  }

  close() {
    this.transporter.close();
  }
}