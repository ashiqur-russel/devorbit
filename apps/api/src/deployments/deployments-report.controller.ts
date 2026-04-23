import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import { Types } from 'mongoose';
import { DeploymentsService } from './deployments.service';
import { ProjectsService } from '../projects/projects.service';

@Controller('deployments')
export class DeploymentsReportController {
  constructor(
    private readonly deploymentsService: DeploymentsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post('report')
  async report(
    @Headers('x-devorbit-deploy-token') token: string | undefined,
    @Body()
    body: {
      projectId: string;
      platform?: 'OVH' | 'AWS' | 'DIGITALOCEAN' | 'CUSTOM' | 'VERCEL';
      status?: 'success' | 'failure' | 'building' | 'cancelled';
      environment?: 'production' | 'preview' | 'staging';
      url?: string;
      externalId?: string;
      branch?: string;
      commitSha?: string;
      commitMessage?: string;
      deployedAt?: string;
      serverId?: string;
    },
  ) {
    if (!token) throw new BadRequestException('Missing deploy token header');
    if (!body?.projectId) throw new BadRequestException('Missing projectId');
    if (!Types.ObjectId.isValid(body.projectId)) throw new BadRequestException('Invalid projectId');
    if (body.serverId && !Types.ObjectId.isValid(body.serverId)) throw new BadRequestException('Invalid serverId');

    const project = await this.projectsService.verifyDeployToken(body.projectId, token);

    const deployedAt = body.deployedAt ? new Date(body.deployedAt) : new Date();
    if (Number.isNaN(deployedAt.getTime())) throw new BadRequestException('Invalid deployedAt');

    const platform = body.platform || 'CUSTOM';
    const status = body.status || 'success';

    const dep = await this.deploymentsService.upsert({
      projectId: project._id,
      platform,
      status,
      environment: body.environment,
      url: body.url,
      externalId: body.externalId,
      branch: body.branch,
      commitSha: body.commitSha,
      commitMessage: body.commitMessage,
      deployedAt,
      serverId: body.serverId ? new Types.ObjectId(body.serverId) : undefined,
    });

    return { ok: true, deploymentId: dep._id.toString() };
  }
}

