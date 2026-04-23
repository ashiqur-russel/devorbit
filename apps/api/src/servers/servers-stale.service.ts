import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServersService } from './servers.service';

/**
 * Periodically marks agents offline only when heartbeats (lastSeen) have stopped,
 * not when the socket disconnects (deploy, load balancer, brief network loss).
 */
@Injectable()
export class ServersStaleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServersStaleService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly servers: ServersService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const intervalMs = Number(this.config.get('AGENT_STALE_CHECK_INTERVAL_MS') ?? 60_000);
    if (intervalMs < 10_000) {
      this.logger.warn(`AGENT_STALE_CHECK_INTERVAL_MS=${intervalMs} is very low; using 10s minimum`);
    }
    const every = Math.max(10_000, intervalMs);
    this.timer = setInterval(() => void this.tick(), every);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    const maxAgeMs = Number(this.config.get('AGENT_OFFLINE_AFTER_MS') ?? 180_000);
    const threshold = Math.max(30_000, maxAgeMs);
    try {
      const n = await this.servers.markStaleAgentsOffline(threshold);
      if (n > 0) this.logger.log(`Marked ${n} server(s) offline (no heartbeat for ${threshold}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Stale agent check failed: ${msg}`);
    }
  }
}
