// Webhook handler — validates GitHub HMAC signatures, enqueues jobs

import type { FastifyInstance } from 'fastify';
import { Webhooks } from '@octokit/webhooks';
import type { JobPayload } from './types.js';
import type { WorkerConfig } from './worker.js';
import { processJob } from './worker.js';

export interface WebhookConfig {
  webhookSecret: string;
  worker: WorkerConfig;
  tmpDirBase: string;
}

export async function registerWebhook(
  app: FastifyInstance,
  config: WebhookConfig,
): Promise<void> {
  const webhooks = new Webhooks({
    secret: config.webhookSecret,
  });

  // Register event handlers
  webhooks.on('pull_request.opened', ({ payload }) => {
    handlePullRequestEvent(payload, 'pull_request.opened', config);
  });

  webhooks.on('pull_request.synchronize', ({ payload }) => {
    handlePullRequestEvent(payload, 'pull_request.synchronize', config);
  });

  // Handle errors
  webhooks.onError((error) => {
    console.error('Webhook error:', String(error));
  });

  // POST /webhook — validates HMAC, enqueues job, returns 200 immediately
  app.post('/webhook', async (request, reply) => {
    const deliveryId = (request.headers['x-github-delivery'] as string) || 'unknown';

    try {
      // Verify webhook signature
      const signature = request.headers['x-hub-signature-256'] as string;
      const event = request.headers['x-github-event'] as string;

      if (!signature) {
        return reply.code(401).send({ error: 'Missing signature' });
      }

      // Verify and process the webhook
      await webhooks.verifyAndReceive({
        id: deliveryId,
        name: event,
        signature,
        payload: JSON.stringify(request.body),
      });

      return reply.code(200).send({ status: 'accepted', deliveryId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[${deliveryId}] Webhook validation failed:`, msg);
      return reply.code(401).send({ error: 'Invalid signature' });
    }
  });
}

function handlePullRequestEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  event: 'pull_request.opened' | 'pull_request.synchronize',
  config: WebhookConfig,
): void {
  const deliveryId = `gh_${Date.now()}_${payload.pull_request?.number || 'unknown'}`;

  const job: JobPayload = {
    deliveryId,
    event,
    payload,
  };

  // Process job in background — do NOT await
  processJob(job, config.worker, config.tmpDirBase).catch((err) => {
    console.error(`[${deliveryId}] Background job failed:`, err);
  });
}
