import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PipelinesService } from './pipelines.service';

@Controller('pipelines')
@UseGuards(AuthGuard('jwt'))
export class PipelinesController {
  constructor(private pipelinesService: PipelinesService) {}

  @Get('recent')
  findRecent(@Query('limit') limit?: string) {
    return this.pipelinesService.findRecent([], limit ? parseInt(limit) : 50);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.pipelinesService.findByProject(projectId);
  }
}
