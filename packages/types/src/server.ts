export type ServerStatus = 'online' | 'offline' | 'degraded';

export interface IServer {
  _id: string;
  teamId: string;
  name: string;
  agentToken: string;
  lastSeen?: Date;
  ip?: string;
  os?: string;
  uptime?: number;
  status: ServerStatus;
}
