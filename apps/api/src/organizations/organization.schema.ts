import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class OrgMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /** Creator of the org is SUPER_ADMIN. Org admins can manage teams and members. */
  @Prop({ enum: ['SUPER_ADMIN', 'ADMIN', 'MEMBER'], default: 'MEMBER' })
  role: string;
}
const OrgMemberSchema = SchemaFactory.createForClass(OrgMember);

@Schema({ timestamps: true })
export class Organization extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: [OrgMemberSchema], default: [] })
  members: OrgMember[];
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
