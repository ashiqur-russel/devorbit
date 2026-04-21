import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@UseGuards(AuthGuard('jwt'))
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get(':serverId')
  getRecent(@Param('serverId') serverId: string, @Query('minutes') minutes?: string) {
    return this.metricsService.getRecent(serverId, minutes ? parseInt(minutes) : 15);
  }

  @Get(':serverId/latest')
  getLatest(@Param('serverId') serverId: string) {
    return this.metricsService.getLatest(serverId);
  }
}
