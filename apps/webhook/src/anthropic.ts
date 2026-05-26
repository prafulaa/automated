// Anthropic API client — generates one-line reviewer tips

import type { BlastRadiusResult } from '@blastradius/engine';
import type { RiskLevel } from '@blastradius/engine';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Simple in-memory cache keyed by a hash of the result
const tipCache = new Map<string, { tip: string; timestamp: number }>();
const CACHE_TTL_MS = 3600_000; // 1 hour

export interface AnthropicConfig {
  apiKey: string;
  model?: string;
}

/**
 * Generate a one-line reviewer tip from the blast radius result.
 * Cached by a simple hash of the result. Falls back to a template
 * if the API is unavailable.
 */
export async function generateReviewerTip(
  result: BlastRadiusResult,
  riskLevel: RiskLevel,
  config: AnthropicConfig,
): Promise<string> {
  const cacheKey = buildCacheKey(result, riskLevel);
  const cached = tipCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.tip;
  }

  // If no API key, use template fallback immediately
  if (!config.apiKey || config.apiKey === 'sk-***') {
    return templateTip(result, riskLevel);
  }

  try {
    const tip = await callAnthropic(result, riskLevel, config);
    tipCache.set(cacheKey, { tip, timestamp: Date.now() });
    return tip;
  } catch (err) {
    console.error('Anthropic API error, using template fallback:', err);
    return templateTip(result, riskLevel);
  }
}

async function callAnthropic(
  result: BlastRadiusResult,
  riskLevel: RiskLevel,
  config: AnthropicConfig,
): Promise<string> {
  const prompt = buildPrompt(result, riskLevel);
  const model = config.model || 'claude-sonnet-4-20250514';

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 150,
      system:
        'You are a code review assistant. Write ONE concise sentence that tells the reviewer what to watch out for, given the blast radius analysis. Be specific and actionable. No preamble.',
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const text = data.content?.[0]?.text?.trim();
  return text || templateTip(result, riskLevel);
}

function buildPrompt(result: BlastRadiusResult, riskLevel: RiskLevel): string {
  const changed = result.changed.join(', ');
  const impacted = [
    ...result.impacted.frontendComponents,
    ...result.impacted.apiRoutes,
    ...result.impacted.coreUtilities,
  ].join(', ');

  return `A PR changes: ${changed}. Risk: ${riskLevel}. Impacted files: ${impacted || 'none'}. Total impacted: ${result.totalImpacted}. Max depth: ${result.depthMax}. Give a one-sentence reviewer tip.`;
}

function templateTip(result: BlastRadiusResult, riskLevel: RiskLevel): string {
  if (riskLevel === 'HIGH') {
    return `Reviewer tip: this change affects ${result.totalImpacted} downstream files across ${result.depthMax} levels — verify API contracts and run the full test suite.`;
  }
  if (riskLevel === 'MEDIUM') {
    return `Reviewer tip: check that the ${result.totalImpacted} impacted files still receive expected inputs, especially across the affected API routes and components.`;
  }
  if (result.totalImpacted === 0) {
    return 'Reviewer tip: no downstream impact detected — this change appears self-contained. Verify with a quick smoke test.';
  }
  return `Reviewer tip: confirm the changed behavior aligns with all ${result.totalImpacted} dependent callers.`;
}

function buildCacheKey(result: BlastRadiusResult, riskLevel: RiskLevel): string {
  return `${result.changed.sort().join(',')}|${riskLevel}|${result.totalImpacted}`;
}

/**
 * Clear expired cache entries.
 */
export function cleanCache(): void {
  const now = Date.now();
  for (const [key, entry] of Array.from(tipCache)) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      tipCache.delete(key);
    }
  }
}
