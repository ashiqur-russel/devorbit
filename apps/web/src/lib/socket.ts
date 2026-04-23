import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('devorbit_token') : null;
    socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectAsAgent(agentToken: string): Socket {
  const s = io(WS_URL, {
    auth: { agentToken },
    transports: ['websocket'],
  });
  return s;
}

export function subscribeToServer(
  serverId: string,
  onMetric: (metric: any) => void,
): () => void {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('subscribe:server', serverId);

  // API emits `metric:update` to room `server:<id>` (see MetricsGateway), not an event named `server:<id>`.
  const handler = (payload: { serverId?: string | { toString(): string } }) => {
    const sid = payload?.serverId != null ? String(payload.serverId) : '';
    if (sid === serverId) onMetric(payload);
  };
  s.on('metric:update', handler);
  return () => {
    s.emit('unsubscribe:server', serverId);
    s.off('metric:update', handler);
  };
}

export function subscribeToAlerts(onAlert: (alert: any) => void): () => void {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.on('alert:fired', onAlert);
  return () => s.off('alert:fired', onAlert);
}

export function subscribeToServerLogs(
  serverId: string,
  onLog: (line: { ts: string; text: string }) => void,
): () => void {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('subscribe:logs', serverId);
  const handler = (payload: { serverId: string; ts: string; text: string }) => {
    if (payload?.serverId === serverId) onLog({ ts: payload.ts, text: payload.text });
  };
  s.on('log:line', handler);
  return () => {
    s.emit('unsubscribe:logs', serverId);
    s.off('log:line', handler);
  };
}
