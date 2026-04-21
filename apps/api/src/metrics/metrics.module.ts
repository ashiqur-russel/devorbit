import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { ServerMetric, ServerMetricSchema } from './metric.schema';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ServerMetric.name, schema: ServerMetricSchema }]),
    ServersModule,
  ],
  providers: [MetricsService],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}
