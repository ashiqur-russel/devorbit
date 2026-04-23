import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { ServerMetric, ServerMetricSchema } from './metric.schema';
import { ProcessSnapshot, ProcessSnapshotSchema } from './process-snapshot.schema';
import { DockerMetric, DockerMetricSchema } from './docker-metric.schema';
import { ServersModule } from '../servers/servers.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServerMetric.name, schema: ServerMetricSchema },
      { name: ProcessSnapshot.name, schema: ProcessSnapshotSchema },
      { name: DockerMetric.name, schema: DockerMetricSchema },
    ]),
    ServersModule,
    TeamsModule,
  ],
  providers: [MetricsService],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}
