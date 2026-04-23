import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { MetricsService } from './metrics.service';
import { ServersService } from '../servers/servers.service';
import { TeamsService } from '../teams/teams.service';

@Controller('metrics')
@UseGuards(AuthGuard('jwt'))
export class MetricsController {
  constructor(
    private metricsService: MetricsService,
    private serversService: ServersService,
    private teamsService: TeamsService,
  ) {}

  @Get(':serverId')
  async getRecent(
    @Param('serverId') serverId: string,
    @Req() req: { user: { _id: Types.ObjectId } },
    @Query('minutes') minutes?: string,
  ) {
    const server = await this.serversService.findById(serverId);
    if (server) await this.teamsService.assertCanAccessTeam(req.user._id.toString(), String(server.teamId));
    return this.metricsService.getRecent(serverId, minutes ? parseInt(minutes) : 15);
  }

  @Get(':serverId/latest')
  async getLatest(@Param('serverId') serverId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    const server = await this.serversService.findById(serverId);
    if (server) await this.teamsService.assertCanAccessTeam(req.user._id.toString(), String(server.teamId));
    return this.metricsService.getLatest(serverId);
  }
}
