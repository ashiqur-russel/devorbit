import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('team/:teamId')
  findByTeam(@Param('teamId') teamId: string) {
    return this.integrationsService.findByTeam(teamId);
  }

  @Post()
  upsert(
    @Body()
    body: {
      teamId: string;
      provider: string;
      token: string;
      meta?: Record<string, string>;
    },
  ) {
    return this.integrationsService.upsert(body.teamId, body.provider, body.token, body.meta);
  }

  @Delete(':teamId/:provider')
  remove(@Param('teamId') teamId: string, @Param('provider') provider: string) {
    return this.integrationsService.remove(teamId, provider);
  }
}
