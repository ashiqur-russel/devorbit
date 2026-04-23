import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  /** Required when not registering with `inviteToken` (creates a new org). */
  @ValidateIf((o: RegisterDto) => !o.inviteToken?.trim())
  @IsString()
  @MinLength(2)
  organizationName?: string;

  /** When set, user joins the invited org (and optional team); no new org is created. */
  @IsOptional()
  @IsString()
  @MinLength(32)
  inviteToken?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;
}
