import { describe, it, expect } from 'vitest';
import {
  calculateBlastRadius,
  scoreRisk,
  DEFAULT_RISK_CONFIG,
  type DependencyGraph,
  type BlastRadiusResult,
} from '../src/index.js';

// ── Helper: build a simple in-memory graph ─────────────────

function makeGraph(deps: Array<[string, string[]]>): DependencyGraph {
  const forward = new Map<string, Set<string>>();
  const reverse = new Map<string, Set<string>>();
  const files: string[] = [];

  const addFile = (f: string) => {
    if (!forward.has(f)) { forward.set(f, new Set()); files.push(f); }
    if (!reverse.has(f)) reverse.set(f, new Set());
  };

  for (const [file, imports] of deps) {
    addFile(file);
    for (const imp of imports) {
      addFile(imp);
      forward.get(file)!.add(imp);
      reverse.get(imp)!.add(file);
    }
  }

  return { forward, reverse, files, rootPath: '/test' };
}

// ── calculateBlastRadius tests ─────────────────────────────

describe('calculateBlastRadius', () => {
  it('returns empty impacted when nothing imports the changed file', () => {
    // A -> B, C (no one imports A)
    const graph = makeGraph([
      ['A.ts', ['B.ts', 'C.ts']],
    ]);
    const result = calculateBlastRadius(graph, ['A.ts']);
    expect(result.totalImpacted).toBe(0);
    expect(result.depthMax).toBe(0);
  });

  it('finds direct reverse dependents', () => {
    // B imports A — changing A impacts B
    const graph = makeGraph([
      ['B.ts', ['A.ts']],
    ]);
    const result = calculateBlastRadius(graph, ['A.ts']);
    expect(result.totalImpacted).toBe(1);
    expect(result.changed).toContain('A.ts');
  });

  it('finds transitive dependents (depth 2)', () => {
    // C -> B -> A. Change A — impacts B (depth 1) and C (depth 2)
    const graph = makeGraph([
      ['B.ts', ['A.ts']],
      ['C.ts', ['B.ts']],
    ]);
    const result = calculateBlastRadius(graph, ['A.ts']);
    expect(result.totalImpacted).toBe(2);
    expect(result.depthMax).toBe(2);
  });

  it('handles multiple changed files', () => {
    // D -> C -> B -> A. Change A and C.
    const graph = makeGraph([
      ['B.ts', ['A.ts']],
      ['C.ts', ['B.ts']],
      ['D.ts', ['C.ts']],
    ]);
    const result = calculateBlastRadius(graph, ['A.ts', 'C.ts']);
    // A impacts B,C,D (but C is changed, so excluded). C impacts D (already visited).
    // Impacted: B, D = 2
    expect(result.totalImpacted).toBe(2);
  });

  it('handles cycles without infinite loops', () => {
    // A -> B -> C -> A (cycle)
    const graph = makeGraph([
      ['A.ts', ['B.ts']],
      ['B.ts', ['C.ts']],
      ['C.ts', ['A.ts']],
    ]);
    const result = calculateBlastRadius(graph, ['A.ts']);
    // All three are in the cycle — B and C should be impacted
    expect(result.totalImpacted).toBe(2);
    expect(result.depthMax).toBeGreaterThanOrEqual(1);
  });

  it('does not include changed files in impacted', () => {
    // B -> A, C -> A. Change A.
    const graph = makeGraph([
      ['B.ts', ['A.ts']],
      ['C.ts', ['A.ts']],
    ]);
    const result = calculateBlastRadius(graph, ['A.ts']);
    expect(result.impacted.frontendComponents).not.toContain('A.ts');
    expect(result.impacted.apiRoutes).not.toContain('A.ts');
    expect(result.impacted.coreUtilities).not.toContain('A.ts');
  });
});
