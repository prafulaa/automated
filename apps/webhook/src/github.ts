// GitHub App client — authenticates as an installation and provides Octokit instances

import { App } from '@octokit/app';

// Use a simple interface for Octokit to avoid type import issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Octokit = any;

export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  webhookSecret: string;
}

let appInstance: App | null = null;

export function initApp(config: GitHubAppConfig): App {
  appInstance = new App({
    appId: config.appId,
    privateKey: config.privateKey,
  });
  return appInstance;
}

export function getApp(): App {
  if (!appInstance) throw new Error('GitHub App not initialized');
  return appInstance;
}

/**
 * Get an authenticated Octokit client for a specific installation.
 */
export async function getInstallationOctokit(
  installationId: number,
): Promise<Octokit> {
  const app = getApp();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await app.getInstallationOctokit(installationId)) as any;
}

/**
 * Fetch changed files for a PR via the GitHub REST API.
 * Returns relative file paths.
 */
export async function getPullRequestFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files: any[] = [];
  for await (const { data } of octokit.paginate.iterator(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (octokit as any).rest.pulls.listFiles,
    { owner, repo, pull_number: pullNumber, per_page: 100 },
  )) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    files.push(...(data as any[]));
  }
  return files.map((f) => f.filename as string);
}

/**
 * Find the BlastRadius bot comment on a PR by hidden marker.
 */
export async function findBotComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<{ id: number; body: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const { data } of octokit.paginate.iterator(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (octokit as any).rest.issues.listComments,
    { owner, repo, issue_number: issueNumber, per_page: 100 },
  )) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const comment of data as any[]) {
      if (comment.body?.includes('<!-- blastradius -->')) {
        return { id: comment.id, body: comment.body };
      }
    }
  }
  return null;
}

/**
 * Create or update the BlastRadius PR comment (sticky comment pattern).
 */
export async function upsertComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<{ created: boolean; commentId: number }> {
  const existing = await findBotComment(octokit, owner, repo, issueNumber);

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (octokit as any).rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    return { created: false, commentId: existing.id };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (octokit as any).rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
  return { created: true, commentId: data.id };
}

/**
 * Get the default branch SHA for graph caching.
 */
export async function getDefaultBranchSha(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: repoData } = await (octokit as any).rest.repos.get({ owner, repo });
  const branch = repoData.default_branch;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: refData } = await (octokit as any).rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  return refData.object.sha;
}
