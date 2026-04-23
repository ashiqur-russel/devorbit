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

  /** Provider-specific id (e.g. Vercel deployment id, GitHub run id). */
  @Prop()
  externalId?: string;

  @Prop({ enum: ['production', 'preview', 'staging'] })
  environment?: string;

  @Prop({ enum: ['success', 'failure', 'building', 'cancelled'], default: 'building' })
  status: string;

  @Prop()
  url: string;

  @Prop()
  branch?: string;

  @Prop()
  commitSha?: string;

  @Prop()
  commitMessage?: string;

  @Prop({ default: Date.now })
  deployedAt: Date;
}

export const DeploymentSchema = SchemaFactory.createForClass(Deployment);
