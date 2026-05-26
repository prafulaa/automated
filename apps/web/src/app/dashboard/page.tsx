import { getUser } from '@/lib/supabase';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-surface text-gray-100">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Blast<span className="text-brand-500">Radius</span>
        </Link>
        <span className="text-sm text-gray-400">
          {user?.user_metadata?.user_name || user?.email || 'User'}
        </span>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Manage your installed repositories and subscription.
        </p>

        {/* Subscription card */}
        <div className="mt-8 rounded-xl border border-gray-800 bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Free Plan</h2>
              <p className="text-sm text-gray-400">1 public repository</p>
            </div>
            <Link
              href="/pricing"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-500"
            >
              Upgrade
            </Link>
          </div>
        </div>

        {/* Installed repos */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Installed Repositories</h2>
          <div className="mt-4 rounded-xl border border-gray-800 bg-surface-raised p-6">
            <p className="text-sm text-gray-500">
              No repositories installed yet.{' '}
              <a href="https://github.com/apps/blastradius" className="text-brand-500 underline">
                Install the GitHub App
              </a>{' '}
              to get started.
            </p>
          </div>
        </div>

        {/* Recent reports */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Recent Reports</h2>
          <div className="mt-4 rounded-xl border border-gray-800 bg-surface-raised p-6">
            <p className="text-sm text-gray-500">
              Reports will appear here after your first PR analysis.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
