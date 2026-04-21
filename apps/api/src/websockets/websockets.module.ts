import { Module } from '@nestjs/common';
import { MetricsGateway } from './metrics.gateway';
import { MetricsModule } from '../metrics/metrics.module';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [MetricsModule, ServersModule],
  providers: [MetricsGateway],
})
export class WebsocketsModule {}
