import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './team.schema';

@Injectable()
export class TeamsService {
  constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}

  async create(name: string, ownerId: string): Promise<Team> {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return this.teamModel.create({
      name,
      slug,
      members: [{ userId: ownerId, role: 'OWNER' }],
    });
  }

  async findByMember(userId: string): Promise<Team[]> {
    return this.teamModel.find({ 'members.userId': userId });
  }

  async findById(id: string): Promise<Team> {
    return this.teamModel.findById(id);
  }
}
