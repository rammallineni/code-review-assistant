import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const repositoryParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

export const prParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  prNumber: z.coerce.number().int().min(1),
});

// Settings validation
export const severitySchema = z.enum(['critical', 'warning', 'info']);
export const categorySchema = z.enum(['security', 'performance', 'style', 'bug', 'best_practice', 'other']);

export const customRuleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  pattern: z.string().min(1),
  message: z.string().min(1).max(500),
  severity: severitySchema,
  category: categorySchema,
  enabled: z.boolean().default(true),
});

export const languageSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  lintingEnabled: z.boolean().default(true),
  maxFileSize: z.number().int().min(1000).max(1000000).default(100000),
  excludePatterns: z.array(z.string()).default([]),
});

export const reviewSettingsSchema = z.object({
  enabledCategories: z.array(categorySchema).default(['security', 'performance', 'style', 'bug', 'best_practice']),
  severityThreshold: severitySchema.default('info'),
  ignoredFiles: z.array(z.string()).default([]),
  ignoredPatterns: z.array(z.string()).default([]),
  customRules: z.array(customRuleSchema).default([]),
  languageSettings: z.record(z.string(), languageSettingsSchema).default({}),
});

// Webhook validation
export const webhookConfigSchema = z.object({
  enabled: z.boolean(),
  events: z.array(z.enum(['pull_request', 'push'])).default(['pull_request']),
  autoReview: z.boolean().default(false),
});

// Review request validation
export const createReviewSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  prNumber: z.coerce.number().int().min(1),
  settings: reviewSettingsSchema.optional(),
});

// Helper function to validate and parse
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Helper to safely parse (returns null on error)
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
