// Markdown report renderer — formats the BlastRadius PR comment
// Follows the design spec: blockquotes for risk, <details> for file lists, <sup> footer

import type { BlastRadiusResult, RiskLevel } from '@blastradius/engine';

export interface ReportInput {
  result: BlastRadiusResult;
  riskLevel: RiskLevel;
  reviewerTip: string;
  analyzedFileCount: number;
  analysisTimeMs: number;
  repoName: string;
  prNumber: number;
}

export function renderReport(input: ReportInput): string {
  const { result, riskLevel, reviewerTip, analyzedFileCount, analysisTimeMs } = input;

  const riskEmoji: Record<RiskLevel, string> = {
    LOW: '\uD83D\uDFE2',
    MEDIUM: '\uD83D\uDFE1',
    HIGH: '\uD83D\uDD34',
  };

  const riskLabel: Record<RiskLevel, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
  };

  // Build impacted categories as a markdown list
  const impactedParts = buildImpactedList(result);

  // Build the collapsible file list
  const allImpacted = [
    ...result.impacted.frontendComponents,
    ...result.impacted.apiRoutes,
    ...result.impacted.coreUtilities,
  ];

  const collapsibleSection =
    allImpacted.length > 0
      ? `
<details>
<summary><b>View ${allImpacted.length} downstream files at risk</b></summary>

${allImpacted.map((f) => `- \`${f}\``).join('\n')}
</details>`
      : '';

  const analysisSeconds = (analysisTimeMs / 1000).toFixed(1);

  return `### ${riskEmoji[riskLevel]} Blast radius report

> **Risk level: ${riskEmoji[riskLevel]} ${riskLabel[riskLevel]}** — This PR modifies \`${result.changed[0] || 'unknown'}\`${result.changed.length > 1 ? ` and ${result.changed.length - 1} other file(s)` : ''}. Via the import graph it can affect ${result.totalImpacted} downstream file(s) across ${result.depthMax} level(s).

${impactedParts}
${collapsibleSection}
---

**\uD83D\uDCA1 AI reviewer tip:** ${reviewerTip}

<sup>Analyzed ${analyzedFileCount} files in ${analysisSeconds}s \u00B7 [Powered by BlastRadius](https://blastradius.dev) \u00B7 <!-- blastradius --></sup>`;
}

function buildImpactedList(result: BlastRadiusResult): string {
  const parts: string[] = [];

  if (result.impacted.frontendComponents.length > 0) {
    parts.push(
      `- **Frontend components:** ${result.impacted.frontendComponents.map((f) => `\`${f}\``).join(', ')}`,
    );
  }
  if (result.impacted.apiRoutes.length > 0) {
    parts.push(
      `- **API routes:** ${result.impacted.apiRoutes.map((f) => `\`${f}\``).join(', ')}`,
    );
  }
  if (result.impacted.coreUtilities.length > 0) {
    parts.push(
      `- **Core utilities:** ${result.impacted.coreUtilities.map((f) => `\`${f}\``).join(', ')}`,
    );
  }

  if (parts.length === 0 && result.totalImpacted > 0) {
    return `- **Impacted files:** ${result.totalImpacted} file(s)`;
  }

  if (parts.length === 0) {
    return '_No downstream impact detected._';
  }

  return parts.join('\n');
}
