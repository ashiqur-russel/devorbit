import { Controller, Get } from '@nestjs/common';

/** Liveness probe for Docker / deploy scripts (no DB or external calls). */
@Controller('health')
export class HealthController {
  @Get()
  ok() {
    return { ok: true };
  }
}
