import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  /** Public: read organization/team names for the invite (used by register screen). */
  @Get('preview/:token')
  @ApiOperation({ summary: 'Preview invite (no auth)' })
  preview(@Param('token') token: string) {
    return this.invitations.getPreviewByToken(token);
  }
}
