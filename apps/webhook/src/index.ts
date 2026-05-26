// @blastradius/webhook — GitHub App webhook server
//
// Responsibilities:
//   1. POST /webhook — validate HMAC, enqueue job, return 200 < 2s
//   2. POST /webhook/health — health check
//   3. Background worker (pg-boss) — process analysis jobs

export { createApp } from './app.js';
export { processJob, backoff } from './worker.js';
export type { JobPayload, AnalysisJob } from './types.js';
