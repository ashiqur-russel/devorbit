import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Integration extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId: Types.ObjectId;

  @Prop({ enum: ['GITHUB', 'GITLAB', 'VERCEL'], required: true })
  provider: string;

  @Prop({ required: true })
  token: string;

  @Prop({ type: Object, default: {} })
  meta: Record<string, string>;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);
IntegrationSchema.index({ teamId: 1, provider: 1 }, { unique: true });
