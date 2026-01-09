import { query, withTransaction, getClient } from '../database/connection.js';
import { Review, Issue, ReviewStatus, ReviewSettings } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { GitHubService } from './github.service.js';
import { analyzeCode, detectLanguage } from './ai.service.js';
import { getUserAccessToken } from './user.service.js';
import { findRepositoryById } from './repository.service.js';
import { getSettings, DEFAULT_REVIEW_SETTINGS } from './settings.service.js';
import { logger } from '../config/logger.js';

interface ReviewRow {
  id: string;
  repository_id: string;
  user_id: string;
  pr_number: number;
  pr_title: string | null;
  pr_url: string | null;
  pr_author: string | null;
  head_sha: string | null;
  base_sha: string | null;
  status: ReviewStatus;
  summary: string | null;
  total_issues: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  files_reviewed: number;
  lines_reviewed: number;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
}

interface IssueRow {
  id: string;
  review_id: string;
  file_path: string;
  line_start: number | null;
  line_end: number | null;
  severity: Issue['severity'];
  category: Issue['category'];
  title: string;
  description: string;
  suggestion: string | null;
  code_snippet: string | null;
  language: string | null;
  is_resolved: boolean;
  resolved_at: Date | null;
  created_at: Date;
}

function mapRowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    repositoryId: row.repository_id,
    userId: row.user_id,
    prNumber: row.pr_number,
    prTitle: row.pr_title,
    prUrl: row.pr_url,
    prAuthor: row.pr_author,
    headSha: row.head_sha,
    baseSha: row.base_sha,
    status: row.status,
    summary: row.summary,
    totalIssues: row.total_issues,
    criticalCount: row.critical_count,
    warningCount: row.warning_count,
    infoCount: row.info_count,
    filesReviewed: row.files_reviewed,
    linesReviewed: row.lines_reviewed,
    processingTimeMs: row.processing_time_ms,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function mapRowToIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    reviewId: row.review_id,
    filePath: row.file_path,
    lineStart: row.line_start,
    lineEnd: row.line_end,
    severity: row.severity,
    category: row.category,
    title: row.title,
    description: row.description,
    suggestion: row.suggestion,
    codeSnippet: row.code_snippet,
    language: row.language,
    isResolved: row.is_resolved,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

export async function findReviewById(id: string): Promise<Review | null> {
  const result = await query<ReviewRow>(
    'SELECT * FROM reviews WHERE id = $1',
    [id]
  );
  
  const row = result.rows[0];
  return row ? mapRowToReview(row) : null;
}

export async function findReviewWithIssues(
  id: string
): Promise<{ review: Review; issues: Issue[] } | null> {
  const [reviewResult, issuesResult] = await Promise.all([
    query<ReviewRow>('SELECT * FROM reviews WHERE id = $1', [id]),
    query<IssueRow>('SELECT * FROM issues WHERE review_id = $1 ORDER BY severity, created_at', [id]),
  ]);

  const reviewRow = reviewResult.rows[0];
  if (!reviewRow) return null;

  return {
    review: mapRowToReview(reviewRow),
    issues: issuesResult.rows.map(mapRowToIssue),
  };
}

export async function listReviews(
  filters: {
    userId?: string;
    repositoryId?: string;
    status?: ReviewStatus;
  },
  page: number = 1,
  limit: number = 20
): Promise<{ reviews: Review[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (filters.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    values.push(filters.userId);
  }
  if (filters.repositoryId) {
    conditions.push(`repository_id = $${paramIndex++}`);
    values.push(filters.repositoryId);
  }
  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    query<ReviewRow>(
      `SELECT * FROM reviews ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...values, limit, offset]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM reviews ${whereClause}`,
      values
    ),
  ]);

  return {
    reviews: dataResult.rows.map(mapRowToReview),
    total: parseInt(countResult.rows[0]?.count ?? '0', 10),
  };
}

export async function getIssuesForReview(reviewId: string): Promise<Issue[]> {
  const result = await query<IssueRow>(
    'SELECT * FROM issues WHERE review_id = $1 ORDER BY severity, file_path, line_start',
    [reviewId]
  );
  
  return result.rows.map(mapRowToIssue);
}

interface CreateReviewParams {
  userId: string;
  repositoryId: string;
  prNumber: number;
  owner: string;
  repo: string;
}

export async function createAndRunReview(params: CreateReviewParams): Promise<Review> {
  const { userId, repositoryId, prNumber, owner, repo } = params;

  // Get user's access token
  const accessToken = await getUserAccessToken(userId);
  const github = new GitHubService(accessToken);

  // Get PR details
  const pr = await github.getPullRequest(owner, repo, prNumber);
  
  // Check if review already exists for this SHA
  const existingResult = await query<ReviewRow>(
    `SELECT * FROM reviews 
     WHERE repository_id = $1 AND pr_number = $2 AND head_sha = $3`,
    [repositoryId, prNumber, pr.head.sha]
  );

  if (existingResult.rows[0]) {
    return mapRowToReview(existingResult.rows[0]);
  }

  // Create review record
  const reviewResult = await query<ReviewRow>(
    `INSERT INTO reviews (
      repository_id, user_id, pr_number, pr_title, pr_url, pr_author,
      head_sha, base_sha, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
    RETURNING *`,
    [
      repositoryId,
      userId,
      prNumber,
      pr.title,
      pr.htmlUrl,
      pr.user.login,
      pr.head.sha,
      pr.base.sha,
    ]
  );

  const review = mapRowToReview(reviewResult.rows[0]!);

  // Process review asynchronously
  processReview(review.id, userId, owner, repo, prNumber).catch((error) => {
    logger.error(`Failed to process review ${review.id}:`, error);
  });

  return review;
}

async function processReview(
  reviewId: string,
  userId: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  const startTime = Date.now();

  try {
    // Update status to in_progress
    await query(
      `UPDATE reviews SET status = 'in_progress' WHERE id = $1`,
      [reviewId]
    );

    // Get user's access token and settings
    const accessToken = await getUserAccessToken(userId);
    const github = new GitHubService(accessToken);

    // Get PR and files
    const [pr, files] = await Promise.all([
      github.getPullRequest(owner, repo, prNumber),
      github.getPullRequestFiles(owner, repo, prNumber),
    ]);

    // Get review settings
    const repository = await findRepositoryById((await findReviewById(reviewId))!.repositoryId);
    const settings = repository
      ? await getSettings(userId, repository.id)
      : DEFAULT_REVIEW_SETTINGS;

    // Prepare files for analysis
    const analysisFiles = files
      .filter((f) => f.patch && f.status !== 'removed')
      .map((f) => ({
        filename: f.filename,
        patch: f.patch!,
        language: detectLanguage(f.filename),
      }));

    if (analysisFiles.length === 0) {
      await query(
        `UPDATE reviews SET
          status = 'completed',
          summary = 'No analyzable files in this pull request',
          completed_at = NOW()
        WHERE id = $1`,
        [reviewId]
      );
      return;
    }

    // Run AI analysis
    const result = await analyzeCode({
      files: analysisFiles,
      language: analysisFiles[0]?.language ?? 'unknown',
      prContext: {
        title: pr.title,
        description: pr.body,
        author: pr.user.login,
      },
      settings,
    });

    // Save issues
    const client = await getClient();
    try {
      await client.query('BEGIN');

      for (const issue of result.issues) {
        await client.query(
          `INSERT INTO issues (
            review_id, file_path, line_start, line_end, severity,
            category, title, description, suggestion, code_snippet, language
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            reviewId,
            issue.filePath,
            issue.lineStart,
            issue.lineEnd ?? issue.lineStart,
            issue.severity,
            issue.category,
            issue.title,
            issue.description,
            issue.suggestion ?? null,
            issue.codeSnippet ?? null,
            detectLanguage(issue.filePath),
          ]
        );
      }

      // Count issues by severity
      const criticalCount = result.issues.filter((i) => i.severity === 'critical').length;
      const warningCount = result.issues.filter((i) => i.severity === 'warning').length;
      const infoCount = result.issues.filter((i) => i.severity === 'info').length;

      // Update review
      await client.query(
        `UPDATE reviews SET
          status = 'completed',
          summary = $1,
          total_issues = $2,
          critical_count = $3,
          warning_count = $4,
          info_count = $5,
          files_reviewed = $6,
          lines_reviewed = $7,
          processing_time_ms = $8,
          completed_at = NOW()
        WHERE id = $9`,
        [
          result.summary,
          result.issues.length,
          criticalCount,
          warningCount,
          infoCount,
          result.metrics.filesAnalyzed,
          result.metrics.linesAnalyzed,
          Date.now() - startTime,
          reviewId,
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    logger.info(`Review ${reviewId} completed in ${Date.now() - startTime}ms`);
  } catch (error) {
    logger.error(`Review ${reviewId} failed:`, error);
    
    await query(
      `UPDATE reviews SET
        status = 'failed',
        error_message = $1,
        processing_time_ms = $2
      WHERE id = $3`,
      [
        error instanceof Error ? error.message : 'Unknown error',
        Date.now() - startTime,
        reviewId,
      ]
    );
  }
}

export async function resolveIssue(issueId: string): Promise<Issue> {
  const result = await query<IssueRow>(
    `UPDATE issues SET is_resolved = true, resolved_at = NOW()
     WHERE id = $1 RETURNING *`,
    [issueId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError('Issue not found');
  }
  
  return mapRowToIssue(row);
}

export async function unresolveIssue(issueId: string): Promise<Issue> {
  const result = await query<IssueRow>(
    `UPDATE issues SET is_resolved = false, resolved_at = NULL
     WHERE id = $1 RETURNING *`,
    [issueId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError('Issue not found');
  }
  
  return mapRowToIssue(row);
}

export async function deleteReview(reviewId: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
  });
}
