import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { getGitHubAuthUrl, exchangeCodeForToken, GitHubService } from '../services/github.service.js';
import { findOrCreateUser, findUserById } from '../services/user.service.js';
import { encrypt } from '../utils/encryption.js';
import { generateSecureToken } from '../utils/encryption.js';
import { cache, CACHE_TTL } from '../config/redis.js';
import { AppError, UnauthorizedError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth flow
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to GitHub authorization page
 */
router.get('/github', authRateLimiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = generateSecureToken(16);
    
    // Store state in Redis for verification
    await cache.set(`oauth:state:${state}`, { created: Date.now() }, CACHE_TTL.SHORT);
    
    const authUrl = getGitHubAuthUrl(state);
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 *       400:
 *         description: Invalid state or code
 */
router.get('/github/callback', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      throw new AppError(`GitHub OAuth error: ${error_description ?? error}`, 400);
    }

    if (!code || !state) {
      throw new AppError('Missing code or state parameter', 400);
    }

    // Verify state
    const storedState = await cache.get(`oauth:state:${state}`);
    if (!storedState) {
      throw new AppError('Invalid or expired state parameter', 400);
    }
    await cache.del(`oauth:state:${state}`);

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code as string);
    
    // Get user info from GitHub
    const encryptedToken = encrypt(tokenResponse.access_token);
    const github = new GitHubService(encryptedToken);
    const githubUser = await github.getUser();

    // Create or update user
    const user = await findOrCreateUser({
      githubId: String(githubUser.id),
      username: githubUser.login,
      email: githubUser.email,
      name: githubUser.name,
      avatarUrl: githubUser.avatar_url,
      accessToken: tokenResponse.access_token,
    });

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      githubId: user.githubId,
      username: user.username,
    });

    // Redirect to frontend with token
    const redirectUrl = new URL('/auth/callback', config.frontendUrl);
    redirectUrl.searchParams.set('token', token);
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.user!.userId);
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', authenticate, async (_req: Request, res: Response) => {
  // With JWT, logout is typically handled client-side by removing the token
  // Here we could add the token to a blacklist if needed
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify token validity
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Token is invalid
 */
router.get('/verify', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user,
    },
  });
});

export default router;
