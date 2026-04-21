import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    UsersModule,
    TeamsModule,
    ProjectsModule,
    IntegrationsModule,
    ServersModule,
    MetricsModule,
    PipelinesModule,
    DeploymentsModule,
    WebsocketsModule,
    JobsModule,
  ],
})
export class AppModule {}
