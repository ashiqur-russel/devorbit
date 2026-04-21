import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { Server } from './server.schema';

@Injectable()
export class ServersService {
  constructor(@InjectModel(Server.name) private serverModel: Model<Server>) {}

  async register(teamId: string, name: string): Promise<Server> {
    const agentToken = `dev_${randomBytes(16).toString('hex')}`;
    return this.serverModel.create({ teamId, name, agentToken });
  }

  async findByTeam(teamId: string): Promise<Server[]> {
    return this.serverModel.find({ teamId });
  }

  async findByAgentToken(token: string): Promise<Server> {
    return this.serverModel.findOne({ agentToken: token });
  }

  async markOnline(serverId: string, info: { ip?: string; os?: string; uptime?: number }) {
    return this.serverModel.findByIdAndUpdate(serverId, {
      ...info,
      status: 'online',
      lastSeen: new Date(),
    });
  }

  async markOffline(serverId: string) {
    return this.serverModel.findByIdAndUpdate(serverId, { status: 'offline' });
  }
}
