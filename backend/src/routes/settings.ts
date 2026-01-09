import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getSettings,
  updateUserSettings,
  updateRepositorySettings,
  DEFAULT_REVIEW_SETTINGS,
} from '../services/settings.service.js';
import { findRepositoryById } from '../services/repository.service.js';
import { validate, reviewSettingsSchema, uuidSchema } from '../utils/validation.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: User settings
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettings(req.user!.userId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = validate(reviewSettingsSchema.partial(), req.body);
    const updated = await updateUserSettings(req.user!.userId, settings);

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
 * /api/settings/defaults:
 *   get:
 *     summary: Get default settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Default settings
 */
router.get('/defaults', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: DEFAULT_REVIEW_SETTINGS,
  });
});

/**
 * @swagger
 * /api/settings/repository/{repositoryId}:
 *   get:
 *     summary: Get repository-specific settings
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: repositoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repository settings
 */
router.get('/repository/:repositoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repositoryId = validate(uuidSchema, req.params['repositoryId']);
    
    const repository = await findRepositoryById(repositoryId);
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }

    if (repository.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    const settings = await getSettings(req.user!.userId, repositoryId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/settings/repository/{repositoryId}:
 *   put:
 *     summary: Update repository-specific settings
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: repositoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/repository/:repositoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repositoryId = validate(uuidSchema, req.params['repositoryId']);
    
    const repository = await findRepositoryById(repositoryId);
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }

    if (repository.userId !== req.user!.userId) {
      throw new ForbiddenError('Access denied');
    }

    const settings = validate(reviewSettingsSchema.partial(), req.body);
    await updateRepositorySettings(repositoryId, settings);

    const updated = await getSettings(req.user!.userId, repositoryId);

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
 * /api/settings/reset:
 *   post:
 *     summary: Reset user settings to defaults
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings reset
 */
router.post('/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await updateUserSettings(req.user!.userId, DEFAULT_REVIEW_SETTINGS);

    res.json({
      success: true,
      data: updated,
      message: 'Settings reset to defaults',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
