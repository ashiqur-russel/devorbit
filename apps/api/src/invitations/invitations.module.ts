import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invitation, InvitationSchema } from './invitation.schema';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { Organization, OrganizationSchema } from '../organizations/organization.schema';
import { Team, TeamSchema } from '../teams/team.schema';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invitation.name, schema: InvitationSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
    UsersModule,
    MailModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
