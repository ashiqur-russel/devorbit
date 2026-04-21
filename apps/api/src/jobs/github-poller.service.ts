import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { ProjectsService } from '../projects/projects.service';
import { PipelinesService } from '../pipelines/pipelines.service';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class GithubPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GithubPollerService.name);
  private timer: NodeJS.Timeout;

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly projectsService: ProjectsService,
    private readonly pipelinesService: PipelinesService,
  ) {}

  onModuleInit() {
    this.poll();
    this.timer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  private async poll() {
    const integrations = await this.integrationsService.findAllByProvider('GITHUB');
    for (const integration of integrations) {
      const allProjects = await this.projectsService.findAllWithRepo('GITHUB');
      const teamProjects = allProjects.filter(
        (p) => p.teamId.toString() === integration.teamId.toString(),
      );
      for (const project of teamProjects) {
        await this.fetchRuns(project, integration.token);
      }
    }
  }

  private async fetchRuns(project: any, token: string) {
    try {
      const url = `https://api.github.com/repos/${project.repoOwner}/${project.repoName}/actions/runs?per_page=20`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (!res.ok) {
        this.logger.warn(`GitHub API ${res.status} for ${project.repoOwner}/${project.repoName}`);
        return;
      }
      const data = (await res.json()) as { workflow_runs: any[] };
      for (const run of data.workflow_runs) {
        await this.pipelinesService.upsertRun({
          projectId: project._id,
          provider: 'GITHUB',
          runId: String(run.id),
          branch: run.head_branch,
          workflowName: run.name,
          status: this.mapStatus(run.conclusion ?? run.status),
          duration:
            run.updated_at && run.run_started_at
              ? Math.floor(
                  (new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime()) /
                    1000,
                )
              : 0,
          triggeredBy: run.triggering_actor?.login,
          startedAt: run.run_started_at ? new Date(run.run_started_at) : undefined,
          finishedAt: run.updated_at ? new Date(run.updated_at) : undefined,
        });
      }
    } catch (err) {
      this.logger.error(`GitHub poll failed for ${project.repoOwner}/${project.repoName}`, err);
    }
  }

  private mapStatus(raw: string): string {
    const map: Record<string, string> = {
      success: 'success',
      failure: 'failure',
      cancelled: 'cancelled',
      in_progress: 'running',
      queued: 'pending',
      waiting: 'pending',
      completed: 'success',
    };
    return map[raw] ?? 'pending';
  }
}
