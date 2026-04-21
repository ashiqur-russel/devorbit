export type PipelineProvider = 'GITHUB' | 'GITLAB';
export type PipelineStatus = 'success' | 'failure' | 'running' | 'cancelled' | 'pending';

export interface IPipeline {
  _id: string;
  projectId: string;
  provider: PipelineProvider;
  workflowId: string;
  branch: string;
  status: PipelineStatus;
  startedAt?: Date;
  finishedAt?: Date;
}

export interface IPipelineRun {
  _id: string;
  pipelineId: string;
  runId: string;
  status: PipelineStatus;
  duration?: number;
  triggeredBy?: string;
  createdAt: Date;
}
