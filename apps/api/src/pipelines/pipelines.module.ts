import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';
import { PipelineRun, PipelineRunSchema } from './pipeline.schema';
import { ProjectsModule } from '../projects/projects.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PipelineRun.name, schema: PipelineRunSchema }]),
    ProjectsModule,
    TeamsModule,
  ],
  providers: [PipelinesService],
  controllers: [PipelinesController],
  exports: [PipelinesService],
})
export class PipelinesModule {}
