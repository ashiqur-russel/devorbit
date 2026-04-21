import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeploymentsService } from './deployments.service';

@Controller('deployments')
@UseGuards(AuthGuard('jwt'))
export class DeploymentsController {
  constructor(private deploymentsService: DeploymentsService) {}

  @Get('recent')
  findAll(@Query('limit') limit?: string) {
    return this.deploymentsService.findAll(limit ? parseInt(limit) : 50);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.deploymentsService.findByProject(projectId);
  }
}
