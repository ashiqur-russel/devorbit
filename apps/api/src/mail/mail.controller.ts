import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../users/user.schema';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { MailService } from './mail.service';

@ApiTags('mail')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('mail')
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Get('status')
  @ApiOperation({ summary: 'Whether Resend (RESEND_API_KEY) is configured' })
  status() {
    return {
      provider: 'resend',
      configured: this.mail.isConfigured(),
    };
  }

  @Post('test')
  @ApiOperation({
    summary: 'Send a test email (Resend). Defaults to the signed-in user’s email.',
  })
  async sendTest(@Req() req: { user: User }, @Body() dto: SendTestEmailDto) {
    const user = req.user;
    const to = dto.to?.trim() || user.email;
    return this.mail.sendTest(to);
  }
}
