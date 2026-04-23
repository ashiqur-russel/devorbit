import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { ServersModule } from './servers/servers.module';
import { MetricsModule } from './metrics/metrics.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { ProjectsModule } from './projects/projects.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { JobsModule } from './jobs/jobs.module';
import { MailModule } from './mail/mail.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    UsersModule,
    TeamsModule,
    OrganizationsModule,
    ProjectsModule,
    IntegrationsModule,
    ServersModule,
    MetricsModule,
    PipelinesModule,
    DeploymentsModule,
    WebsocketsModule,
    JobsModule,
    MailModule,
    AlertsModule,
    AuditModule,
  ],
})
export class AppModule {}
