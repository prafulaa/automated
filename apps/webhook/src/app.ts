import Fastify from 'fastify';

export async function createApp() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ status: 'ok' }));

  // POST /webhook — placeholder; full implementation in Phase 2
  app.post('/webhook', async (_request, reply) => {
    reply.code(501).send({ error: 'Not implemented — Phase 2' });
  });

  return app;
}
