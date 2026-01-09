import { Router, Request, Response } from 'express';
import { getPool } from '../database/connection.js';
import { getRedis, isRedisEnabled } from '../config/redis.js';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (_req: Request, res: Response) => {
  const checks = {
    status: 'healthy' as 'healthy' | 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'unknown' as 'up' | 'down' | 'unknown' | 'disabled', latency: 0 },
      redis: { status: 'unknown' as 'up' | 'down' | 'unknown' | 'disabled', latency: 0 },
    },
  };

  // Check database
  try {
    const start = Date.now();
    const pool = getPool();
    await pool.query('SELECT 1');
    checks.services.database = {
      status: 'up',
      latency: Date.now() - start,
    };
  } catch {
    checks.services.database = { status: 'down', latency: 0 };
    checks.status = 'unhealthy';
  }

  // Check Redis (optional)
  if (isRedisEnabled()) {
    try {
      const start = Date.now();
      const redis = getRedis();
      if (redis) {
        await redis.ping();
        checks.services.redis = {
          status: 'up',
          latency: Date.now() - start,
        };
      }
    } catch {
      checks.services.redis = { status: 'down', latency: 0 };
      // Don't mark as unhealthy - Redis is optional
    }
  } else {
    checks.services.redis = { status: 'disabled', latency: 0 };
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness check endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    
    // Only check Redis if it's enabled
    if (isRedisEnabled()) {
      const redis = getRedis();
      if (redis) {
        await redis.ping();
      }
    }

    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness check endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({ alive: true });
});

export default router;
