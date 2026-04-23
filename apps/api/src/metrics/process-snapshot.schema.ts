import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'seconds',
  },
  expireAfterSeconds: 60 * 60, // 1 hour TTL
})
export class ProcessSnapshot extends Document {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: { serverId: { type: Types.ObjectId, ref: 'Server' } }, required: true })
  metadata: { serverId: Types.ObjectId };

  @Prop({ type: [Object], default: [] })
  list: { pid: number; name: string; cpu: number; mem: number }[];
}

export const ProcessSnapshotSchema = SchemaFactory.createForClass(ProcessSnapshot);
