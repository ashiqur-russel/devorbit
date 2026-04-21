import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Deployment } from './deployment.schema';

@Injectable()
export class DeploymentsService {
  constructor(@InjectModel(Deployment.name) private deploymentModel: Model<Deployment>) {}

  async create(data: Partial<Deployment>): Promise<Deployment> {
    return this.deploymentModel.create(data);
  }

  async findByProject(projectId: string): Promise<Deployment[]> {
    return this.deploymentModel.find({ projectId: new Types.ObjectId(projectId) }).sort({ deployedAt: -1 });
  }

  async findRecent(projectIds: string[], limit = 20): Promise<Deployment[]> {
    return this.deploymentModel
      .find({ projectId: { $in: projectIds.map((id) => new Types.ObjectId(id)) } })
      .sort({ deployedAt: -1 })
      .limit(limit);
  }

  async findAll(limit = 50): Promise<Deployment[]> {
    return this.deploymentModel.find().sort({ deployedAt: -1 }).limit(limit);
  }

  async upsert(data: Partial<Deployment>): Promise<Deployment> {
    return this.deploymentModel.findOneAndUpdate(
      { projectId: data.projectId, platform: data.platform, url: data.url },
      data,
      { upsert: true, new: true },
    );
  }
}
