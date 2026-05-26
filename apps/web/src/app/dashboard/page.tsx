export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-400">
        Your installed repositories and recent reports will appear here.
      </p>
      <div className="mt-8 rounded-lg border border-gray-800 bg-surface-raised p-6">
        <p className="text-gray-500">No repositories installed yet.</p>
      </div>
    </main>
  );
}
