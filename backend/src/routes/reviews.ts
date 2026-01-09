import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { reviewRateLimiter } from '../middleware/rateLimiter.js';
import {
  createAndRunReview,
  findReviewById,
  findReviewWithIssues,
  listReviews,
  getIssuesForReview,
  resolveIssue,
  unresolveIssue,
  deleteReview,
} from '../services/review.service.js';
import { findRepositoryByFullName, findRepositoryById } from '../services/repository.service.js';
import { validate, paginationSchema, createReviewSchema, uuidSchema } from '../utils/validation.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: List reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: repositoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, failed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = validate(paginationSchema, req.query);
    
    const filters = {
      userId: req.user!.userId,
      repositoryId: req.query['repositoryId'] as string | undefined,
      status: req.query['status'] as 'pending' | 'in_progress' | 'completed' | 'failed' | undefined,
    };

    const result = await listReviews(filters, page, limit);

    res.json({
      success: true,
      data: result.reviews,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [owner, repo, prNumber]
 *             properties:
 *               owner:
 *                 type: string
 *               repo:
 *                 type: string
 *               prNumber:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Review created
 */
router.post('/', reviewRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, prNumber } = validate(createReviewSchema, req.body);
    
    // Find or create repository
    const fullName = `${owner}/${repo}`;
    let repository = await findRepositoryByFullName(fullName);
    
    if (!repository) {
      throw new NotFoundError(
        `Repository ${fullName} not connected. Please connect it first.`
      );
    }

    if (repository.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    const review = await createAndRunReview({
      userId: req.user!.userId,
      repositoryId: repository.id,
      prNumber,
      owner,
      repo,
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review details with issues
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review details with issues
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = validate(uuidSchema, req.params['id']);
    const result = await findReviewWithIssues(id);
    
    if (!result) {
      throw new NotFoundError('Review not found');
    }

    if (result.review.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews/{id}/issues:
 *   get:
 *     summary: Get issues for a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [critical, warning, info]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of issues
 */
router.get('/:id/issues', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = validate(uuidSchema, req.params['id']);
    const review = await findReviewById(id);
    
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    let issues = await getIssuesForReview(id);

    // Filter by severity
    const severity = req.query['severity'] as string;
    if (severity) {
      issues = issues.filter((i) => i.severity === severity);
    }

    // Filter by category
    const category = req.query['category'] as string;
    if (category) {
      issues = issues.filter((i) => i.category === category);
    }

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
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = validate(uuidSchema, req.params['id']);
    const review = await findReviewById(id);
    
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    await deleteReview(id);

    res.json({
      success: true,
      message: 'Review deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews/issues/{issueId}/resolve:
 *   post:
 *     summary: Mark an issue as resolved
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue resolved
 */
router.post('/issues/:issueId/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = validate(uuidSchema, req.params['issueId']);
    const issue = await resolveIssue(issueId);

    res.json({
      success: true,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews/issues/{issueId}/unresolve:
 *   post:
 *     summary: Mark an issue as unresolved
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue unresolved
 */
router.post('/issues/:issueId/unresolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = validate(uuidSchema, req.params['issueId']);
    const issue = await unresolveIssue(issueId);

    res.json({
      success: true,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
