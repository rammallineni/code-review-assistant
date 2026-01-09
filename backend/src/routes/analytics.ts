import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserOverviewStats,
  getCategoryBreakdown,
  getSeverityBreakdown,
  getReviewTimeSeries,
  getRepositoryStats,
  getTopIssueTypes,
  getResolutionRate,
} from '../services/analytics.service.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get overview statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Overview statistics
 */
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getUserOverviewStats(req.user!.userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/categories:
 *   get:
 *     summary: Get issue breakdown by category
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Category breakdown
 */
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const breakdown = await getCategoryBreakdown(req.user!.userId);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/severity:
 *   get:
 *     summary: Get issue breakdown by severity
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Severity breakdown
 */
router.get('/severity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const breakdown = await getSeverityBreakdown(req.user!.userId);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/timeline:
 *   get:
 *     summary: Get review timeline data
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Timeline data
 */
router.get('/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query['days'] as string) || 30;
    const timeline = await getReviewTimeSeries(req.user!.userId, days);

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/repositories:
 *   get:
 *     summary: Get statistics by repository
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Repository statistics
 */
router.get('/repositories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getRepositoryStats(req.user!.userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/top-issues:
 *   get:
 *     summary: Get most common issue types
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top issue types
 */
router.get('/top-issues', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query['limit'] as string) || 10;
    const issues = await getTopIssueTypes(req.user!.userId, limit);

    res.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/resolution-rate:
 *   get:
 *     summary: Get issue resolution rate
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Resolution rate data
 */
router.get('/resolution-rate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rate = await getResolutionRate(req.user!.userId);

    res.json({
      success: true,
      data: rate,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get all dashboard data
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Complete dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const [
      overview,
      categories,
      severity,
      timeline,
      repositories,
      topIssues,
      resolutionRate,
    ] = await Promise.all([
      getUserOverviewStats(userId),
      getCategoryBreakdown(userId),
      getSeverityBreakdown(userId),
      getReviewTimeSeries(userId, 30),
      getRepositoryStats(userId),
      getTopIssueTypes(userId, 5),
      getResolutionRate(userId),
    ]);

    res.json({
      success: true,
      data: {
        overview,
        categories,
        severity,
        timeline,
        repositories,
        topIssues,
        resolutionRate,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
