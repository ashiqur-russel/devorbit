import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PipelinesService } from './pipelines.service';

@Controller('pipelines')
@UseGuards(AuthGuard('jwt'))
export class PipelinesController {
  constructor(private pipelinesService: PipelinesService) {}

  @Get('team/:teamId/recent')
  findRecentByTeam(@Param('teamId') teamId: string, @Query('limit') limit?: string) {
    return this.pipelinesService.findRecentByTeam(teamId, limit ? parseInt(limit, 10) : 50);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.pipelinesService.findByProject(projectId);
  }
}
