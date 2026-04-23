import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { IntegrationsService } from './integrations.service';
import { TeamsService } from '../teams/teams.service';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly teamsService: TeamsService,
  ) {}

  @Get('team/:teamId')
  async findByTeam(@Param('teamId') teamId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), teamId);
    return this.integrationsService.findByTeam(teamId);
  }

  @Post()
  async upsert(
    @Body()
    body: {
      teamId: string;
      provider: string;
      token: string;
      meta?: Record<string, string>;
    },
    @Req() req: { user: { _id: Types.ObjectId } },
  ) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), body.teamId);
    return this.integrationsService.upsert(body.teamId, body.provider, body.token, body.meta);
  }

  @Delete(':teamId/:provider')
  async remove(
    @Param('teamId') teamId: string,
    @Param('provider') provider: string,
    @Req() req: { user: { _id: Types.ObjectId } },
  ) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), teamId);
    return this.integrationsService.remove(teamId, provider);
  }
}
