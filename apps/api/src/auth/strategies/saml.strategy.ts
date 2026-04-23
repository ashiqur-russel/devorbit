import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, SamlConfig } from 'passport-saml';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      entryPoint: config.get<string>('SAML_ENTRY_POINT') || '',
      issuer: config.get<string>('SAML_ISSUER') || 'devorbit',
      callbackUrl: config.get<string>('SAML_CALLBACK_URL') || 'http://localhost:4000/api/v1/auth/saml/callback',
      cert: config.get<string>('SAML_CERT') || '',
    } as SamlConfig);
  }

  async validate(profile: any): Promise<any> {
    return this.authService.validateSamlUser({
      samlNameId: profile.nameID as string,
      email: (profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        profile.email ||
        profile.nameID) as string,
      name: (profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        profile.displayName ||
        profile.nameID) as string,
    });
  }
}
