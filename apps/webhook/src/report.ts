// Markdown report renderer — formats the BlastRadius PR comment

import type { BlastRadiusResult } from '@blastradius/engine';
import type { RiskLevel } from '@blastradius/engine';

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
    LOW: '🟢',
    MEDIUM: '🟡',
    HIGH: '🔴',
  };

  const changedList = result.changed.map((f) => `\`${f}\``).join(', ');
  const impactList = formatImpactedList(result);

  return `### ${riskEmoji[riskLevel]} Blast Radius Report

**Risk Level:** ${riskLevel}
**Changed files:** ${changedList}

${impactList}

> ${reviewerTip}

<sub>Analyzed ${analyzedFileCount} files in ${(analysisTimeMs / 1000).toFixed(1)}s · powered by [BlastRadius](https://blastradius.dev) · <!-- blastradius --></sub>`;
}

function formatImpactedList(result: BlastRadiusResult): string {
  const parts: string[] = [];

  if (result.impacted.frontendComponents.length > 0) {
    parts.push(
      `- **Frontend Components:** ${result.impacted.frontendComponents.map((f) => `\`${f}\``).join(', ')}`,
    );
  }
  if (result.impacted.apiRoutes.length > 0) {
    parts.push(
      `- **API Routes:** ${result.impacted.apiRoutes.map((f) => `\`${f}\``).join(', ')}`,
    );
  }
  if (result.impacted.coreUtilities.length > 0) {
    parts.push(
      `- **Core Utilities:** ${result.impacted.coreUtilities.map((f) => `\`${f}\``).join(', ')}`,
    );
  }

  if (parts.length === 0 && result.totalImpacted > 0) {
    parts.push(`- **Impacted files:** ${result.totalImpacted} file(s)`);
  }

  return parts.join('\n') || '_No downstream impact detected._';
}
