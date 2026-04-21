import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServersService } from './servers.service';

@Controller('servers')
@UseGuards(AuthGuard('jwt'))
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Post()
  register(@Body() body: { teamId: string; name: string }) {
    return this.serversService.register(body.teamId, body.name);
  }

  @Get('team/:teamId')
  findByTeam(@Param('teamId') teamId: string) {
    return this.serversService.findByTeam(teamId);
  }
}
