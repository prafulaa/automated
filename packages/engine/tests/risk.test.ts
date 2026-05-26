import { describe, it, expect } from 'vitest';
import { scoreRisk, DEFAULT_RISK_CONFIG, type BlastRadiusResult, type RiskConfig } from '../src/index.js';

function makeResult(overrides: Partial<BlastRadiusResult>): BlastRadiusResult {
  return {
    changed: ['src/auth.ts'],
    impacted: { frontendComponents: [], apiRoutes: [], coreUtilities: [] },
    totalImpacted: 0,
    depthMax: 0,
    timings: { graphBuildMs: 0, bfsMs: 0, categorizeMs: 0, totalMs: 0 },
    ...overrides,
  };
}

describe('scoreRisk', () => {
  it('returns LOW for zero impact', () => {
    expect(scoreRisk(makeResult({ totalImpacted: 0 }))).toBe('LOW');
  });

  it('returns LOW for small impact', () => {
    expect(scoreRisk(makeResult({ totalImpacted: 2, depthMax: 1 }))).toBe('LOW');
  });

  it('returns MEDIUM for moderate impact count', () => {
    expect(scoreRisk(makeResult({ totalImpacted: 6 }))).toBe('MEDIUM');
  });

  it('returns MEDIUM when core utilities are hit', () => {
    const result = makeResult({
      totalImpacted: 2,
      impacted: { frontendComponents: [], apiRoutes: [], coreUtilities: ['lib/session.ts'] },
    });
    expect(scoreRisk(result)).toBe('MEDIUM');
  });

  it('returns HIGH for large totalImpacted', () => {
    expect(scoreRisk(makeResult({ totalImpacted: 20 }))).toBe('HIGH');
  });

  it('returns HIGH when many core utils + api routes are hit', () => {
    const result = makeResult({
      totalImpacted: 8,
      impacted: {
        frontendComponents: [],
        apiRoutes: ['api/a.ts', 'api/b.ts', 'api/c.ts'],
        coreUtilities: ['lib/x.ts', 'lib/y.ts', 'lib/z.ts'],
      },
    });
    expect(scoreRisk(result)).toBe('HIGH');
  });

  it('uses custom risk config', () => {
    const strictConfig: RiskConfig = { ...DEFAULT_RISK_CONFIG, highFanOutThreshold: 2, highImpactCountThreshold: 5 };
    expect(scoreRisk(makeResult({ totalImpacted: 3 }), strictConfig)).toBe('MEDIUM');
  });
});
