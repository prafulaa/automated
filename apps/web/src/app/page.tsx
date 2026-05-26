export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Review AI-generated code{' '}
        <span className="text-brand-500">10x faster</span>
      </h1>
      <p className="mt-4 max-w-xl text-lg text-gray-400">
        Know exactly what breaks before you merge. BlastRadius maps every changed file
        to its downstream impact — so you can review with confidence.
      </p>
      <a
        href="/api/auth/github"
        className="mt-8 rounded-lg bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-500"
      >
        Sign in with GitHub
      </a>
    </main>
  );
}
