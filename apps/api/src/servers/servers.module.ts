import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { Server, ServerSchema } from './server.schema';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Server.name, schema: ServerSchema }]), OrganizationsModule],
  providers: [ServersService],
  controllers: [ServersController],
  exports: [ServersService],
})
export class ServersModule {}
