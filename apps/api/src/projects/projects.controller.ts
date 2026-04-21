import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('team/:teamId')
  findByTeam(@Param('teamId') teamId: string) {
    return this.projectsService.findByTeam(teamId);
  }

  @Post()
  create(
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
  ) {
    return this.projectsService.create({
      ...body,
      teamId: new Types.ObjectId(body.teamId),
    });
  }
}
