import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
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
    const existingGh = await this.userModel.findOne({ githubId: profile.githubId });
    if (existingGh) return existingGh;

    const email = (profile.email || '').toLowerCase().trim();
    if (email) {
      const byEmail = await this.userModel.findOne({ email }).select('+passwordHash');
      if (byEmail) {
        if (!byEmail.githubId) {
          return this.userModel
            .findByIdAndUpdate(
              byEmail._id,
              {
                githubId: profile.githubId,
                avatar: profile.avatar || byEmail.avatar,
                name: profile.name || byEmail.name,
              },
              { new: true },
            )
            .exec();
        }
        return byEmail;
      }
    }

    const fallbackEmail = email || `github-${profile.githubId}@users.devorbit.local`;
    return this.userModel.create({
      githubId: profile.githubId,
      name: profile.name,
      email: fallbackEmail,
      avatar: profile.avatar,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  }

  async createEmailUser(params: { email: string; password: string; name: string }): Promise<User> {
    const email = params.email.toLowerCase().trim();
    const taken = await this.userModel.exists({ email });
    if (taken) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(params.password, 10);
    return this.userModel.create({
      email,
      name: params.name.trim() || email.split('@')[0],
      passwordHash,
    });
  }

  async validatePassword(user: User, plain: string): Promise<boolean> {
    const u = await this.userModel.findById(user._id).select('+passwordHash');
    if (!u?.passwordHash) return false;
    return bcrypt.compare(plain, u.passwordHash);
  }
}
