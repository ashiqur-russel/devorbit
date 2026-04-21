import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Deployment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Server' })
  serverId: Types.ObjectId;

  @Prop({ enum: ['VERCEL', 'OVH', 'AWS', 'DIGITALOCEAN', 'CUSTOM'], required: true })
  platform: string;

  @Prop({ enum: ['success', 'failure', 'building', 'cancelled'], default: 'building' })
  status: string;

  @Prop()
  url: string;

  @Prop({ default: Date.now })
  deployedAt: Date;
}

export const DeploymentSchema = SchemaFactory.createForClass(Deployment);
