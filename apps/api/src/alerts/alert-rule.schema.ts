import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class AlertCondition {
  @Prop({ enum: ['cpu', 'ram', 'disk'], required: false })
  metric?: string;

  @Prop({ enum: ['gt', 'lt'], required: false })
  operator?: string;

  @Prop({ required: false })
  threshold?: number;

  @Prop({ default: 60 })
  durationSeconds: number;

  @Prop({ required: false })
  pipelineStatus?: string;

  @Prop({ required: false })
  deploymentStatus?: string;
}
const AlertConditionSchema = SchemaFactory.createForClass(AlertCondition);

@Schema({ timestamps: true })
export class AlertRule extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['metric_threshold', 'pipeline_status', 'deployment_status', 'agent_offline'], required: true })
  type: string;

  @Prop({ type: AlertConditionSchema, required: false })
  condition?: AlertCondition;

  @Prop({ type: [Types.ObjectId], ref: 'AlertChannel', default: [] })
  channels: Types.ObjectId[];

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: 15 })
  cooldownMinutes: number;
}

export const AlertRuleSchema = SchemaFactory.createForClass(AlertRule);
