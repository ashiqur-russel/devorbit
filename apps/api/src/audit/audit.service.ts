import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog } from './audit-log.schema';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private auditModel: Model<AuditLog>) {}

  async log(params: {
    organizationId: string | Types.ObjectId;
    userId?: string | Types.ObjectId;
    action: string;
    meta?: Record<string, unknown>;
  }): Promise<AuditLog> {
    return this.auditModel.create({
      organizationId: new Types.ObjectId(String(params.organizationId)),
      userId: params.userId ? new Types.ObjectId(String(params.userId)) : undefined,
      action: params.action,
      meta: params.meta ?? {},
    });
  }

  async findByOrganization(
    organizationId: string | Types.ObjectId,
    limit = 100,
  ): Promise<AuditLog[]> {
    return this.auditModel
      .find({ organizationId: new Types.ObjectId(String(organizationId)) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
