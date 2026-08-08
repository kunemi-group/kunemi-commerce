import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly defaultFrom: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('SENDBYTE_API_KEY', '');
    this.apiUrl = this.config.get<string>(
      'SENDBYTE_API_URL',
      'https://api.sendbyte.africa/v1/emails',
    );
    const fromEmail = this.config.get<string>(
      'SENDBYTE_FROM_EMAIL',
      'no-reply@kunemi.com',
    );
    const fromName = this.config.get<string>(
      'SENDBYTE_FROM_NAME',
      'Kunemi Commerce',
    );
    this.defaultFrom = `${fromName} <${fromEmail}>`;
  }

  /**
   * Dispatch email via SendByte REST API (https://docs.sendbyte.africa)
   */
  async sendMail(options: SendMailOptions): Promise<boolean> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const from = options.from || this.defaultFrom;

    if (!this.apiKey || this.apiKey === 'mock') {
      this.logger.log(
        `[SendByte Mock Mail] To: ${recipients.join(', ')} | Subject: "${options.subject}"\n${options.text || options.html}`,
      );
      return true;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `SendByte API HTTP ${response.status} Error: ${errorText}`,
        );
        return false;
      }

      this.logger.log(
        `[SendByte Mail Sent] To: ${recipients.join(', ')} | Subject: "${options.subject}"`,
      );
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to send email via SendByte to ${recipients.join(', ')}`,
        err,
      );
      return false;
    }
  }

  /**
   * Send Registration / Welcome Email
   */
  async sendRegistrationVerification(
    email: string,
    fullName: string,
    verificationCode: string,
  ) {
    const subject = 'Welcome to Kunemi Commerce - Verify Your Email';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
        <h2 style="color: #4f6bed;">Welcome to Kunemi Commerce, ${fullName}!</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">
          Thank you for registering. Please verify your email address to complete your registration.
        </p>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${verificationCode}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you did not request this code, you can safely ignore this email.</p>
      </div>
    `;
    const text = `Welcome to Kunemi Commerce, ${fullName}!\nVerification Code: ${verificationCode}`;
    return this.sendMail({ to: email, subject, html, text });
  }

  /**
   * Send Team Member Invitation Email
   */
  async sendTeamMemberInvitation(
    email: string,
    fullName: string,
    inviterName: string,
    tempPassword: string,
    role: string,
    storeName: string,
  ) {
    const subject = `You have been invited to join ${storeName} on Kunemi Workspace`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f6bed;">Team Invitation - ${storeName}</h2>
        <p style="color: #475569; font-size: 15px;">Hello ${fullName},</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">
          <strong>${inviterName}</strong> has invited you to join the team at <strong>${storeName}</strong> as a <strong>${role.toUpperCase()}</strong>.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #4f6bed; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #334155;"><strong>Login Email:</strong> ${email}</p>
          <p style="margin: 5px 0 0 0; color: #334155;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
        </div>
        <p style="color: #475569; font-size: 14px;">Sign in to your Workspace dashboard to get started.</p>
      </div>
    `;
    const text = `Hello ${fullName},\n${inviterName} invited you to join ${storeName} as ${role}.\nEmail: ${email}\nTemp Password: ${tempPassword}`;
    return this.sendMail({ to: email, subject, html, text });
  }

  /**
   * Send Platform Admin Provisioning Email
   */
  async sendAdminUserCreated(
    email: string,
    fullName: string,
    tempPassword: string,
    role: string,
  ) {
    const subject = 'Kunemi Commerce - Platform Admin Account Created';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f6bed;">Platform Admin Account Created</h2>
        <p style="color: #475569; font-size: 15px;">Hello ${fullName},</p>
        <p style="color: #475569; font-size: 15px;">
          You have been granted <strong>${role.toUpperCase()}</strong> access on the Kunemi Commerce Platform Admin surface.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #4f6bed; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #334155;"><strong>Admin Email:</strong> ${email}</p>
          <p style="margin: 5px 0 0 0; color: #334155;"><strong>Initial Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
        </div>
      </div>
    `;
    const text = `Hello ${fullName},\nPlatform Admin account created (${role}).\nEmail: ${email}\nInitial Password: ${tempPassword}`;
    return this.sendMail({ to: email, subject, html, text });
  }

  /**
   * Send Quotation Email to Customer
   */
  async sendQuotationEmail(
    email: string,
    customerName: string,
    docNumber: string,
    totalCents: number,
    currency: string,
    validUntil?: string,
  ) {
    const formattedAmount = `${currency} ${(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const subject = `Quotation ${docNumber} from Kunemi Merchant`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f6bed;">Quotation ${docNumber}</h2>
        <p style="color: #475569; font-size: 15px;">Dear ${customerName},</p>
        <p style="color: #475569; font-size: 15px;">
          Please find your requested quotation details below:
        </p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #334155;"><strong>Quotation Number:</strong> ${docNumber}</p>
          <p style="margin: 5px 0 0 0; color: #334155;"><strong>Total Amount:</strong> ${formattedAmount}</p>
          ${validUntil ? `<p style="margin: 5px 0 0 0; color: #334155;"><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString()}</p>` : ''}
        </div>
        <p style="color: #475569; font-size: 14px;">Thank you for your business interest!</p>
      </div>
    `;
    const text = `Quotation ${docNumber}\nCustomer: ${customerName}\nTotal Amount: ${formattedAmount}`;
    return this.sendMail({ to: email, subject, html, text });
  }

  /**
   * Send Invoice Email to Customer
   */
  async sendInvoiceEmail(
    email: string,
    customerName: string,
    docNumber: string,
    totalCents: number,
    currency: string,
    dueAt?: string,
  ) {
    const formattedAmount = `${currency} ${(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const subject = `Invoice ${docNumber} - Payment Request`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f6bed;">Invoice ${docNumber}</h2>
        <p style="color: #475569; font-size: 15px;">Dear ${customerName},</p>
        <p style="color: #475569; font-size: 15px;">
          Here is your invoice payment details:
        </p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #334155;"><strong>Invoice Number:</strong> ${docNumber}</p>
          <p style="margin: 5px 0 0 0; color: #334155;"><strong>Amount Due:</strong> ${formattedAmount}</p>
          ${dueAt ? `<p style="margin: 5px 0 0 0; color: #334155;"><strong>Due Date:</strong> ${new Date(dueAt).toLocaleDateString()}</p>` : ''}
        </div>
        <p style="color: #475569; font-size: 14px;">Thank you for your prompt payment.</p>
      </div>
    `;
    const text = `Invoice ${docNumber}\nCustomer: ${customerName}\nAmount Due: ${formattedAmount}`;
    return this.sendMail({ to: email, subject, html, text });
  }

  /**
   * Send Order Confirmation / Receipt Email
   */
  async sendOrderConfirmation(
    email: string,
    customerName: string,
    orderNumber: string,
    totalCents: number,
    currency: string,
    trackingUrl?: string,
  ) {
    const formattedAmount = `${currency} ${(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const subject = `Order Confirmation #${orderNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f6bed;">Order Confirmation #${orderNumber}</h2>
        <p style="color: #475569; font-size: 15px;">Hello ${customerName},</p>
        <p style="color: #475569; font-size: 15px;">
          Thank you for your order! We have received your order and are processing it.
        </p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #334155;"><strong>Order Number:</strong> #${orderNumber}</p>
          <p style="margin: 5px 0 0 0; color: #334155;"><strong>Total:</strong> ${formattedAmount}</p>
          ${trackingUrl ? `<p style="margin: 15px 0 0 0;"><a href="${trackingUrl}" style="background-color: #4f6bed; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block;">Track Your Delivery</a></p>` : ''}
        </div>
      </div>
    `;
    const text = `Order #${orderNumber} Confirmed!\nTotal: ${formattedAmount}\n${trackingUrl ? `Track: ${trackingUrl}` : ''}`;
    return this.sendMail({ to: email, subject, html, text });
  }
}
