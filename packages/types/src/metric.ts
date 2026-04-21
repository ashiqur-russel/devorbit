export interface IServerMetric {
  timestamp: Date;
  serverId: string;
  cpu: number;
  ram: number;
  disk: number;
  networkIn: number;
  networkOut: number;
}

export interface IServerMetricSummary {
  serverId: string;
  cpu: number;
  ram: number;
  disk: number;
  uptime: number;
  lastUpdated: Date;
}
