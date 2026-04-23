import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeploymentsService } from './deployments.service';

@Controller('deployments')
@UseGuards(AuthGuard('jwt'))
export class DeploymentsController {
  constructor(private deploymentsService: DeploymentsService) {}

  @Get('team/:teamId/recent')
  findRecentByTeam(@Param('teamId') teamId: string, @Query('limit') limit?: string) {
    return this.deploymentsService.findRecentByTeam(teamId, limit ? parseInt(limit, 10) : 50);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.deploymentsService.findByProject(projectId);
  }
}
