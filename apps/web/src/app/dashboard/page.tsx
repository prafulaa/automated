import { getUser } from '@/lib/supabase';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface ReportRow {
  id: number;
  repo: string;
  prNumber: number;
  prTitle: string;
  riskLevel: RiskLevel;
  impactedCount: number;
  timestamp: string;
}

// ── Demo data (replaced by real Supabase queries in production) ──

const DEMO_REPORTS: ReportRow[] = [
  {
    id: 1,
    repo: 'acme/core-api',
    prNumber: 442,
    prTitle: 'Update auth middleware logic',
    riskLevel: 'HIGH',
    impactedCount: 12,
    timestamp: '2h ago',
  },
  {
    id: 2,
    repo: 'acme/core-api',
    prNumber: 440,
    prTitle: 'Refactor session token handling',
    riskLevel: 'MEDIUM',
    impactedCount: 7,
    timestamp: '5h ago',
  },
  {
    id: 3,
    repo: 'acme/web-app',
    prNumber: 218,
    prTitle: 'Add rate limiting to login endpoint',
    riskLevel: 'LOW',
    impactedCount: 2,
    timestamp: '1d ago',
  },
];

// ── Risk badge ─────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    LOW: 'text-risk-low bg-risk-low/10',
    MEDIUM: 'text-risk-medium bg-risk-medium/10',
    HIGH: 'text-risk-high bg-risk-high/10',
  };
  const labels: Record<RiskLevel, string> = {
    LOW: 'Low risk',
    MEDIUM: 'Medium risk',
    HIGH: 'High risk',
  };
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-xs ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

// ── Loading skeleton ───────────────────────────────────

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
          <div className="h-5 w-16 rounded bg-surface-overlay" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-surface-overlay" />
            <div className="h-3 w-1/3 rounded bg-surface-overlay" />
          </div>
          <div className="h-4 w-20 rounded bg-surface-overlay" />
          <div className="h-4 w-12 rounded bg-surface-overlay" />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-white">Listening for pull requests</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Reports will appear here after your first PR analysis.
      </p>
    </div>
  );
}

// ── Error state ────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-risk-high bg-risk-high/5 p-6">
      <h4 className="font-medium text-risk-high">Failed to fetch repository data</h4>
      <p className="mt-1 text-sm text-zinc-400">{message}</p>
      <button className="mt-4 rounded border border-border px-3 py-1.5 text-xs text-white transition hover:bg-surface-overlay">
        Retry connection
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getUser();
  const reports: ReportRow[] = DEMO_REPORTS;
  const hasRepos = true; // TODO: check Supabase installations
  const isLoading = false;
  const hasError = false;

  return (
    <div className="min-h-screen bg-surface-bg text-white">
      {/* App shell nav */}
      <nav className="sticky top-0 z-10 border-b border-border bg-surface-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-mono text-sm font-medium uppercase tracking-wider text-white"
          >
            BlastRadius
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              {user?.user_metadata?.user_name || user?.email || 'User'}
            </span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Header row */}
        <div className="mb-8 flex items-end justify-between">
          <h1 className="font-display text-3xl tracking-tight text-white">Recent reports</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Free tier</span>
            <Link
              href="/#pricing"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-white transition hover:bg-surface-overlay"
            >
              Upgrade
            </Link>
          </div>
        </div>

        {/* Subscription card */}
        <div className="mb-8 rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Free plan</h2>
              <p className="mt-1 text-sm text-zinc-400">1 public repository</p>
            </div>
            <span className="rounded-full border border-brand bg-brand/10 px-3 py-1 font-mono text-xs text-brand">
              Active
            </span>
          </div>
        </div>

        {/* Reports grid */}
        {isLoading ? (
          <ReportSkeleton />
        ) : hasError ? (
          <ErrorState message="The GitHub API is currently unavailable or your token has expired." />
        ) : !hasRepos || reports.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4 transition hover:border-zinc-600"
              >
                <div className="flex items-center gap-4">
                  <RiskBadge level={report.riskLevel} />
                  <div>
                    <span className="text-sm font-medium text-white">{report.prTitle}</span>
                    <span className="ml-2 font-mono text-xs text-zinc-500">
                      {report.repo}#{report.prNumber}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-zinc-400">
                    {report.impactedCount} downstream files
                  </span>
                  <span className="font-mono text-xs text-zinc-500">{report.timestamp}</span>
                  <a
                    href={`https://github.com/${report.repo}/pull/${report.prNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border border-border px-3 py-1 text-xs text-white transition hover:bg-surface-overlay"
                  >
                    View PR
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
