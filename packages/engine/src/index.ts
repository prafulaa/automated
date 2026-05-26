// @blastradius/engine — Core blast-radius computation engine
//
// Uses dependency-cruiser to build a dependency graph, then computes the
// transitive reverse closure (blast radius) of changed files via BFS.
//
// Exports:
//   buildDependencyGraph(rootPath: string, opts?: GraphOptions): Promise<DependencyGraph>
//   calculateBlastRadius(graph: DependencyGraph, changedFiles: string[]): BlastRadiusResult
//   scoreRisk(result: BlastRadiusResult, config?: RiskConfig): RiskLevel
//   categorizeFiles(files: string[], config?: CategoryConfig): CategorizedFiles

import { cruise } from 'dependency-cruiser';
import { resolve, relative } from 'node:path';

// ── Types ──────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CategoryConfig {
  frontendComponents: string[];
  apiRoutes: string[];
  coreUtilities: string[];
}

export interface RiskConfig {
  highFanOutThreshold: number;
  highImpactCountThreshold: number;
  coreUtilHitWeight: number;
  apiRouteHitWeight: number;
  frontendHitWeight: number;
  maxDepthWeight: number;
  totalImpactedWeight: number;
}

export interface CategorizedFiles {
  frontendComponents: string[];
  apiRoutes: string[];
  coreUtilities: string[];
}

export interface BlastRadiusResult {
  changed: string[];
  impacted: CategorizedFiles;
  totalImpacted: number;
  depthMax: number;
  timings: {
    graphBuildMs: number;
    bfsMs: number;
    categorizeMs: number;
    totalMs: number;
  };
}

export interface GraphOptions {
  exclude?: string[];
  includeOnly?: string;
  tsConfig?: string;
}

export interface DependencyGraph {
  /** Forward edges: file -> list of files it imports */
  forward: Map<string, Set<string>>;
  /** Reverse edges: file -> list of files that import it */
  reverse: Map<string, Set<string>>;
  /** All files in the graph (relative paths) */
  files: string[];
  /** Root path the graph was built from */
  rootPath: string;
}

// ── Defaults ──────────────────────────────────────────────

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  frontendComponents: ['src/components/**', '*.tsx', 'components/**'],
  apiRoutes: ['src/pages/api/**', 'app/api/**', 'pages/api/**'],
  coreUtilities: ['lib/**', 'utils/**', 'src/lib/**', 'src/utils/**'],
};

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  highFanOutThreshold: 5,
  highImpactCountThreshold: 15,
  coreUtilHitWeight: 3,
  apiRouteHitWeight: 2,
  frontendHitWeight: 1,
  maxDepthWeight: 2,
  totalImpactedWeight: 1,
};

// ── buildDependencyGraph ──────────────────────────────────

export async function buildDependencyGraph(
  rootPath: string,
  opts?: GraphOptions,
): Promise<DependencyGraph> {
  const absRoot = resolve(rootPath);

  const cruiseOpts: Record<string, unknown> = {
    exclude: opts?.exclude ?? ['node_modules', 'dist', '.git', '.next', '.turbo'],
  };

  if (opts?.tsConfig) {
    cruiseOpts.tsConfig = { fileName: resolve(absRoot, opts.tsConfig) };
  }

  if (opts?.includeOnly) {
    cruiseOpts.includeOnly = opts.includeOnly;
  }

  const result = await cruise([absRoot], cruiseOpts);

  // cruise returns { output: ICruiseResult, exitCode: number }
  const cruiseResult = (result as { output: { modules: Array<{
    source: string;
    dependencies: Array<{ resolved: string; followable: boolean; coreModule: boolean }>;
  }> } }).output;

  const forward = new Map<string, Set<string>>();
  const reverse = new Map<string, Set<string>>();
  const files: string[] = [];

  const ensureSet = (map: Map<string, Set<string>>, key: string): Set<string> => {
    let s = map.get(key);
    if (!s) {
      s = new Set();
      map.set(key, s);
    }
    return s;
  };

  for (const mod of cruiseResult.modules) {
    // Make paths relative to rootPath for portability
    const sourceRel = relative(absRoot, resolve(absRoot, mod.source)).replace(/\\/g, '/');
    files.push(sourceRel);
    ensureSet(forward, sourceRel);

    for (const dep of mod.dependencies) {
      if (!dep.followable || dep.coreModule) continue;
      const depRel = relative(absRoot, resolve(absRoot, dep.resolved)).replace(/\\/g, '/');
      ensureSet(forward, sourceRel).add(depRel);
      ensureSet(reverse, depRel).add(sourceRel);
      // Ensure both nodes exist in maps
      if (!forward.has(depRel)) ensureSet(forward, depRel);
    }
  }

  return { forward, reverse, files, rootPath: absRoot };
}

// ── calculateBlastRadius ───────────────────────────────────

export function calculateBlastRadius(
  graph: DependencyGraph,
  changedFiles: string[],
): BlastRadiusResult {
  const t0 = performance.now();

  const visited = new Set<string>();
  const depth = new Map<string, number>();
  const queue: Array<{ file: string; d: number }> = [];

  // Normalize changed files to relative paths
  const normalized = changedFiles.map((f) =>
    f.replace(/\\/g, '/').replace(graph.rootPath.replace(/\\/g, '/') + '/', ''),
  );

  // Initialize BFS from changed files
  for (const file of normalized) {
    visited.add(file);
    depth.set(file, 0);
    queue.push({ file, d: 0 });
  }

  let maxDepth = 0;
  let head = 0;

  // BFS through reverse edges (who imports me?)
  while (head < queue.length) {
    const { file: current, d } = queue[head++]!;
    const dependents = graph.reverse.get(current);

    if (dependents) {
      for (const dep of Array.from(dependents)) {
        if (visited.has(dep)) continue;
        visited.add(dep);
        const newDepth = d + 1;
        depth.set(dep, newDepth);
        if (newDepth > maxDepth) maxDepth = newDepth;
        queue.push({ file: dep, d: newDepth });
      }
    }
  }

  // Collect impacted files (exclude the changed files themselves)
  const impactedFiles: string[] = [];
  for (const file of Array.from(visited)) {
    if (!normalized.includes(file)) {
      impactedFiles.push(file);
    }
  }

  const bfsMs = performance.now() - t0;
  const t1 = performance.now();

  // Categorize impacted files
  const impacted = categorizeFiles(impactedFiles);

  const categorizeMs = performance.now() - t1;

  return {
    changed: normalized,
    impacted,
    totalImpacted: impactedFiles.length,
    depthMax: maxDepth,
    timings: {
      graphBuildMs: 0, // filled by caller
      bfsMs,
      categorizeMs,
      totalMs: bfsMs + categorizeMs,
    },
  };
}

// ── scoreRisk ──────────────────────────────────────────────

export function scoreRisk(
  result: BlastRadiusResult,
  config: RiskConfig = DEFAULT_RISK_CONFIG,
): RiskLevel {
  let score = 0;

  // Weight by impact count
  score += result.totalImpacted * config.totalImpactedWeight;

  // Weight by depth
  score += result.depthMax * config.maxDepthWeight;

  // Weight by category hits
  score += result.impacted.coreUtilities.length * config.coreUtilHitWeight;
  score += result.impacted.apiRoutes.length * config.apiRouteHitWeight;
  score += result.impacted.frontendComponents.length * config.frontendHitWeight;

  if (score >= config.highImpactCountThreshold) return 'HIGH';
  if (score >= config.highFanOutThreshold) return 'MEDIUM';
  return 'LOW';
}

// ── categorizeFiles ────────────────────────────────────────

export function categorizeFiles(
  files: string[],
  config: CategoryConfig = DEFAULT_CATEGORY_CONFIG,
): CategorizedFiles {
  const result: CategorizedFiles = {
    frontendComponents: [],
    apiRoutes: [],
    coreUtilities: [],
  };

  for (const file of files) {
    if (matchesAnyGlob(file, config.frontendComponents)) {
      result.frontendComponents.push(file);
    } else if (matchesAnyGlob(file, config.apiRoutes)) {
      result.apiRoutes.push(file);
    } else if (matchesAnyGlob(file, config.coreUtilities)) {
      result.coreUtilities.push(file);
    }
  }

  return result;
}

// ── Helpers ───────────────────────────────────────────────

function matchesAnyGlob(file: string, globs: string[]): boolean {
  const normalized = file.replace(/\\/g, '/');
  for (const glob of globs) {
    if (simpleGlobMatch(normalized, glob)) return true;
  }
  return false;
}

/**
 * Simple glob matcher that handles **, *, and basic patterns.
 * Avoids pulling in picomatch/minimatch as a direct dependency.
 */
function simpleGlobMatch(file: string, pattern: string): boolean {
  // If pattern has no path separator, match against the filename only (like matchBase)
  if (!pattern.includes('/')) {
    const filename = file.split('/').pop()!;
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    if (new RegExp('^' + regexStr + '$').test(filename)) return true;
    // Also try matching the full path in case it's a simple file in root
    if (new RegExp('^' + regexStr + '$').test(file)) return true;
    return false;
  }

  // Convert glob pattern to regex
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape special regex chars
    .replace(/\*\*/g, '<<<GLOBSTAR>>>')     // placeholder for **
    .replace(/\*/g, '[^/]*')                // * matches anything except /
    .replace(/<<<GLOBSTAR>>>/g, '.*');      // ** matches anything including /

  const regex = new RegExp('^' + regexStr + '$');
  return regex.test(file);
}
