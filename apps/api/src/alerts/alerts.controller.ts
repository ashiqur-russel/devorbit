import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';
import { AlertsService } from './alerts.service';
import { TeamsService } from '../teams/teams.service';

class CreateRuleDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() teamId: string;
  @IsEnum(['metric_threshold', 'pipeline_status', 'deployment_status', 'agent_offline']) type: string;
  @IsOptional() condition?: {
    metric?: string;
    operator?: string;
    threshold?: number;
    durationSeconds?: number;
    pipelineStatus?: string;
    deploymentStatus?: string;
  };
  @IsOptional() @IsArray() channels?: string[];
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsNumber() @Min(1) cooldownMinutes?: number;
}

class UpdateRuleDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() condition?: any;
  @IsOptional() @IsArray() channels?: string[];
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsNumber() @Min(1) cooldownMinutes?: number;
}

class CreateChannelDto {
  @IsString() @IsNotEmpty() teamId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsEnum(['email', 'slack_webhook', 'webhook']) type: string;
  @IsOptional() config?: { url?: string; emails?: string[]; slackWebhookUrl?: string };
}

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly teamsService: TeamsService,
  ) {}

  // Rules
  @Post('rules')
  async createRule(@Body() dto: CreateRuleDto, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), dto.teamId);
    return this.alertsService.createRule({
      teamId: new Types.ObjectId(dto.teamId) as any,
      name: dto.name,
      type: dto.type,
      condition: dto.condition as any,
      channels: (dto.channels ?? []).map((id) => new Types.ObjectId(id)) as any,
      enabled: dto.enabled ?? true,
      cooldownMinutes: dto.cooldownMinutes ?? 15,
    });
  }

  @Get('rules')
  async listRules(@Query('teamId') teamId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), teamId);
    return this.alertsService.findRulesByTeam(teamId);
  }

  @Patch('rules/:id')
  updateRule(@Param('id') id: string, @Body() dto: UpdateRuleDto) {
    return this.alertsService.updateRule(id, dto as any);
  }

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.alertsService.deleteRule(id);
  }

  // Channels
  @Post('channels')
  async createChannel(@Body() dto: CreateChannelDto, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), dto.teamId);
    return this.alertsService.createChannel({
      teamId: new Types.ObjectId(dto.teamId) as any,
      name: dto.name,
      type: dto.type,
      config: dto.config as any,
    });
  }

  @Get('channels')
  async listChannels(@Query('teamId') teamId: string, @Req() req: { user: { _id: Types.ObjectId } }) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), teamId);
    return this.alertsService.findChannelsByTeam(teamId);
  }

  @Delete('channels/:id')
  deleteChannel(@Param('id') id: string) {
    return this.alertsService.deleteChannel(id);
  }

  // Incidents
  @Get('incidents')
  async listIncidents(
    @Query('teamId') teamId: string,
    @Query('status') status: string | undefined,
    @Req() req: { user: { _id: Types.ObjectId } },
  ) {
    await this.teamsService.assertCanAccessTeam(req.user._id.toString(), teamId);
    return this.alertsService.findIncidentsByTeam(teamId, status);
  }

  @Post('incidents/:id/resolve')
  resolveIncident(@Param('id') id: string) {
    return this.alertsService.resolveIncident(id);
  }
}
