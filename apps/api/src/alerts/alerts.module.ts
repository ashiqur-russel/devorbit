import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertRule, AlertRuleSchema } from './alert-rule.schema';
import { AlertChannel, AlertChannelSchema } from './alert-channel.schema';
import { Incident, IncidentSchema } from './incident.schema';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertEvaluatorService } from './alert-evaluator.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { MetricsModule } from '../metrics/metrics.module';
import { ServersModule } from '../servers/servers.module';
import { MailModule } from '../mail/mail.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AlertRule.name, schema: AlertRuleSchema },
      { name: AlertChannel.name, schema: AlertChannelSchema },
      { name: Incident.name, schema: IncidentSchema },
    ]),
    MetricsModule,
    ServersModule,
    MailModule,
    TeamsModule,
  ],
  providers: [AlertsService, AlertEvaluatorService, NotificationDispatcherService],
  controllers: [AlertsController],
  exports: [AlertsService, AlertEvaluatorService],
})
export class AlertsModule {}
