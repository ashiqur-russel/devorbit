import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';
import { Deployment, DeploymentSchema } from './deployment.schema';
import { ProjectsModule } from '../projects/projects.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Deployment.name, schema: DeploymentSchema }]),
    ProjectsModule,
    TeamsModule,
  ],
  providers: [DeploymentsService],
  controllers: [DeploymentsController],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
