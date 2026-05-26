import { describe, it, expect } from 'vitest';
import { renderReport, type ReportInput } from '../src/report.js';
import type { BlastRadiusResult } from '@blastradius/engine';

function makeResult(overrides: Partial<BlastRadiusResult> = {}): BlastRadiusResult {
  return {
    changed: ['src/auth.ts'],
    impacted: { frontendComponents: [], apiRoutes: [], coreUtilities: [] },
    totalImpacted: 0,
    depthMax: 0,
    timings: { graphBuildMs: 100, bfsMs: 10, categorizeMs: 5, totalMs: 115 },
    ...overrides,
  };
}

function makeInput(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    result: makeResult({}),
    riskLevel: 'LOW',
    reviewerTip: 'All clear.',
    analyzedFileCount: 50,
    analysisTimeMs: 1500,
    repoName: 'owner/repo',
    prNumber: 42,
    ...overrides,
  };
}

describe('renderReport', () => {
  it('includes the risk level', () => {
    const report = renderReport(makeInput({ riskLevel: 'HIGH' }));
    expect(report).toContain('HIGH');
  });

  it('includes the reviewer tip', () => {
    const report = renderReport(makeInput({ reviewerTip: 'Watch out for X.' }));
    expect(report).toContain('Watch out for X.');
  });

  it('includes the hidden marker for sticky comments', () => {
    const report = renderReport(makeInput());
    expect(report).toContain('<!-- blastradius -->');
  });

  it('shows no-impact message when nothing is impacted', () => {
    const report = renderReport(makeInput({ riskLevel: 'LOW' }));
    expect(report).toContain('No downstream impact detected');
  });

  it('lists frontend components when impacted', () => {
    const result = makeResult({
      impacted: { frontendComponents: ['src/App.tsx'], apiRoutes: [], coreUtilities: [] },
      totalImpacted: 1,
    });
    const report = renderReport(makeInput({ result }));
    expect(report).toContain('Frontend Components');
    expect(report).toContain('src/App.tsx');
  });
});
