import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOrCreate(profile: {
    githubId: string;
    name: string;
    email: string;
    avatar: string;
  }): Promise<User> {
    const existing = await this.userModel.findOne({ githubId: profile.githubId });
    if (existing) return existing;
    return this.userModel.create(profile);
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id);
  }
}
