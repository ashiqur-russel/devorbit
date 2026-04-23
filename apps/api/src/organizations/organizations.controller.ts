import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Types } from 'mongoose';
import { OrganizationsService } from './organizations.service';

class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;
}

class AddTeamMemberDto {
  @IsEmail()
  email: string;
}

class PromoteAdminDto {
  @IsEmail()
  email: string;
}

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findMine(@Req() req: { user: { _id: Types.ObjectId } }) {
    return this.organizationsService.findMine(req.user._id.toString());
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto, @Req() req: { user: { _id: Types.ObjectId } }) {
    return this.organizationsService.createAdditional(req.user._id.toString(), dto.name);
  }

  @Post(':orgId/admins')
  promoteAdmin(@Param('orgId') orgId: string, @Body() dto: PromoteAdminDto, @Req() req: { user: { _id: Types.ObjectId } }) {
    return this.organizationsService.promoteToOrgAdmin(orgId, req.user._id.toString(), dto.email);
  }

  @Post(':orgId/teams/:teamId/members')
  addTeamMember(
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @Body() dto: AddTeamMemberDto,
    @Req() req: { user: { _id: Types.ObjectId } },
  ) {
    return this.organizationsService.addUserToTeam(orgId, teamId, req.user._id.toString(), dto.email);
  }
}
