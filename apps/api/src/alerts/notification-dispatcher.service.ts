import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { AlertChannel } from './alert-channel.schema';

export type AlertFiredPayload = {
  ruleName: string;
  summary: string;
  incidentId: string;
};

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(private readonly mailService: MailService) {}

  async dispatch(channels: AlertChannel[], payload: AlertFiredPayload): Promise<void> {
    for (const ch of channels) {
      try {
        if (ch.type === 'email') await this.dispatchEmail(ch, payload);
        else if (ch.type === 'slack_webhook') await this.dispatchSlack(ch, payload);
        else if (ch.type === 'webhook') await this.dispatchWebhook(ch, payload);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Notification dispatch failed for channel ${ch._id} (${ch.type}): ${msg}`);
      }
    }
  }

  private async dispatchEmail(ch: AlertChannel, payload: AlertFiredPayload): Promise<void> {
    const emails = ch.config?.emails ?? [];
    if (!emails.length) return;
    const html = `
      <h2>🚨 Alert Fired: ${payload.ruleName}</h2>
      <p>${payload.summary}</p>
      <p>Incident ID: <code>${payload.incidentId}</code></p>
    `.trim();
    for (const to of emails) {
      if (this.mailService.isConfigured()) {
        await this.mailService.send({ to, subject: `[Devorbit] Alert: ${payload.ruleName}`, html });
      }
    }
  }

  private async dispatchSlack(ch: AlertChannel, payload: AlertFiredPayload): Promise<void> {
    const url = ch.config?.slackWebhookUrl;
    if (!url) return;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *Alert Fired: ${payload.ruleName}*\n${payload.summary}`,
      }),
    });
  }

  private async dispatchWebhook(ch: AlertChannel, payload: AlertFiredPayload): Promise<void> {
    const url = ch.config?.url;
    if (!url) return;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'alert.fired', ...payload }),
    });
  }
}
