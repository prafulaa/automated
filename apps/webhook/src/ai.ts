// Provider-agnostic AI client — generates one-line reviewer tips using Anthropic, DeepSeek, or Gemini
import type { BlastRadiusResult } from '@blastradius/engine';
import type { RiskLevel } from '@blastradius/engine';

// Simple in-memory cache keyed by a hash of the result
const tipCache = new Map<string, { tip: string; timestamp: number }>();
const CACHE_TTL_MS = 3600_000; // 1 hour

export interface AiConfig {
  provider?: 'anthropic' | 'deepseek' | 'gemini';
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
  config: AiConfig,
): Promise<string> {
  const cacheKey = buildCacheKey(result, riskLevel);
  const cached = tipCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.tip;
  }

  // Determine active provider and api key
  let provider = config.provider;
  let apiKey = config.apiKey;

  // Auto-detect provider if not explicitly configured
  if (!provider) {
    if (apiKey.startsWith('sk-ant-') || process.env['ANTHROPIC_API_KEY']) {
      provider = 'anthropic';
      apiKey = apiKey || process.env['ANTHROPIC_API_KEY'] || '';
    } else if (process.env['DEEPSEEK_API_KEY']) {
      provider = 'deepseek';
      apiKey = apiKey || process.env['DEEPSEEK_API_KEY'] || '';
    } else if (process.env['GEMINI_API_KEY']) {
      provider = 'gemini';
      apiKey = apiKey || process.env['GEMINI_API_KEY'] || '';
    } else {
      // Fallback detection based on key prefix
      if (apiKey.startsWith('sk-')) {
        // DeepSeek keys often start with 'sk-' just like OpenAI
        provider = 'deepseek';
      } else {
        provider = 'gemini';
      }
    }
  }

  // If no API key is available, use template fallback immediately
  if (!apiKey || apiKey === 'sk-***' || apiKey === '***') {
    return templateTip(result, riskLevel);
  }

  try {
    let tip = '';
    if (provider === 'anthropic') {
      tip = await callAnthropic(result, riskLevel, apiKey, config.model);
    } else if (provider === 'deepseek') {
      tip = await callDeepSeek(result, riskLevel, apiKey, config.model);
    } else if (provider === 'gemini') {
      tip = await callGemini(result, riskLevel, apiKey, config.model);
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    tipCache.set(cacheKey, { tip, timestamp: Date.now() });
    return tip;
  } catch (err) {
    console.error(`${provider} API error, using template fallback:`, err);
    return templateTip(result, riskLevel);
  }
}

// ── Anthropic Integration ───────────────────────────────────
async function callAnthropic(
  result: BlastRadiusResult,
  riskLevel: RiskLevel,
  apiKey: string,
  modelName?: string,
): Promise<string> {
  const prompt = buildPrompt(result, riskLevel);
  const model = modelName || 'claude-3-5-sonnet-20241022';
  const url = 'https://api.anthropic.com/v1/messages';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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

// ── DeepSeek Integration ─────────────────────────────────────
async function callDeepSeek(
  result: BlastRadiusResult,
  riskLevel: RiskLevel,
  apiKey: string,
  modelName?: string,
): Promise<string> {
  const prompt = buildPrompt(result, riskLevel);
  const model = modelName || 'deepseek-chat';
  const url = 'https://api.deepseek.com/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: 'You are a code review assistant. Write ONE concise sentence that tells the reviewer what to watch out for, given the blast radius analysis. Be specific and actionable. No preamble.'
        },
        { role: 'user', content: prompt }
      ],
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  return text || templateTip(result, riskLevel);
}

// ── Gemini Integration ───────────────────────────────────────
async function callGemini(
  result: BlastRadiusResult,
  riskLevel: RiskLevel,
  apiKey: string,
  modelName?: string,
): Promise<string> {
  const prompt = buildPrompt(result, riskLevel);
  // Default to gemini-2.5-flash (or v4-flash as requested by user)
  const model = modelName || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          { text: 'You are a code review assistant. Write ONE concise sentence that tells the reviewer what to watch out for, given the blast radius analysis. Be specific and actionable. No preamble.' }
        ]
      },
      generationConfig: {
        maxOutputTokens: 150
      }
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || templateTip(result, riskLevel);
}

// ── Shared Helper Functions ──────────────────────────────────
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
