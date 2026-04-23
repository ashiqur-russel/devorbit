import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, paginationSkip, type ListAggregates, type PaginationMeta } from '@devorbit/types';
import { Deployment } from './deployment.schema';
import { ProjectsService } from '../projects/projects.service';

export type DeploymentRecentTeamPayload = {
  data: Deployment[];
  meta: PaginationMeta;
  aggregates?: ListAggregates;
};

@Injectable()
export class DeploymentsService {
  constructor(
    @InjectModel(Deployment.name) private deploymentModel: Model<Deployment>,
    private projectsService: ProjectsService,
  ) {}

  async create(data: Partial<Deployment>): Promise<Deployment> {
    return this.deploymentModel.create(data);
  }

  async findByProject(projectId: string): Promise<Deployment[]> {
    return this.deploymentModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ deployedAt: -1 })
      .populate('projectId', 'name repoOwner repoName repoProvider')
      .populate('serverId', 'name')
      .exec();
  }

  private teamProjectsFilter(projectIds: string[]) {
    return { projectId: { $in: projectIds.map((id) => new Types.ObjectId(id)) } };
  }

  private async aggregateStatusCounts(filter: Record<string, unknown>): Promise<Record<string, number>> {
    const rows = await this.deploymentModel
      .aggregate<{ _id: string | null; c: number }>([{ $match: filter }, { $group: { _id: '$status', c: { $sum: 1 } } }])
      .exec();
    const out: Record<string, number> = {};
    for (const r of rows) {
      out[String(r._id ?? 'unknown')] = r.c;
    }
    return out;
  }

  /**
   * Paginated recent deployments for a team (optionally scoped to one project).
   * `projectId` must already be validated against the team when provided.
   */
  async findRecentByTeamPaginated(
    teamId: string,
    page: number,
    limit: number,
    opts?: { projectId?: string; statusCounts?: boolean },
  ): Promise<DeploymentRecentTeamPayload> {
    const projects = await this.projectsService.findByTeam(teamId);
    let ids = projects.map((p) => p._id.toString());
    if (opts?.projectId) {
      ids = ids.includes(opts.projectId) ? [opts.projectId] : [];
    }
    if (!ids.length) {
      return {
        data: [],
        meta: buildPaginationMeta(page, limit, 0),
        aggregates: opts?.statusCounts ? { statusCounts: {} } : undefined,
      };
    }

    const filter = this.teamProjectsFilter(ids);
    const total = await this.deploymentModel.countDocuments(filter).exec();
    const meta = buildPaginationMeta(page, limit, total);
    const skip = paginationSkip(meta);

    const data = await this.deploymentModel
      .find(filter)
      .sort({ deployedAt: -1 })
      .skip(skip)
      .limit(meta.pageSize)
      .populate('projectId', 'name repoOwner repoName repoProvider')
      .populate('serverId', 'name')
      .exec();

    let aggregates: ListAggregates | undefined;
    if (opts?.statusCounts) {
      aggregates = { statusCounts: await this.aggregateStatusCounts(filter) };
    }

    return { data, meta, aggregates };
  }

  async upsert(data: Partial<Deployment>): Promise<Deployment> {
    const query: Record<string, unknown> = { projectId: data.projectId, platform: data.platform };
    if (data.externalId) query.externalId = data.externalId;
    else if (data.url) query.url = data.url;
    return this.deploymentModel.findOneAndUpdate(query, data, { upsert: true, new: true });
  }
}
