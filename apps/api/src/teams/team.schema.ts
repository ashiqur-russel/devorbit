import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class TeamMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['OWNER', 'ADMIN', 'MEMBER'], default: 'MEMBER' })
  role: string;
}
const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);

@Schema({ timestamps: true })
export class Team extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: [TeamMemberSchema], default: [] })
  members: TeamMember[];
}

export const TeamSchema = SchemaFactory.createForClass(Team);
