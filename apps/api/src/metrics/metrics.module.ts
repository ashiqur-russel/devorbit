import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { ServerMetric, ServerMetricSchema } from './metric.schema';
import { ServersModule } from '../servers/servers.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ServerMetric.name, schema: ServerMetricSchema }]),
    ServersModule,
    TeamsModule,
  ],
  providers: [MetricsService],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}
