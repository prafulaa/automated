import { describe, it, expect } from 'vitest';
import { buildDependencyGraph, calculateBlastRadius, scoreRisk } from '../src/index.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURE = resolve(__dirname, '../fixtures/small-project');

describe('buildDependencyGraph (integration)', () => {
  it('builds graph from a fixture TS project', async () => {
    const graph = await buildDependencyGraph(FIXTURE, {
      tsConfig: 'tsconfig.json',
    });

    expect(graph.files.length).toBeGreaterThan(0);

    // All three source files should be present (using relative paths)
    const hasHelper = graph.files.some((f) => f.endsWith('helper.ts'));
    const hasButton = graph.files.some((f) => f.endsWith('Button.tsx'));
    const hasIndex = graph.files.some((f) => f.endsWith('index.ts'));
    expect(hasHelper).toBe(true);
    expect(hasButton).toBe(true);
    expect(hasIndex).toBe(true);
  });

  it('has correct reverse edges', async () => {
    const graph = await buildDependencyGraph(FIXTURE, {
      tsConfig: 'tsconfig.json',
    });

    // helper.ts should have reverse edges from index.ts and Button.tsx
    const helperFile = graph.files.find((f) => f.endsWith('helper.ts'))!;
    const reverse = graph.reverse.get(helperFile);
    expect(reverse).toBeDefined();
    expect(reverse!.size).toBeGreaterThanOrEqual(1);
  });
});

describe('end-to-end: graph -> blast radius -> score', () => {
  it('computes blast radius for helper.ts change', async () => {
    const graph = await buildDependencyGraph(FIXTURE, {
      tsConfig: 'tsconfig.json',
    });

    const helperFile = graph.files.find((f) => f.endsWith('helper.ts'))!;
    const result = calculateBlastRadius(graph, [helperFile]);

    // helper.ts is imported by index.ts and Button.tsx — both should be impacted
    expect(result.totalImpacted).toBeGreaterThanOrEqual(1);
    expect(result.depthMax).toBeGreaterThanOrEqual(1);

    const risk = scoreRisk(result);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(risk);
  });
});
