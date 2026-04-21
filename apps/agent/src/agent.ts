import { io, Socket } from 'socket.io-client';
import si from 'systeminformation';

interface AgentConfig {
  token: string;
  apiUrl: string;
  intervalMs?: number;
}

export function startAgent({ token, apiUrl, intervalMs = 5000 }: AgentConfig) {
  let socket: Socket;
  let metricsInterval: NodeJS.Timeout;

  function connect() {
    socket = io(apiUrl, {
      auth: { agentToken: token },
      reconnectionDelay: 3000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log(`✓ Connected (socket: ${socket.id})`);
      startMetrics();
    });

    socket.on('disconnect', (reason) => {
      console.log(`✗ Disconnected: ${reason}`);
      clearInterval(metricsInterval);
    });

    socket.on('connect_error', (err) => {
      console.error(`Connection error: ${err.message}. Retrying...`);
    });
  }

  function startMetrics() {
    metricsInterval = setInterval(async () => {
      try {
        const [cpu, mem, disk, net] = await Promise.all([
          si.currentLoad(),
          si.mem(),
          si.fsSize(),
          si.networkStats(),
        ]);

        const payload = {
          cpu: Math.round(cpu.currentLoad * 10) / 10,
          ram: Math.round((mem.used / mem.total) * 100 * 10) / 10,
          disk: disk[0] ? Math.round((disk[0].used / disk[0].size) * 100 * 10) / 10 : 0,
          networkIn: net[0]?.rx_sec ?? 0,
          networkOut: net[0]?.tx_sec ?? 0,
        };

        socket.emit('metric', payload);
      } catch (err) {
        console.error('Metrics collection error:', err);
      }
    }, intervalMs);
  }

  connect();

  process.on('SIGINT', () => {
    console.log('\nShutting down agent...');
    clearInterval(metricsInterval);
    socket.disconnect();
    process.exit(0);
  });
}
