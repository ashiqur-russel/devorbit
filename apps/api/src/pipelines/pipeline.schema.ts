import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PipelineRun extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ enum: ['GITHUB', 'GITLAB'], required: true })
  provider: string;

  @Prop({ required: true })
  runId: string;

  @Prop()
  branch: string;

  @Prop()
  workflowName: string;

  @Prop({ enum: ['success', 'failure', 'running', 'cancelled', 'pending'], default: 'pending' })
  status: string;

  @Prop()
  duration: number;

  @Prop()
  triggeredBy: string;

  @Prop()
  startedAt: Date;

  @Prop()
  finishedAt: Date;
}

export const PipelineRunSchema = SchemaFactory.createForClass(PipelineRun);
