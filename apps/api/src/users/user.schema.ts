import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  /** Present for GitHub sign-in; omitted for email-only accounts (sparse unique index). */
  @Prop({ sparse: true, unique: true, trim: true })
  githubId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop()
  avatar: string;

  /** bcrypt hash for email/password login; GitHub-only users may omit. */
  @Prop({ select: false })
  passwordHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
