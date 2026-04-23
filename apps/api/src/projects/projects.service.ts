import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './project.schema';
import { PipelineRun } from '../pipelines/pipeline.schema';
import { Deployment } from '../deployments/deployment.schema';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(PipelineRun.name) private pipelineModel: Model<PipelineRun>,
    @InjectModel(Deployment.name) private deploymentModel: Model<Deployment>,
    private teamsService: TeamsService,
  ) {}

  async create(data: Partial<Project>): Promise<Project> {
    return this.projectModel.create(data as unknown as Project);
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

  async update(
    projectId: string,
    patch: Partial<Pick<Project, 'name' | 'description' | 'repoOwner' | 'repoName' | 'repoProvider' | 'vercelProjectId'>>,
  ): Promise<Project> {
    const id = new Types.ObjectId(projectId);

    // Don't allow updating archived projects
    const updated = await this.projectModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { $set: patch },
        { new: true },
      )
      .exec();

    if (!updated) throw new NotFoundException('Project not found');
    return updated;
  }

  async findActiveById(projectId: string): Promise<Project | null> {
    return this.projectModel.findOne({ _id: new Types.ObjectId(projectId), deletedAt: { $exists: false } }).exec();
  }

  async findAnyById(projectId: string): Promise<Project | null> {
    return this.projectModel.findById(new Types.ObjectId(projectId)).exec();
  }

  async assertCanAccessProject(userId: string, projectId: string): Promise<Project> {
    const proj = await this.findActiveById(projectId);
    if (!proj) throw new NotFoundException('Project not found');
    await this.teamsService.assertCanAccessTeam(userId, proj.teamId.toString());
    return proj;
  }

  async remove(projectId: string, opts?: { cascade?: boolean }): Promise<{ ok: true }> {
    const id = new Types.ObjectId(projectId);
    const cascade = Boolean(opts?.cascade);

    const exists = await this.projectModel.findById(id);
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
