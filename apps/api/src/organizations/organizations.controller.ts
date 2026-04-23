import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Types } from 'mongoose';
import { OrganizationsService } from './organizations.service';
import { InvitationsService } from '../invitations/invitations.service';

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

class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  teamId?: string;
}

class SetAdminCapabilitiesDto {
  @IsEmail()
  email: string;

  @IsBoolean()
  canCreateTeams: boolean;

  @IsBoolean()
  canInstallAgent: boolean;
}

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly invitationsService: InvitationsService,
  ) {}

  /** Current user: whether they may create teams / register agents (for UI and bootstrap). */
  @Get('me/provisioning')
  myProvisioning(@Req() req: { user: { _id: Types.ObjectId } }) {
    return this.organizationsService.getMyProvisioningCapabilities(req.user._id.toString());
  }

  @Get(':orgId/dashboard')
  orgDashboard(@Param('orgId') orgId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    return this.organizationsService.getDashboard(orgId, req.user._id.toString());
  }

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

  @Post(':orgId/admin-capabilities')
  setAdminCapabilities(
    @Param('orgId') orgId: string,
    @Body() dto: SetAdminCapabilitiesDto,
    @Req() req: { user: { _id: Types.ObjectId } },
  ) {
    return this.organizationsService.setAdminCapabilities(orgId, req.user._id.toString(), dto);
  }

  @Post(':orgId/invites')
  createInvite(
    @Param('orgId') orgId: string,
    @Body() dto: CreateInviteDto,
    @Req() req: { user: { _id: Types.ObjectId } },
  ) {
    return this.invitationsService.createInvite({
      organizationId: orgId,
      actorUserId: req.user._id.toString(),
      email: dto.email,
      teamId: dto.teamId,
    });
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
