import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(AuthGuard('jwt'))
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  create(@Body('name') name: string, @Req() req) {
    return this.teamsService.create(name, req.user._id.toString());
  }

  @Get()
  findMine(@Req() req) {
    return this.teamsService.findByMember(req.user._id.toString());
  }
}
