import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ProjectsModule } from '../projects/projects.module';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { DeploymentsModule } from '../deployments/deployments.module';
import { GithubPollerService } from './github-poller.service';
import { VercelPollerService } from './vercel-poller.service';

@Module({
  imports: [IntegrationsModule, ProjectsModule, PipelinesModule, DeploymentsModule],
  providers: [GithubPollerService, VercelPollerService],
})
export class JobsModule {}
