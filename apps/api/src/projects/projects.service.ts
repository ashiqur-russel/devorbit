import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './project.schema';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<Project>) {}

  async create(data: Partial<Project>): Promise<Project> {
    return this.projectModel.create(data as any);
  }

  async findByTeam(teamId: string): Promise<Project[]> {
    return this.projectModel.find({ teamId: new Types.ObjectId(teamId) });
  }

  async findAllWithRepo(provider: 'GITHUB' | 'GITLAB'): Promise<Project[]> {
    return this.projectModel.find({
      repoProvider: provider,
      repoOwner: { $exists: true, $ne: '' },
      repoName: { $exists: true, $ne: '' },
    });
  }

  async findAllWithVercel(): Promise<Project[]> {
    return this.projectModel.find({ vercelProjectId: { $exists: true, $ne: '' } });
  }

  async remove(projectId: string): Promise<{ ok: true }> {
    const res = await this.projectModel.deleteOne({ _id: new Types.ObjectId(projectId) });
    if (!res.deletedCount) throw new NotFoundException('Project not found');
    return { ok: true };
  }
}
