import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'seconds',
  },
  expireAfterSeconds: 60 * 60 * 24 * 30, // 30 days TTL
})
export class ServerMetric extends Document {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: { serverId: { type: Types.ObjectId, ref: 'Server' } }, required: true })
  metadata: { serverId: Types.ObjectId };

  @Prop({ required: true })
  cpu: number;

  @Prop({ required: true })
  ram: number;

  @Prop({ required: true })
  disk: number;

  @Prop({ default: 0 })
  networkIn: number;

  @Prop({ default: 0 })
  networkOut: number;
}

export const ServerMetricSchema = SchemaFactory.createForClass(ServerMetric);
