import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ProjectsService } from './projects.service';
import { TeamsService } from '../teams/teams.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly teamsService: TeamsService,
  ) {}

  @Get('team/:teamId')
  async findByTeam(@Param('teamId') teamId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), teamId);
    return this.projectsService.findByTeam(teamId);
  }

  @Post()
  async create(
    @Body()
    body: {
      teamId: string;
      name: string;
      description?: string;
      repoOwner?: string;
      repoName?: string;
      repoProvider?: string;
      vercelProjectId?: string;
    },
    @Req() req: { user: { _id: Types.ObjectId } },
  ) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), body.teamId);
    return this.projectsService.create({
      ...body,
      teamId: new Types.ObjectId(body.teamId),
    });
  }

  @Patch(':projectId')
  async update(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      repoOwner?: string;
      repoName?: string;
      repoProvider?: string;
      vercelProjectId?: string;
    },
    @Req() req: { user: { _id: Types.ObjectId } },
  ) {
    await this.projectsService.assertCanAccessProject(req.user._id.toString(), projectId);
    return this.projectsService.update(projectId, body);
  }

  @Delete(':projectId')
  async remove(
    @Param('projectId') projectId: string,
    @Req() req: { user: { _id: Types.ObjectId } },
    @Query('cascade') cascade?: string,
  ) {
    const proj = await this.projectsService.findAnyById(projectId);
    if (!proj) return this.projectsService.remove(projectId, { cascade: false });
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), proj.teamId.toString());
    const doCascade = cascade === '1' || cascade === 'true';
    return this.projectsService.remove(projectId, { cascade: doCascade });
  }
}
