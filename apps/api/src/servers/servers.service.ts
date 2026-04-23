import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { Server } from './server.schema';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class ServersService {
  constructor(
    @InjectModel(Server.name) private serverModel: Model<Server>,
    private organizationsService: OrganizationsService,
  ) {}

  async register(teamId: string, name: string, actorUserId: string): Promise<Server> {
    await this.organizationsService.assertCanRegisterServer(actorUserId, teamId);
    const agentToken = `dev_${randomBytes(16).toString('hex')}`;
    return this.serverModel.create({ teamId, name, agentToken });
  }

  async findByTeam(teamId: string): Promise<Server[]> {
    return this.serverModel.find({ teamId });
  }

  async findById(id: string): Promise<Server | null> {
    return this.serverModel.findById(id).exec();
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

  /**
   * Mark servers offline when they have not sent a heartbeat (connect / metric) for longer than `maxAgeMs`.
   * Used instead of marking offline on every WebSocket disconnect so brief API restarts or network blips
   * do not flip customer dashboards to “offline” while the agent is still running.
   */
  async markStaleAgentsOffline(maxAgeMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMs);
    const res = await this.serverModel.updateMany(
      { status: { $in: ['online', 'degraded'] }, lastSeen: { $lt: cutoff } },
      { $set: { status: 'offline' } },
    );
    return res.modifiedCount ?? 0;
  }
}
