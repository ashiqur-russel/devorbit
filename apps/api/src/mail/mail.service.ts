import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

const RESEND_API = 'https://api.resend.com/emails';

export type MailProvider = 'gmail' | 'resend';

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  /** Prefer Gmail SMTP when both vars are set; otherwise Resend if API key is set. */
  getProvider(): MailProvider | null {
    const forced = this.config.get<string>('MAIL_PROVIDER')?.trim().toLowerCase();
    const gmailUser = this.config.get<string>('GMAIL_USER')?.trim();
    const gmailPass = this.config.get<string>('GMAIL_APP_PASSWORD')?.replace(/\s/g, '') || '';
    const resendKey = this.config.get<string>('RESEND_API_KEY')?.trim();

    if (forced === 'gmail' && gmailUser && gmailPass) return 'gmail';
    if (forced === 'resend' && resendKey) return 'resend';

    if (gmailUser && gmailPass) return 'gmail';
    if (resendKey) return 'resend';
    return null;
  }

  isConfigured(): boolean {
    return this.getProvider() !== null;
  }

  async send(input: SendMailInput): Promise<{ id: string }> {
    const provider = this.getProvider();
    if (!provider) {
      throw new ServiceUnavailableException(
        'Email is not configured. Set GMAIL_USER + GMAIL_APP_PASSWORD (Gmail) or RESEND_API_KEY (Resend) — see .env.example.',
      );
    }
    if (provider === 'gmail') return this.sendViaGmail(input);
    return this.sendViaResend(input);
  }

  private gmailFrom(): string {
    const custom = this.config.get<string>('MAIL_FROM')?.trim();
    if (custom) return custom;
    const user = this.config.get<string>('GMAIL_USER')?.trim();
    return user ? `Devorbit <${user}>` : 'Devorbit <noreply@localhost>';
  }

  private async sendViaGmail(input: SendMailInput): Promise<{ id: string }> {
    const user = this.config.get<string>('GMAIL_USER')?.trim();
    const pass = this.config.get<string>('GMAIL_APP_PASSWORD')?.replace(/\s/g, '') || '';
    if (!user || !pass) {
      throw new ServiceUnavailableException('Gmail: set GMAIL_USER and GMAIL_APP_PASSWORD.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    try {
      const info = await transporter.sendMail({
        from: this.gmailFrom(),
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      const id = info.messageId?.replace(/[<>]/g, '') || `gmail-${Date.now()}`;
      return { id };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Gmail SMTP error: ${msg}`);
      throw new BadRequestException(msg);
    }
  }

  private async sendViaResend(input: SendMailInput): Promise<{ id: string }> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('Resend: set RESEND_API_KEY.');
    }

    const from =
      this.config.get<string>('MAIL_FROM')?.trim() || 'Devorbit <onboarding@resend.dev>';

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      const message =
        typeof body.message === 'string'
          ? body.message
          : typeof body.name === 'string'
            ? body.name
            : `Resend HTTP ${res.status}`;
      this.logger.warn(`Resend error: ${message} ${JSON.stringify(body)}`);
      throw new BadRequestException(message);
    }

    const id = body.id;
    if (typeof id !== 'string') {
      this.logger.warn(`Unexpected Resend response: ${JSON.stringify(body)}`);
      throw new BadRequestException('Resend returned no message id');
    }

    return { id };
  }

  async sendTest(to: string): Promise<{ id: string; to: string; via: MailProvider }> {
    const provider = this.getProvider();
    if (!provider) {
      throw new ServiceUnavailableException('Email is not configured.');
    }
    const label = provider === 'gmail' ? 'Gmail (SMTP)' : 'Resend';
    const html = `
      <p>This is a <strong>test email</strong> from your Devorbit API (${label}).</p>
      <p>If you received it, transactional mail is working.</p>
    `.trim();
    const { id } = await this.send({
      to,
      subject: 'Devorbit — test email',
      html,
    });
    return { id, to, via: provider };
  }
}
