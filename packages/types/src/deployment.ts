export type DeploymentPlatform = 'VERCEL' | 'OVH' | 'AWS' | 'DIGITALOCEAN' | 'CUSTOM';
export type DeploymentStatus = 'success' | 'failure' | 'building' | 'cancelled';

export interface IDeployment {
  _id: string;
  projectId: string;
  serverId?: string;
  platform: DeploymentPlatform;
  status: DeploymentStatus;
  url?: string;
  deployedAt: Date;
}
