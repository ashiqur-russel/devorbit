import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Deployment } from './deployment.schema';
import { ProjectsService } from '../projects/projects.service';

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

  async findRecent(projectIds: string[], limit = 50): Promise<Deployment[]> {
    if (!projectIds.length) return [];
    return this.deploymentModel
      .find({ projectId: { $in: projectIds.map((id) => new Types.ObjectId(id)) } })
      .sort({ deployedAt: -1 })
      .limit(limit)
      .populate('projectId', 'name repoOwner repoName repoProvider')
      .populate('serverId', 'name')
      .exec();
  }

  async findRecentByTeam(teamId: string, limit = 50): Promise<Deployment[]> {
    const projects = await this.projectsService.findByTeam(teamId);
    const ids = projects.map((p) => p._id.toString());
    return this.findRecent(ids, limit);
  }

  async upsert(data: Partial<Deployment>): Promise<Deployment> {
    return this.deploymentModel.findOneAndUpdate(
      { projectId: data.projectId, platform: data.platform, url: data.url },
      data,
      { upsert: true, new: true },
    );
  }
}
