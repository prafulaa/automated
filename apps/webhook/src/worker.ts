// Background worker: picks up jobs from pg-boss, runs blast-radius analysis,
// posts/updates the PR comment. Stubbed — full implementation in Phase 2.

export async function createWorker() {
  // TODO: Phase 2 — connect to pg-boss, register job handler
  return {
    start: async () => {
      console.log('Worker started (stub)');
    },
    stop: async () => {
      console.log('Worker stopped (stub)');
    },
  };
}
