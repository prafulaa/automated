// @blastradius/engine — Core blast-radius computation engine
//
// Exports:
//   buildDependencyGraph(rootPath: string, opts?: GraphOptions): Promise<DependencyGraph>
//   calculateBlastRadius(graph: DependencyGraph, changedFiles: string[]): BlastRadiusResult
//   scoreRisk(result: BlastRadiusResult, config?: RiskConfig): RiskLevel
//   categorizeFiles(files: string[], config?: CategoryConfig): CategorizedFiles

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
  };
}

export interface GraphOptions {
  exclude?: string[];
  includeOnly?: string[];
  tsConfig?: string;
}

export interface DependencyEdge {
  source: string;
  dependencies: Array<{
    resolved: string;
    moduleSystem: string;
    dynamic: boolean;
  }>;
}

export interface DependencyGraph {
  /** Forward edges: file -> list of files it imports */
  forward: Map<string, string[]>;
  /** Reverse edges: file -> list of files that import it */
  reverse: Map<string, string[]>;
  /** All files in the graph */
  files: string[];
}

// ── Defaults ──────────────────────────────────────────────

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  frontendComponents: ['src/components/**', '*.tsx'],
  apiRoutes: ['src/pages/api/**', 'app/api/**', 'pages/api/**'],
  coreUtilities: ['lib/**', 'utils/**', 'src/lib/**', 'src/utils/**'],
};

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  highFanOutThreshold: 5,
  highImpactCountThreshold: 15,
  coreUtilHitWeight: 3,
  apiRouteHitWeight: 2,
  frontendHitWeight: 1,
};

// ── Placeholder implementations (filled in Phase 1 with TDD) ──

export async function buildDependencyGraph(
  _rootPath: string,
  _opts?: GraphOptions,
): Promise<DependencyGraph> {
  throw new Error('Not implemented — Phase 1');
}

export function calculateBlastRadius(
  _graph: DependencyGraph,
  _changedFiles: string[],
): BlastRadiusResult {
  throw new Error('Not implemented — Phase 1');
}

export function scoreRisk(
  _result: BlastRadiusResult,
  _config?: RiskConfig,
): RiskLevel {
  throw new Error('Not implemented — Phase 1');
}

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
  for (const glob of globs) {
    if (glob.endsWith('/**') && file.startsWith(glob.slice(0, -3))) return true;
    if (glob.startsWith('*.') && file.endsWith(glob.slice(1))) return true;
    if (file.includes(glob.replace(/\*\*/g, ''))) return true;
  }
  return false;
}
