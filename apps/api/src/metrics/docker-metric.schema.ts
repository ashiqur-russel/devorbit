import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'seconds',
  },
  expireAfterSeconds: 60 * 60 * 24 * 7, // 7 days TTL
})
export class DockerMetric extends Document {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: { serverId: { type: Types.ObjectId, ref: 'Server' } }, required: true })
  metadata: { serverId: Types.ObjectId };

  @Prop({ type: [Object], default: [] })
  containers: { id: string; name: string; image: string; cpu: number; memory: number; status: string }[];
}

export const DockerMetricSchema = SchemaFactory.createForClass(DockerMetric);
