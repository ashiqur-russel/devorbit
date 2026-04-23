import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { PipelinesService } from './pipelines.service';
import { TeamsService } from '../teams/teams.service';
import { ProjectsService } from '../projects/projects.service';
import { TeamRecentQueryDto } from '../common/dto/team-recent-query.dto';
import { normalizeTeamRecentQuery } from '../common/dto/team-recent-query.util';

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
    @Query() query: TeamRecentQueryDto,
  ) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), teamId);
    const q = normalizeTeamRecentQuery(query);
    if (q.projectId) {
      await this.projectsService.assertProjectBelongsToTeam(q.projectId, teamId);
    }
    return this.pipelinesService.findRecentByTeamPaginated(teamId, q.page, q.limit, {
      projectId: q.projectId,
      statusCounts: q.statusCounts,
    });
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.projectsService.assertCanAccessProject(req.user._id.toString(), projectId);
    return this.pipelinesService.findByProject(projectId);
  }
}
