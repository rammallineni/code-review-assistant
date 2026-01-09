import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { githubRateLimiter } from '../middleware/rateLimiter.js';
import { GitHubService } from '../services/github.service.js';
import { getUserAccessToken } from '../services/user.service.js';
import {
  listUserRepositories,
  createRepository,
  findRepositoryByGitHubId,
  findRepositoryById,
  updateRepository,
  deleteRepository,
} from '../services/repository.service.js';
import { validate, paginationSchema, repositoryParamsSchema } from '../utils/validation.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/repositories:
 *   get:
 *     summary: List user's connected repositories
 *     tags: [Repositories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of repositories
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = validate(paginationSchema, req.query);
    const result = await listUserRepositories(req.user!.userId, page, limit);

    res.json({
      success: true,
      data: result.repositories,
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
 * /api/repositories/github:
 *   get:
 *     summary: List repositories from GitHub
 *     tags: [Repositories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of GitHub repositories
 */
router.get('/github', githubRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const accessToken = await getUserAccessToken(req.user!.userId);
    const github = new GitHubService(accessToken);
    
    const repos = await github.listRepositories(page);

    res.json({
      success: true,
      data: repos,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/repositories/connect:
 *   post:
 *     summary: Connect a GitHub repository
 *     tags: [Repositories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [owner, repo]
 *             properties:
 *               owner:
 *                 type: string
 *               repo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Repository connected
 */
router.post('/connect', githubRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo } = validate(repositoryParamsSchema, req.body);
    const accessToken = await getUserAccessToken(req.user!.userId);
    const github = new GitHubService(accessToken);
    
    // Get repo details from GitHub
    const githubRepo = await github.getRepository(owner, repo);

    // Check if already connected
    const existing = await findRepositoryByGitHubId(String(githubRepo.id));
    if (existing) {
      return res.json({
        success: true,
        data: existing,
        message: 'Repository already connected',
      });
    }

    // Create repository record
    const repository = await createRepository({
      githubId: String(githubRepo.id),
      userId: req.user!.userId,
      name: githubRepo.name,
      fullName: githubRepo.fullName,
      description: githubRepo.description,
      isPrivate: githubRepo.private,
      defaultBranch: githubRepo.defaultBranch,
      language: githubRepo.language,
    });

    res.status(201).json({
      success: true,
      data: repository,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/repositories/{id}:
 *   get:
 *     summary: Get repository details
 *     tags: [Repositories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repository details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repository = await findRepositoryById(req.params['id']!);
    
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }

    if (repository.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    res.json({
      success: true,
      data: repository,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/repositories/{id}:
 *   patch:
 *     summary: Update repository settings
 *     tags: [Repositories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoReview:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Repository updated
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repository = await findRepositoryById(req.params['id']!);
    
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }

    if (repository.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    const updateSchema = z.object({
      autoReview: z.boolean().optional(),
    });

    const data = validate(updateSchema, req.body);
    const updated = await updateRepository(repository.id, data);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/repositories/{id}:
 *   delete:
 *     summary: Disconnect repository
 *     tags: [Repositories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repository disconnected
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repository = await findRepositoryById(req.params['id']!);
    
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }

    if (repository.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    await deleteRepository(repository.id);

    res.json({
      success: true,
      message: 'Repository disconnected',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/repositories/{id}/pull-requests:
 *   get:
 *     summary: List pull requests for a repository
 *     tags: [Repositories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *           enum: [open, closed, all]
 *           default: open
 *     responses:
 *       200:
 *         description: List of pull requests
 */
router.get('/:id/pull-requests', githubRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repository = await findRepositoryById(req.params['id']!);
    
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }

    if (repository.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    const state = (req.query['state'] as 'open' | 'closed' | 'all') || 'open';
    const page = parseInt(req.query['page'] as string) || 1;
    
    const accessToken = await getUserAccessToken(req.user!.userId);
    const github = new GitHubService(accessToken);
    
    const [owner, repo] = repository.fullName.split('/');
    const pullRequests = await github.listPullRequests(owner!, repo!, state, page);

    res.json({
      success: true,
      data: pullRequests,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
