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
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { MetricsService } from '../metrics/metrics.service';
import { ServersService } from '../servers/servers.service';
import { ALERT_FIRED_EVENT, AlertFiredEvent } from '../alerts/alert-evaluator.service';

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

  @SubscribeMessage('processes')
  async handleProcesses(@ConnectedSocket() client: Socket, @MessageBody() data: { list: any[] }) {
    const token = client.handshake.auth?.agentToken as string;
    const server = await this.serversService.findByAgentToken(token);
    if (!server) return;
    await this.metricsService.ingestProcesses(server._id.toString(), data.list ?? []);
    this.server.to(`server:${server._id}`).emit('processes:update', {
      serverId: server._id,
      list: data.list,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('docker:stats')
  async handleDockerStats(@ConnectedSocket() client: Socket, @MessageBody() data: { containers: any[] }) {
    const token = client.handshake.auth?.agentToken as string;
    const server = await this.serversService.findByAgentToken(token);
    if (!server) return;
    await this.metricsService.ingestDockerMetrics(server._id.toString(), data.containers ?? []);
    if (!server.dockerEnabled) {
      await this.serversService.setDockerEnabled(server._id.toString());
    }
    this.server.to(`server:${server._id}`).emit('docker:update', {
      serverId: server._id,
      containers: data.containers,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('log:line')
  async handleLogLine(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { line: string; timestamp: string },
  ) {
    const token = client.handshake.auth?.agentToken as string;
    const server = await this.serversService.findByAgentToken(token);
    if (!server) return;
    this.server
      .to(`server:${server._id}:logs`)
      .emit('log:line', { serverId: server._id, line: data.line, timestamp: data.timestamp });
  }

  @SubscribeMessage('subscribe:server')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() serverId: string) {
    client.join(`server:${serverId}`);
  }

  @SubscribeMessage('unsubscribe:server')
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() serverId: string) {
    client.leave(`server:${serverId}`);
  }

  @SubscribeMessage('subscribe:server:logs')
  handleSubscribeLogs(@ConnectedSocket() client: Socket, @MessageBody() serverId: string) {
    client.join(`server:${serverId}:logs`);
  }

  @SubscribeMessage('unsubscribe:server:logs')
  handleUnsubscribeLogs(@ConnectedSocket() client: Socket, @MessageBody() serverId: string) {
    client.leave(`server:${serverId}:logs`);
  }

  @OnEvent(ALERT_FIRED_EVENT)
  handleAlertFired(event: AlertFiredEvent) {
    this.server.emit('alert:fired', event);
  }
}
