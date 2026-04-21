import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Integration } from './integration.schema';

@Injectable()
export class IntegrationsService {
  constructor(@InjectModel(Integration.name) private integrationModel: Model<Integration>) {}

  async upsert(
    teamId: string,
    provider: string,
    token: string,
    meta: Record<string, string> = {},
  ): Promise<Integration> {
    return this.integrationModel.findOneAndUpdate(
      { teamId: new Types.ObjectId(teamId), provider },
      { token, meta },
      { upsert: true, new: true },
    );
  }

  async findByTeam(teamId: string): Promise<Integration[]> {
    return this.integrationModel.find({ teamId: new Types.ObjectId(teamId) }, { token: 0 });
  }

  async findAllByProvider(provider: string): Promise<Integration[]> {
    return this.integrationModel.find({ provider });
  }

  async remove(teamId: string, provider: string): Promise<void> {
    await this.integrationModel.deleteOne({ teamId: new Types.ObjectId(teamId), provider });
  }
}
