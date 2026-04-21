import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServerMetric } from './metric.schema';

@Injectable()
export class MetricsService {
  constructor(@InjectModel(ServerMetric.name) private metricModel: Model<ServerMetric>) {}

  async ingest(serverId: string, data: { cpu: number; ram: number; disk: number; networkIn?: number; networkOut?: number }) {
    return this.metricModel.create({
      timestamp: new Date(),
      metadata: { serverId: new Types.ObjectId(serverId) },
      ...data,
    });
  }

  async getRecent(serverId: string, minutes = 15): Promise<ServerMetric[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.metricModel
      .find({ 'metadata.serverId': new Types.ObjectId(serverId), timestamp: { $gte: since } })
      .sort({ timestamp: 1 });
  }

  async getLatest(serverId: string): Promise<ServerMetric> {
    return this.metricModel
      .findOne({ 'metadata.serverId': new Types.ObjectId(serverId) })
      .sort({ timestamp: -1 });
  }
}
