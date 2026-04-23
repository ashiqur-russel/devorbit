import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RESEND_API = 'https://api.resend.com/emails';

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('RESEND_API_KEY')?.trim());
  }

  /**
   * Sends one transactional email via Resend’s HTTP API (no extra npm deps).
   * Free tier: use `onboarding@resend.dev` as MAIL_FROM until you verify a domain.
   */
  async send(input: SendMailInput): Promise<{ id: string }> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Email is not configured. Set RESEND_API_KEY in the API environment (see .env.example).',
      );
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

  async sendTest(to: string): Promise<{ id: string; to: string }> {
    const html = `
      <p>This is a <strong>test email</strong> from your Devorbit API (Resend).</p>
      <p>If you received it, transactional mail is working.</p>
    `.trim();
    const { id } = await this.send({
      to,
      subject: 'Devorbit — test email',
      html,
    });
    return { id, to };
  }
}
