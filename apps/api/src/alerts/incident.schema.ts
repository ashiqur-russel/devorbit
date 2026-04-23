import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Incident extends Document {
  @Prop({ type: Types.ObjectId, ref: 'AlertRule', required: true })
  ruleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Server', required: false })
  serverId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: false })
  projectId?: Types.ObjectId;

  @Prop({ required: true })
  firedAt: Date;

  @Prop({ required: false })
  resolvedAt?: Date;

  @Prop({ enum: ['open', 'resolved'], default: 'open' })
  status: string;

  @Prop({ required: true })
  summary: string;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
// TTL index: auto-remove resolved incidents older than 90 days
IncidentSchema.index({ resolvedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90, sparse: true });
