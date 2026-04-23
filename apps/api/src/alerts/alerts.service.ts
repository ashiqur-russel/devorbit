import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlertRule } from './alert-rule.schema';
import { AlertChannel } from './alert-channel.schema';
import { Incident } from './incident.schema';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(AlertRule.name) private ruleModel: Model<AlertRule>,
    @InjectModel(AlertChannel.name) private channelModel: Model<AlertChannel>,
    @InjectModel(Incident.name) private incidentModel: Model<Incident>,
  ) {}

  // --- Rules ---
  async createRule(data: Partial<AlertRule>): Promise<AlertRule> {
    return this.ruleModel.create(data);
  }

  async findRulesByTeam(teamId: string): Promise<AlertRule[]> {
    return this.ruleModel.find({ teamId: new Types.ObjectId(teamId) }).populate('channels').exec();
  }

  async findRuleById(id: string): Promise<AlertRule | null> {
    return this.ruleModel.findById(id).populate('channels').exec();
  }

  async updateRule(id: string, data: Partial<AlertRule>): Promise<AlertRule | null> {
    return this.ruleModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteRule(id: string): Promise<void> {
    await this.ruleModel.findByIdAndDelete(id).exec();
  }

  async findEnabledRulesByType(type: string): Promise<AlertRule[]> {
    return this.ruleModel.find({ enabled: true, type }).populate('channels').exec();
  }

  // --- Channels ---
  async createChannel(data: Partial<AlertChannel>): Promise<AlertChannel> {
    return this.channelModel.create(data);
  }

  async findChannelsByTeam(teamId: string): Promise<AlertChannel[]> {
    return this.channelModel.find({ teamId: new Types.ObjectId(teamId) }).exec();
  }

  async deleteChannel(id: string): Promise<void> {
    await this.channelModel.findByIdAndDelete(id).exec();
  }

  // --- Incidents ---
  async createIncident(data: Partial<Incident>): Promise<Incident> {
    return this.incidentModel.create(data);
  }

  async findIncidentsByTeam(teamId: string, status?: string): Promise<Incident[]> {
    const rules = await this.ruleModel.find({ teamId: new Types.ObjectId(teamId) }).select('_id').exec();
    const ruleIds = rules.map((r) => r._id);
    const filter: Record<string, unknown> = { ruleId: { $in: ruleIds } };
    if (status) filter.status = status;
    return this.incidentModel.find(filter).populate('ruleId', 'name type').sort({ firedAt: -1 }).exec();
  }

  async resolveIncident(id: string): Promise<Incident | null> {
    return this.incidentModel
      .findByIdAndUpdate(id, { status: 'resolved', resolvedAt: new Date() }, { new: true })
      .exec();
  }

  async findOpenIncidentForRule(ruleId: string, serverId?: string, projectId?: string): Promise<Incident | null> {
    const filter: Record<string, unknown> = { ruleId: new Types.ObjectId(ruleId), status: 'open' };
    if (serverId) filter.serverId = new Types.ObjectId(serverId);
    if (projectId) filter.projectId = new Types.ObjectId(projectId);
    return this.incidentModel.findOne(filter).exec();
  }

  async findLastFiredForRule(ruleId: string): Promise<Incident | null> {
    return this.incidentModel.findOne({ ruleId: new Types.ObjectId(ruleId) }).sort({ firedAt: -1 }).exec();
  }
}
