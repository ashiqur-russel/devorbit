import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { ServersService } from './servers.service';
import { TeamsService } from '../teams/teams.service';

@Controller('servers')
@UseGuards(AuthGuard('jwt'))
export class ServersController {
  constructor(
    private serversService: ServersService,
    private teamsService: TeamsService,
  ) {}

  @Post()
  register(@Body() body: { teamId: string; name: string }, @Req() req: { user: { _id: Types.ObjectId } }) {
    return this.serversService.register(body.teamId, body.name, req.user._id.toString());
  }

  @Get('team/:teamId')
  async findByTeam(@Param('teamId') teamId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), teamId);
    return this.serversService.findByTeam(teamId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    const server = await this.serversService.findById(id);
    if (!server) throw new NotFoundException('Server not found');
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), String(server.teamId));
    return server;
  }
}
