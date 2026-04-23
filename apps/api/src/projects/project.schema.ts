import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  repoOwner: string;

  @Prop()
  repoName: string;

  @Prop({ enum: ['GITHUB', 'GITLAB'], default: 'GITHUB' })
  repoProvider: string;

  @Prop()
  vercelProjectId: string;

  /**
   * A sha256 hash of a per-project deploy token.
   * This allows CI/CD to report deployments without a user JWT.
   */
  @Prop()
  deployTokenHash?: string;

  @Prop()
  deployTokenCreatedAt?: Date;

  /** Soft-delete flag. Archived projects are excluded from sync + lists by default. */
  @Prop()
  deletedAt?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
