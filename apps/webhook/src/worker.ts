// Background worker: processes analysis jobs
// In production: uses pg-boss for reliable job processing
// In development: uses an in-memory queue

import {
  buildDependencyGraph,
  calculateBlastRadius,
  scoreRisk,
  type RiskLevel,
} from '@blastradius/engine';
import { getInstallationOctokit, getPullRequestFiles, upsertComment } from './github.js';
import { generateReviewerTip, type AiConfig } from './ai.js';
import { renderReport } from './report.js';
import type { JobPayload } from './types.js';

export interface WorkerConfig {
  ai: AiConfig;
}

/**
 * Process a single analysis job: fetch PR data, run engine, post comment.
 */
export async function processJob(
  job: JobPayload,
  config: WorkerConfig,
  tmpDirBase: string,
): Promise<{ success: boolean; error?: string; timingMs: number }> {
  const t0 = performance.now();

  try {
    const prPayload = job.payload as {
      pull_request?: {
        number: number;
        head: { sha: string; ref: string };
      };
      repository?: { owner: { login: string }; name: string; default_branch: string };
      installation?: { id: number };
    };

    const owner = prPayload.repository?.owner?.login;
    const repo = prPayload.repository?.name;
    const prNumber = prPayload.pull_request?.number;
    const installationId = prPayload.installation?.id;

    if (!owner || !repo || !prNumber || !installationId) {
      return { success: false, error: 'Missing required PR payload fields', timingMs: 0 };
    }

    // 1. Get installation token
    const octokit = await getInstallationOctokit(installationId);

    // 2. Fetch changed files
    const changedFiles = await getPullRequestFiles(octokit, owner, repo, prNumber);

    if (changedFiles.length === 0) {
      return { success: true, error: 'No changed files', timingMs: 0 };
    }

    // 3. Get repo tree for analysis
    // In production we'd shallow-clone. For now, use the changed file list directly
    // and build a graph from the repo. Since we can't clone, use a lightweight approach:
    // Use the engine's dependency analysis on the changed files as-is.
    // For a real deployment, clone the repo to tmpDirBase first.

    // 4. Run engine
    // Note: in a real deployment, rootPath would be the cloned repo path
    // For now, this is a stub that demonstrates the flow.
    // The engine is designed to work with a full repo checkout.
    const graph = await buildDependencyGraph(tmpDirBase, {
      exclude: ['node_modules', 'dist', '.git'],
    });

    const t1 = performance.now();
    const result = calculateBlastRadius(graph, changedFiles);
    result.timings.graphBuildMs = t1 - t0;

    // 5. Score risk
    const riskLevel: RiskLevel = scoreRisk(result);

    // 6. Generate reviewer tip (with AI or template fallback)
    const reviewerTip = await generateReviewerTip(result, riskLevel, config.ai);

    // 7. Render and post/update comment
    const totalMs = performance.now() - t0;
    const reportBody = renderReport({
      result,
      riskLevel,
      reviewerTip,
      analyzedFileCount: graph.files.length,
      analysisTimeMs: totalMs,
      repoName: `${owner}/${repo}`,
      prNumber,
    });

    const { created, commentId } = await upsertComment(
      octokit,
      owner,
      repo,
      prNumber,
      reportBody,
    );

    console.log(
      `[${job.deliveryId}] ${created ? 'Created' : 'Updated'} comment #${commentId} on ${owner}/${repo}#${prNumber} (${(totalMs / 1000).toFixed(1)}s)`,
    );

    return { success: true, timingMs: totalMs };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${job.deliveryId}] Job failed:`, msg);
    return { success: false, error: msg, timingMs: performance.now() - t0 };
  }
}

/**
 * Rate-limit aware exponential backoff.
 */
export function backoff(attempt: number, baseMs = 1000, maxMs = 60000): number {
  const delay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  // Add jitter: ±25%
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return delay + jitter;
}
