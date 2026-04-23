import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { DeploymentsService } from './deployments.service';
import { TeamsService } from '../teams/teams.service';
import { ProjectsService } from '../projects/projects.service';

@Controller('deployments')
@UseGuards(AuthGuard('jwt'))
export class DeploymentsController {
  constructor(
    private deploymentsService: DeploymentsService,
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
    return this.deploymentsService.findRecentByTeam(teamId, limit ? parseInt(limit, 10) : 50);
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.projectsService.assertCanAccessProject(req.user._id.toString(), projectId);
    return this.deploymentsService.findByProject(projectId);
  }
}
