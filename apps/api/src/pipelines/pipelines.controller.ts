import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { PipelinesService } from './pipelines.service';
import { TeamsService } from '../teams/teams.service';
import { ProjectsService } from '../projects/projects.service';

@Controller('pipelines')
@UseGuards(AuthGuard('jwt'))
export class PipelinesController {
  constructor(
    private pipelinesService: PipelinesService,
    private teamsService: TeamsService,
    private projectsService: ProjectsService,
  ) {}

  @Get('team/:teamId/recent')
  async findRecentByTeam(
    @Param('teamId') teamId: string,
    @Req() req: { user: { _id: Types.ObjectId } },
    @Query('limit') limit?: string,
  ) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), teamId);
    return this.pipelinesService.findRecentByTeam(teamId, limit ? parseInt(limit, 10) : 50);
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.projectsService.assertCanAccessProject(req.user._id.toString(), projectId);
    return this.pipelinesService.findByProject(projectId);
  }
}
