import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class OrgMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /** Creator of the org is SUPER_ADMIN. Org admins can manage teams and members. */
  @Prop({ enum: ['SUPER_ADMIN', 'ADMIN', 'MEMBER'], default: 'MEMBER' })
  role: string;

  /** Super admin may grant so this org admin can create teams (“workspaces”) in the org. */
  @Prop({ default: false })
  canCreateTeams: boolean;

  /** Super admin may grant so this org admin can register the Devorbit agent (servers) on teams in the org. */
  @Prop({ default: false })
  canInstallAgent: boolean;
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
