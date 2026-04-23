import { IsEmail, IsOptional } from 'class-validator';

export class SendTestEmailDto {
  /** If omitted, the email goes to the signed-in user’s GitHub email. */
  @IsOptional()
  @IsEmail()
  to?: string;
}
