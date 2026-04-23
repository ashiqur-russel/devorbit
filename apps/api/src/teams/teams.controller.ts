import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { TeamsService } from './teams.service';

class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;
}

@Controller('teams')
@UseGuards(AuthGuard('jwt'))
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  create(@Body() dto: CreateTeamDto, @Req() req: { user: { _id: { toString: () => string } } }) {
    return this.teamsService.createInOrganization(dto.name, req.user._id.toString(), dto.organizationId);
  }

  @Get()
  findMine(@Req() req: { user: { _id: { toString: () => string } } }) {
    return this.teamsService.findByMember(req.user._id.toString());
  }
}
