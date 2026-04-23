import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MetricsService } from '../metrics/metrics.service';
import { ServersService } from '../servers/servers.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MetricsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MetricsGateway.name);

  @WebSocketServer()
  server: Server;

  private agentSockets = new Map<string, string>(); // serverId -> socketId

  constructor(
    private metricsService: MetricsService,
    private serversService: ServersService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.agentToken as string;
    if (!token) return;
    const server = await this.serversService.findByAgentToken(token);
    if (server) {
      this.agentSockets.set(server._id.toString(), client.id);
      await this.serversService.markOnline(server._id.toString(), {});
    }
  }

  async handleDisconnect(client: Socket) {
    for (const [serverId, socketId] of this.agentSockets.entries()) {
      if (socketId === client.id) {
        this.agentSockets.delete(serverId);
        /** Do not mark offline here: API restarts and transient network drops would flip customer UIs.
         *  Stale detection uses `lastSeen` (updated on connect + metrics) in `ServersStaleService`. */
        this.logger.debug(`Agent socket disconnected for server ${serverId} (socket ${client.id})`);
        break;
      }
    }
  }

  @SubscribeMessage('metric')
  async handleMetric(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { cpu: number; ram: number; disk: number; networkIn?: number; networkOut?: number },
  ) {
    const token = client.handshake.auth?.agentToken as string;
    const server = await this.serversService.findByAgentToken(token);
    if (!server) return;

    await this.metricsService.ingest(server._id.toString(), data);
    await this.serversService.markOnline(server._id.toString(), {});

    // Broadcast to dashboard subscribers
    this.server.to(`server:${server._id}`).emit('metric:update', {
      serverId: server._id,
      ...data,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('subscribe:server')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() serverId: string) {
    client.join(`server:${serverId}`);
  }

  @SubscribeMessage('unsubscribe:server')
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() serverId: string) {
    client.leave(`server:${serverId}`);
  }
}
