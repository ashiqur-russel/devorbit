import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Server extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  agentToken: string;

  @Prop()
  ip: string;

  @Prop()
  os: string;

  @Prop()
  uptime: number;

  @Prop({ default: Date.now })
  lastSeen: Date;

  @Prop({ enum: ['online', 'offline', 'degraded'], default: 'offline' })
  status: string;
}

export const ServerSchema = SchemaFactory.createForClass(Server);
