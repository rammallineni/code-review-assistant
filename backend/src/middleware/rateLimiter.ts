import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { RateLimitError } from './errorHandler.js';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests, please try again later.',
    statusCode: 429,
  },
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many requests, please try again later.'));
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Stricter rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later.',
    statusCode: 429,
  },
});

// Rate limiter for AI review endpoint (more restrictive due to cost)
export const reviewRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 reviews per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Review limit reached. Please try again later.',
    statusCode: 429,
  },
});

// Rate limiter for GitHub API calls
export const githubRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'GitHub API rate limit reached. Please try again shortly.',
    statusCode: 429,
  },
});
