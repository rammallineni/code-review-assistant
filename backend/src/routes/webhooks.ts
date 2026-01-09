import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { query } from '../database/connection.js';
import { findRepositoryByGitHubId } from '../services/repository.service.js';
import { createAndRunReview } from '../services/review.service.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string | undefined
): boolean {
  if (!config.github.webhookSecret || !signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', config.github.webhookSecret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

/**
 * @swagger
 * /api/webhooks/github:
 *   post:
 *     summary: GitHub webhook endpoint
 *     tags: [Webhooks]
 *     security: []
 *     responses:
 *       200:
 *         description: Webhook processed
 *       401:
 *         description: Invalid signature
 */
router.post('/github', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;

    // Verify signature
    const payload = JSON.stringify(req.body);
    if (!verifyWebhookSignature(payload, signature)) {
      logger.warn('Invalid webhook signature');
      throw new AppError('Invalid signature', 401);
    }

    logger.info(`Received webhook: ${event} (${deliveryId})`);

    // Handle different event types
    switch (event) {
      case 'pull_request':
        await handlePullRequestEvent(req.body);
        break;
      case 'ping':
        // Ping event to verify webhook setup
        logger.info('Webhook ping received');
        break;
      default:
        logger.debug(`Ignoring event: ${event}`);
    }

    res.json({ success: true, received: true });
  } catch (error) {
    next(error);
  }
});

interface PullRequestPayload {
  action: string;
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    head: { sha: string };
    base: { sha: string };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
  };
  sender: {
    login: string;
  };
}

async function handlePullRequestEvent(payload: PullRequestPayload): Promise<void> {
  const { action, number, repository } = payload;

  // Only process opened and synchronize actions
  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    logger.debug(`Ignoring PR action: ${action}`);
    return;
  }

  logger.info(`Processing PR #${number} (${action}) for ${repository.full_name}`);

  // Find repository in our database
  const repo = await findRepositoryByGitHubId(String(repository.id));
  
  if (!repo) {
    logger.debug(`Repository ${repository.full_name} not connected`);
    return;
  }

  if (!repo.autoReview) {
    logger.debug(`Auto-review disabled for ${repository.full_name}`);
    return;
  }

  // Store webhook event
  await query(
    `INSERT INTO webhook_events (repository_id, event_type, action, payload)
     VALUES ($1, $2, $3, $4)`,
    [repo.id, 'pull_request', action, payload]
  );

  // Trigger review
  try {
    const [owner, repoName] = repository.full_name.split('/');
    
    await createAndRunReview({
      userId: repo.userId,
      repositoryId: repo.id,
      prNumber: number,
      owner: owner!,
      repo: repoName!,
    });

    // Mark webhook as processed
    await query(
      `UPDATE webhook_events 
       SET processed = true, processed_at = NOW()
       WHERE repository_id = $1 AND event_type = 'pull_request' 
         AND (payload->>'number')::int = $2
       ORDER BY created_at DESC LIMIT 1`,
      [repo.id, number]
    );

    logger.info(`Auto-review triggered for PR #${number}`);
  } catch (error) {
    logger.error(`Failed to trigger auto-review for PR #${number}:`, error);
  }
}

/**
 * @swagger
 * /api/webhooks/test:
 *   post:
 *     summary: Test webhook endpoint
 *     tags: [Webhooks]
 *     security: []
 *     responses:
 *       200:
 *         description: Test successful
 */
router.post('/test', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
