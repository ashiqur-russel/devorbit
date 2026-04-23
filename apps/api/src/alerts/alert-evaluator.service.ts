import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { MetricsService } from '../metrics/metrics.service';
import { ServersService } from '../servers/servers.service';
import { AlertsService } from './alerts.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { AlertChannel } from './alert-channel.schema';

export const ALERT_FIRED_EVENT = 'alert.fired';
export const ALERT_RESOLVED_EVENT = 'alert.resolved';

export type AlertFiredEvent = {
  ruleId: string;
  ruleName: string;
  summary: string;
  serverId?: string;
  projectId?: string;
  incidentId: string;
};

@Injectable()
export class AlertEvaluatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertEvaluatorService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly config: ConfigService,
    private readonly alertsService: AlertsService,
    private readonly metricsService: MetricsService,
    private readonly serversService: ServersService,
    private readonly notificationDispatcher: NotificationDispatcherService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    const intervalMs = Number(this.config.get('ALERT_EVAL_INTERVAL_MS') ?? 30_000);
    this.timer = setInterval(() => void this.evaluate(), Math.max(10_000, intervalMs));
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async fireAlert(opts: {
    ruleId: string;
    ruleName: string;
    channels: AlertChannel[];
    summary: string;
    serverId?: string;
    projectId?: string;
  }): Promise<void> {
    const existing = await this.alertsService.findOpenIncidentForRule(opts.ruleId, opts.serverId, opts.projectId);
    if (existing) return;

    const rule = await this.alertsService.findRuleById(opts.ruleId);
    if (rule) {
      const lastFired = await this.alertsService.findLastFiredForRule(opts.ruleId);
      if (lastFired) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastFired.firedAt.getTime() < cooldownMs) return;
      }
    }

    const incident = await this.alertsService.createIncident({
      ruleId: opts.ruleId as any,
      serverId: opts.serverId as any,
      projectId: opts.projectId as any,
      firedAt: new Date(),
      status: 'open',
      summary: opts.summary,
    });

    const payload = { ruleName: opts.ruleName, summary: opts.summary, incidentId: String(incident._id) };
    await this.notificationDispatcher.dispatch(opts.channels, payload);

    const event: AlertFiredEvent = {
      ruleId: opts.ruleId,
      ruleName: opts.ruleName,
      summary: opts.summary,
      serverId: opts.serverId,
      projectId: opts.projectId,
      incidentId: String(incident._id),
    };
    this.eventEmitter.emit(ALERT_FIRED_EVENT, event);
  }

  @OnEvent('server.offline')
  async handleServerOffline(payload: { serverId: string; name: string }) {
    const rules = await this.alertsService.findEnabledRulesByType('agent_offline');
    for (const rule of rules) {
      const team = rule.teamId.toString();
      const servers = await this.serversService.findByTeam(team);
      const isTeamServer = servers.some((s) => s._id.toString() === payload.serverId);
      if (!isTeamServer) continue;
      await this.fireAlert({
        ruleId: String(rule._id),
        ruleName: rule.name,
        channels: rule.channels as unknown as AlertChannel[],
        summary: `Server "${payload.name}" went offline (no heartbeat received)`,
        serverId: payload.serverId,
      });
    }
  }

  @OnEvent('pipeline.upserted')
  async handlePipelineUpserted(payload: { projectId: string; runId: string; status: string }) {
    const rules = await this.alertsService.findEnabledRulesByType('pipeline_status');
    for (const rule of rules) {
      const cond = rule.condition;
      if (!cond?.pipelineStatus) continue;
      if (payload.status !== cond.pipelineStatus) continue;
      await this.fireAlert({
        ruleId: String(rule._id),
        ruleName: rule.name,
        channels: rule.channels as unknown as AlertChannel[],
        summary: `Pipeline run ${payload.runId} reached status "${payload.status}"`,
        projectId: payload.projectId,
      });
    }
  }

  @OnEvent('deployment.upserted')
  async handleDeploymentUpserted(payload: { projectId: string; platform: string; status: string }) {
    const rules = await this.alertsService.findEnabledRulesByType('deployment_status');
    for (const rule of rules) {
      const cond = rule.condition;
      if (!cond?.deploymentStatus) continue;
      if (payload.status !== cond.deploymentStatus) continue;
      await this.fireAlert({
        ruleId: String(rule._id),
        ruleName: rule.name,
        channels: rule.channels as unknown as AlertChannel[],
        summary: `Deployment on ${payload.platform} reached status "${payload.status}"`,
        projectId: payload.projectId,
      });
    }
  }

  private async evaluate(): Promise<void> {
    try {
      await this.evaluateMetricThresholds();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Alert evaluation error: ${msg}`);
    }
  }

  private async evaluateMetricThresholds(): Promise<void> {
    const rules = await this.alertsService.findEnabledRulesByType('metric_threshold');
    for (const rule of rules) {
      const team = rule.teamId.toString();
      const servers = await this.serversService.findByTeam(team);
      for (const server of servers) {
        const sid = String(server._id);
        const cond = rule.condition;
        if (!cond || !cond.metric || !cond.operator || cond.threshold == null) continue;

        const mins = Math.ceil((cond.durationSeconds || 60) / 60);
        const metrics = await this.metricsService.getRecent(sid, mins);
        if (!metrics.length) continue;

        const values = metrics.map((m) => Number((m as any)[cond.metric!]));
        const breached =
          cond.operator === 'gt'
            ? values.every((v) => v > cond.threshold!)
            : values.every((v) => v < cond.threshold!);

        if (breached) {
          const avg = (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1);
          await this.fireAlert({
            ruleId: String(rule._id),
            ruleName: rule.name,
            channels: rule.channels as unknown as AlertChannel[],
            summary: `Server "${server.name}": ${cond.metric.toUpperCase()} is ${avg}% (${cond.operator === 'gt' ? '>' : '<'} ${cond.threshold}% for ${cond.durationSeconds}s)`,
            serverId: sid,
          });
        }
      }
    }
  }
}
