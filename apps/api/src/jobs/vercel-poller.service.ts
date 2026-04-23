import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { ProjectsService } from '../projects/projects.service';
import { DeploymentsService } from '../deployments/deployments.service';
import { Types } from 'mongoose';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

type ProjectWithVercel = {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  vercelProjectId: string;
};

type VercelDeployment = {
  state?: string;
  url?: string;
  projectId?: string;
  createdAt?: number;
};

@Injectable()
export class VercelPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VercelPollerService.name);
  private timer: NodeJS.Timeout;

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly projectsService: ProjectsService,
    private readonly deploymentsService: DeploymentsService,
  ) {}

  onModuleInit() {
    this.poll();
    this.timer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  private async poll() {
    const integrations = await this.integrationsService.findAllByProvider('VERCEL');
    for (const integration of integrations) {
      await this.fetchDeployments(integration.teamId.toString(), integration.token);
    }
  }

  private async fetchDeployments(teamId: string, token: string) {
    try {
      const teamProjects = await this.projectsService.findAllWithVercel();
      const filtered = (teamProjects as ProjectWithVercel[]).filter((p) => p.teamId.toString() === teamId);
      if (!filtered.length) return;

      const res = await fetch('https://api.vercel.com/v6/deployments?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.logger.warn(`Vercel API ${res.status} for team ${teamId}`);
        return;
      }
      const data = (await res.json()) as { deployments?: VercelDeployment[] };
      for (const dep of data.deployments ?? []) {
        const project = filtered.find((p) => p.vercelProjectId === dep.projectId);
        if (!project) continue;
        await this.deploymentsService.upsert({
          projectId: project._id,
          platform: 'VERCEL',
          status: this.mapStatus(dep.state),
          url: dep.url ? `https://${dep.url}` : undefined,
          deployedAt: dep.createdAt ? new Date(dep.createdAt) : new Date(),
        });
      }
    } catch (err) {
      this.logger.error(`Vercel poll failed for team ${teamId}`, err);
    }
  }

  private mapStatus(state: string): string {
    const map: Record<string, string> = {
      READY: 'success',
      ERROR: 'failure',
      BUILDING: 'building',
      CANCELLED: 'cancelled',
    };
    return map[state] ?? 'building';
  }
}
