import { describe, it, expect } from 'vitest';
import { categorizeFiles, DEFAULT_CATEGORY_CONFIG } from '../src/index.js';

describe('categorizeFiles', () => {
  it('classifies a frontend component', () => {
    const result = categorizeFiles(
      ['src/components/Button.tsx'],
      DEFAULT_CATEGORY_CONFIG,
    );
    expect(result.frontendComponents).toContain('src/components/Button.tsx');
  });

  it('classifies an API route (app router)', () => {
    const result = categorizeFiles(
      ['app/api/login/route.ts'],
      DEFAULT_CATEGORY_CONFIG,
    );
    expect(result.apiRoutes).toContain('app/api/login/route.ts');
  });

  it('classifies a core utility', () => {
    const result = categorizeFiles(
      ['lib/session.ts'],
      DEFAULT_CATEGORY_CONFIG,
    );
    expect(result.coreUtilities).toContain('lib/session.ts');
  });

  it('leaves unmatched files out of all categories', () => {
    const result = categorizeFiles(
      ['random/other/file.ts'],
      DEFAULT_CATEGORY_CONFIG,
    );
    expect(result.frontendComponents).toHaveLength(0);
    expect(result.apiRoutes).toHaveLength(0);
    expect(result.coreUtilities).toHaveLength(0);
  });
});
