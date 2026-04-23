import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { TeamsService } from '../teams/teams.service';
import { InvitationsService } from '../invitations/invitations.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private organizationsService: OrganizationsService,
    private teamsService: TeamsService,
    private invitationsService: InvitationsService,
    private jwtService: JwtService,
  ) {}

  async validateGithubUser(profile: {
    githubId: string;
    name: string;
    email: string;
    avatar: string;
  }) {
    return this.usersService.findOrCreate(profile);
  }

  async validateGoogleUser(profile: {
    googleId: string;
    name: string;
    email: string;
    avatar: string;
  }) {
    return this.usersService.findOrCreateGoogle(profile);
  }

  async validateSamlUser(profile: { samlNameId: string; email: string; name: string }) {
    return this.usersService.findOrCreateSaml(profile);
  }

  async registerWithOrganization(dto: RegisterDto): Promise<{ user: User; organizationId: string }> {
    const name = (dto.displayName || dto.email.split('@')[0]).trim();
    const inviteTok = dto.inviteToken?.trim();

    if (inviteTok) {
      const inv = await this.invitationsService.validatePendingForRegistration(inviteTok, dto.email);
      const user = await this.usersService.createEmailUser({
        email: dto.email,
        password: dto.password,
        name,
      });
      await this.invitationsService.completeInviteForNewUser(String(inv._id), String(user._id));
      return { user, organizationId: String(inv.organizationId) };
    }

    const orgName = dto.organizationName?.trim();
    if (!orgName) {
      throw new BadRequestException('organizationName is required when not joining with an invite');
    }

    const user = await this.usersService.createEmailUser({
      email: dto.email,
      password: dto.password,
      name,
    });
    const org = await this.organizationsService.createWithSuperAdmin(String(user._id), orgName);
    await this.teamsService.createInOrganization('Default', String(user._id), String(org._id));
    return { user, organizationId: String(org._id) };
  }

  async loginWithEmail(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    const ok = await this.usersService.validatePassword(user, password);
    if (!ok) throw new UnauthorizedException('Invalid email or password');
    return user;
  }

  signToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
