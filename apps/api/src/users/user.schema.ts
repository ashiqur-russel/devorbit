import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  /** Present for GitHub sign-in; omitted for email-only accounts (see partial unique index below). */
  @Prop({ trim: true })
  githubId: string;

  /** Present for Google sign-in. */
  @Prop({ trim: true })
  googleId: string;

  /** Present for SAML sign-in. */
  @Prop({ trim: true })
  samlNameId: string;

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

/** Unique only when set: many email users omit githubId; sparse+unique still indexed `null` as one key → E11000 dup null. */
UserSchema.index(
  { githubId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      githubId: { $type: 'string' },
    },
  },
);

UserSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googleId: { $type: 'string' },
    },
  },
);

UserSchema.index(
  { samlNameId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      samlNameId: { $type: 'string' },
    },
  },
);

UserSchema.pre('validate', function (next) {
  const gh = (this as User & { githubId?: string | null }).githubId;
  if (gh === null || gh === '') {
    (this as User & { githubId?: string }).githubId = undefined;
  }
  const go = (this as User & { googleId?: string | null }).googleId;
  if (go === null || go === '') {
    (this as User & { googleId?: string }).googleId = undefined;
  }
  const saml = (this as User & { samlNameId?: string | null }).samlNameId;
  if (saml === null || saml === '') {
    (this as User & { samlNameId?: string }).samlNameId = undefined;
  }
  next();
});
