import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class ChannelConfig {
  @Prop({ required: false })
  url?: string;

  @Prop({ type: [String], default: [] })
  emails: string[];

  @Prop({ required: false })
  slackWebhookUrl?: string;
}
const ChannelConfigSchema = SchemaFactory.createForClass(ChannelConfig);

@Schema({ timestamps: true })
export class AlertChannel extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['email', 'slack_webhook', 'webhook'], required: true })
  type: string;

  @Prop({ type: ChannelConfigSchema, default: {} })
  config: ChannelConfig;
}

export const AlertChannelSchema = SchemaFactory.createForClass(AlertChannel);
