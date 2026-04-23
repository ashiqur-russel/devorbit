import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Invitation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  /** When set, user is added to this team after they register. */
  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;

  @Prop({ enum: ['pending', 'accepted', 'revoked'], default: 'pending' })
  status: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);
InvitationSchema.index({ organizationId: 1, email: 1, status: 1 });
