import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, paginationSkip, type ListAggregates, type PaginationMeta } from '@devorbit/types';
import { PipelineRun } from './pipeline.schema';
import { ProjectsService } from '../projects/projects.service';

export type PipelineRecentTeamPayload = {
  data: PipelineRun[];
  meta: PaginationMeta;
  aggregates?: ListAggregates;
};

@Injectable()
export class PipelinesService {
  constructor(
    @InjectModel(PipelineRun.name) private pipelineModel: Model<PipelineRun>,
    private projectsService: ProjectsService,
  ) {}

  async upsertRun(data: Partial<PipelineRun>): Promise<PipelineRun> {
    return this.pipelineModel.findOneAndUpdate(
      { projectId: data.projectId, runId: data.runId, provider: data.provider },
      data,
      { upsert: true, new: true },
    );
  }

  async findByProject(projectId: string, limit = 20): Promise<PipelineRun[]> {
    return this.pipelineModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('projectId', 'name repoOwner repoName repoProvider')
      .exec();
  }

  private teamProjectsFilter(projectIds: string[]) {
    return { projectId: { $in: projectIds.map((id) => new Types.ObjectId(id)) } };
  }

  private async aggregateStatusCounts(filter: Record<string, unknown>): Promise<Record<string, number>> {
    const rows = await this.pipelineModel
      .aggregate<{ _id: string | null; c: number }>([{ $match: filter }, { $group: { _id: '$status', c: { $sum: 1 } } }])
      .exec();
    const out: Record<string, number> = {};
    for (const r of rows) {
      out[String(r._id ?? 'unknown')] = r.c;
    }
    return out;
  }

  /**
   * Paginated recent runs for a team (optionally scoped to one project).
   * `projectId` must already be validated against the team when provided.
   */
  async findRecentByTeamPaginated(
    teamId: string,
    page: number,
    limit: number,
    opts?: { projectId?: string; statusCounts?: boolean },
  ): Promise<PipelineRecentTeamPayload> {
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
    const total = await this.pipelineModel.countDocuments(filter).exec();
    const meta = buildPaginationMeta(page, limit, total);
    const skip = paginationSkip(meta);

    const data = await this.pipelineModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(meta.pageSize)
      .populate('projectId', 'name repoOwner repoName repoProvider')
      .exec();

    let aggregates: ListAggregates | undefined;
    if (opts?.statusCounts) {
      aggregates = { statusCounts: await this.aggregateStatusCounts(filter) };
    }

    return { data, meta, aggregates };
  }
}
