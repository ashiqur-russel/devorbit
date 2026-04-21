import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
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

  signToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
