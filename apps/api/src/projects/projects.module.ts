import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './project.schema';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PipelineRun, PipelineRunSchema } from '../pipelines/pipeline.schema';
import { Deployment, DeploymentSchema } from '../deployments/deployment.schema';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: PipelineRun.name, schema: PipelineRunSchema },
      { name: Deployment.name, schema: DeploymentSchema },
    ]),
    TeamsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
