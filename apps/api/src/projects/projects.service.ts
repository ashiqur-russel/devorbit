import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './project.schema';
import { PipelineRun } from '../pipelines/pipeline.schema';
import { Deployment } from '../deployments/deployment.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(PipelineRun.name) private pipelineModel: Model<PipelineRun>,
    @InjectModel(Deployment.name) private deploymentModel: Model<Deployment>,
  ) {}

  async create(data: Partial<Project>): Promise<Project> {
    return this.projectModel.create(data as any);
  }

  async findByTeam(teamId: string): Promise<Project[]> {
    return this.projectModel.find({ teamId: new Types.ObjectId(teamId), deletedAt: { $exists: false } });
  }

  async findAllWithRepo(provider: 'GITHUB' | 'GITLAB'): Promise<Project[]> {
    return this.projectModel.find({
      deletedAt: { $exists: false },
      repoProvider: provider,
      repoOwner: { $exists: true, $ne: '' },
      repoName: { $exists: true, $ne: '' },
    });
  }

  async findAllWithVercel(): Promise<Project[]> {
    return this.projectModel.find({ deletedAt: { $exists: false }, vercelProjectId: { $exists: true, $ne: '' } });
  }

  async remove(projectId: string, opts?: { cascade?: boolean }): Promise<{ ok: true }> {
    const id = new Types.ObjectId(projectId);
    const cascade = Boolean(opts?.cascade);

    const exists = await this.projectModel.exists({ _id: id });
    if (!exists) throw new NotFoundException('Project not found');

    if (cascade) {
      await Promise.all([
        this.pipelineModel.deleteMany({ projectId: id }),
        this.deploymentModel.deleteMany({ projectId: id }),
      ]);
      await this.projectModel.deleteOne({ _id: id });
      return { ok: true };
    }

    await this.projectModel.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
    return { ok: true };
  }
}
