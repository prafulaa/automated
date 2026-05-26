export interface JobPayload {
  deliveryId: string;
  event: 'pull_request.opened' | 'pull_request.synchronize';
  payload: Record<string, unknown>;
}

export interface AnalysisJob {
  jobId: string;
  payload: JobPayload;
  state: 'pending' | 'running' | 'done' | 'failed';
}
