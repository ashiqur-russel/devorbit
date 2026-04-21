import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PipelineRun } from './pipeline.schema';

@Injectable()
export class PipelinesService {
  constructor(@InjectModel(PipelineRun.name) private pipelineModel: Model<PipelineRun>) {}

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
      .limit(limit);
  }

  async findRecent(teamProjectIds: string[], limit = 50): Promise<PipelineRun[]> {
    const filter =
      teamProjectIds.length > 0
        ? { projectId: { $in: teamProjectIds.map((id) => new Types.ObjectId(id)) } }
        : {};
    return this.pipelineModel.find(filter).sort({ createdAt: -1 }).limit(limit);
  }
}
