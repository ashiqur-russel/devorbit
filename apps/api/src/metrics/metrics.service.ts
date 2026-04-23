import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServerMetric } from './metric.schema';
import { ProcessSnapshot } from './process-snapshot.schema';
import { DockerMetric } from './docker-metric.schema';

@Injectable()
export class MetricsService {
  constructor(
    @InjectModel(ServerMetric.name) private metricModel: Model<ServerMetric>,
    @InjectModel(ProcessSnapshot.name) private processModel: Model<ProcessSnapshot>,
    @InjectModel(DockerMetric.name) private dockerModel: Model<DockerMetric>,
  ) {}

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

  async getLatest(serverId: string): Promise<ServerMetric | null> {
    return this.metricModel
      .findOne({ 'metadata.serverId': new Types.ObjectId(serverId) })
      .sort({ timestamp: -1 })
      .exec();
  }

  async ingestProcesses(serverId: string, list: any[]) {
    return this.processModel.create({
      timestamp: new Date(),
      metadata: { serverId: new Types.ObjectId(serverId) },
      list,
    });
  }

  async getLatestProcesses(serverId: string) {
    return this.processModel
      .findOne({ 'metadata.serverId': new Types.ObjectId(serverId) })
      .sort({ timestamp: -1 })
      .exec();
  }

  async ingestDockerMetrics(serverId: string, containers: any[]) {
    return this.dockerModel.create({
      timestamp: new Date(),
      metadata: { serverId: new Types.ObjectId(serverId) },
      containers,
    });
  }

  async getLatestDocker(serverId: string) {
    return this.dockerModel
      .findOne({ 'metadata.serverId': new Types.ObjectId(serverId) })
      .sort({ timestamp: -1 })
      .exec();
  }
}
