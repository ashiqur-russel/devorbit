import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PipelineRun } from './pipeline.schema';
import { ProjectsService } from '../projects/projects.service';

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

  async findRecent(teamProjectIds: string[], limit = 50): Promise<PipelineRun[]> {
    if (!teamProjectIds.length) return [];
    return this.pipelineModel
      .find({ projectId: { $in: teamProjectIds.map((id) => new Types.ObjectId(id)) } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('projectId', 'name repoOwner repoName repoProvider')
      .exec();
  }

  async findRecentByTeam(teamId: string, limit = 50): Promise<PipelineRun[]> {
    const projects = await this.projectsService.findByTeam(teamId);
    const ids = projects.map((p) => p._id.toString());
    return this.findRecent(ids, limit);
  }
}
