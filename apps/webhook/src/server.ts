// Server entry point — Fastify server with webhook and health endpoints

import { createApp } from './app.js';
import { registerWebhook } from './webhook.js';
import { initApp } from './github.js';
import type { AnthropicConfig } from './anthropic.js';

export interface ServerConfig {
  port: number;
  githubAppId: string;
  githubPrivateKey: string;
  githubWebhookSecret: string;
  anthropic: AnthropicConfig;
  tmpDirBase: string;
}

export async function startServer(config: ServerConfig): Promise<void> {
  // Initialize GitHub App
  initApp({
    appId: config.githubAppId,
    privateKey: config.githubPrivateKey.replace(/\\n/g, '\n'),
    webhookSecret: config.githubWebhookSecret,
  });

  // Create Fastify app
  const app = await createApp();

  // Register webhook handler
  await registerWebhook(app, {
    webhookSecret: config.githubWebhookSecret,
    worker: { anthropic: config.anthropic },
    tmpDirBase: config.tmpDirBase,
  });

  // Start listening
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`BlastRadius webhook server listening on port ${config.port}`);
}

// CLI entry: if run directly, start the server
const port = parseInt(process.env['PORT'] || '3000', 10);

if (process.env['GITHUB_APP_ID']) {
  startServer({
    port,
    githubAppId: process.env['GITHUB_APP_ID'] || '',
    githubPrivateKey: process.env['GITHUB_APP_PRIVATE_KEY'] || '',
    githubWebhookSecret: process.env['GITHUB_WEBHOOK_SECRET'] || '',
    anthropic: {
      apiKey: process.env['ANTHROPIC_API_KEY'] || '',
    },
    tmpDirBase: process.env['TMP_DIR'] || '/tmp/blastradius',
  }).catch((err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
}
