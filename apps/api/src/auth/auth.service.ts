import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { TeamsService } from '../teams/teams.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private organizationsService: OrganizationsService,
    private teamsService: TeamsService,
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

  async registerWithOrganization(dto: RegisterDto) {
    const user = await this.usersService.createEmailUser({
      email: dto.email,
      password: dto.password,
      name: (dto.displayName || dto.email.split('@')[0]).trim(),
    });
    const org = await this.organizationsService.createWithSuperAdmin(
      String(user._id),
      dto.organizationName.trim(),
    );
    await this.teamsService.createInOrganization('Default', String(user._id), String(org._id));
    return user;
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
