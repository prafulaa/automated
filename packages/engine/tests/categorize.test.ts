import { describe, it, expect } from 'vitest';
import {
  categorizeFiles,
  DEFAULT_CATEGORY_CONFIG,
  calculateBlastRadius,
  scoreRisk,
  DEFAULT_RISK_CONFIG,
  buildDependencyGraph,
  type DependencyGraph,
  type BlastRadiusResult,
} from '../src/index.js';

// ── categorizeFiles tests ──────────────────────────────────

describe('categorizeFiles', () => {
  it('classifies a frontend component via glob', () => {
    const result = categorizeFiles(['src/components/Button.tsx'], DEFAULT_CATEGORY_CONFIG);
    expect(result.frontendComponents).toContain('src/components/Button.tsx');
  });

  it('classifies a .tsx file as frontend', () => {
    const result = categorizeFiles(['pages/Home.tsx'], DEFAULT_CATEGORY_CONFIG);
    expect(result.frontendComponents).toContain('pages/Home.tsx');
  });

  it('classifies an app router API route', () => {
    const result = categorizeFiles(['app/api/login/route.ts'], DEFAULT_CATEGORY_CONFIG);
    expect(result.apiRoutes).toContain('app/api/login/route.ts');
  });

  it('classifies a pages API route', () => {
    const result = categorizeFiles(['src/pages/api/user.ts'], DEFAULT_CATEGORY_CONFIG);
    expect(result.apiRoutes).toContain('src/pages/api/user.ts');
  });

  it('classifies a core utility under lib/', () => {
    const result = categorizeFiles(['lib/session.ts'], DEFAULT_CATEGORY_CONFIG);
    expect(result.coreUtilities).toContain('lib/session.ts');
  });

  it('classifies a core utility under src/lib/', () => {
    const result = categorizeFiles(['src/lib/auth.ts']);
    expect(result.coreUtilities).toContain('src/lib/auth.ts');
  });

  it('leaves unmatched files out of all categories', () => {
    const result = categorizeFiles(['random/other/file.ts']);
    expect(result.frontendComponents).toHaveLength(0);
    expect(result.apiRoutes).toHaveLength(0);
    expect(result.coreUtilities).toHaveLength(0);
  });

  it('handles empty array', () => {
    const result = categorizeFiles([]);
    expect(result.frontendComponents).toHaveLength(0);
    expect(result.apiRoutes).toHaveLength(0);
    expect(result.coreUtilities).toHaveLength(0);
  });

  it('uses custom category config', () => {
    const config = { frontendComponents: ['ui/**'], apiRoutes: ['endpoints/**'], coreUtilities: ['shared/**'] };
    const result = categorizeFiles(['ui/Modal.tsx', 'endpoints/auth.ts', 'shared/logger.ts'], config);
    expect(result.frontendComponents).toEqual(['ui/Modal.tsx']);
    expect(result.apiRoutes).toEqual(['endpoints/auth.ts']);
    expect(result.coreUtilities).toEqual(['shared/logger.ts']);
  });
});
