import { query } from '../database/connection.js';

export interface OverviewStats {
  totalReviews: number;
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  averageIssuesPerReview: number;
  averageProcessingTime: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface SeverityBreakdown {
  severity: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  date: string;
  reviews: number;
  issues: number;
}

export interface RepositoryStats {
  repositoryId: string;
  repositoryName: string;
  totalReviews: number;
  totalIssues: number;
  lastReviewDate: Date | null;
}

export async function getUserOverviewStats(userId: string): Promise<OverviewStats> {
  const result = await query<{
    total_reviews: string;
    total_issues: string;
    critical_issues: string;
    warning_issues: string;
    info_issues: string;
    avg_processing_time: string | null;
  }>(
    `SELECT 
      COUNT(DISTINCT r.id) as total_reviews,
      COUNT(i.id) as total_issues,
      COALESCE(SUM(r.critical_count), 0) as critical_issues,
      COALESCE(SUM(r.warning_count), 0) as warning_issues,
      COALESCE(SUM(r.info_count), 0) as info_issues,
      AVG(r.processing_time_ms) as avg_processing_time
    FROM reviews r
    LEFT JOIN issues i ON i.review_id = r.id
    WHERE r.user_id = $1 AND r.status = 'completed'`,
    [userId]
  );

  const row = result.rows[0];
  const totalReviews = parseInt(row?.total_reviews ?? '0', 10);
  const totalIssues = parseInt(row?.total_issues ?? '0', 10);

  return {
    totalReviews,
    totalIssues,
    criticalIssues: parseInt(row?.critical_issues ?? '0', 10),
    warningIssues: parseInt(row?.warning_issues ?? '0', 10),
    infoIssues: parseInt(row?.info_issues ?? '0', 10),
    averageIssuesPerReview: totalReviews > 0 ? totalIssues / totalReviews : 0,
    averageProcessingTime: parseFloat(row?.avg_processing_time ?? '0'),
  };
}

export async function getCategoryBreakdown(userId: string): Promise<CategoryBreakdown[]> {
  const result = await query<{ category: string; count: string }>(
    `SELECT i.category, COUNT(*) as count
     FROM issues i
     JOIN reviews r ON r.id = i.review_id
     WHERE r.user_id = $1 AND r.status = 'completed'
     GROUP BY i.category
     ORDER BY count DESC`,
    [userId]
  );

  const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

  return result.rows.map((row) => ({
    category: row.category,
    count: parseInt(row.count, 10),
    percentage: total > 0 ? (parseInt(row.count, 10) / total) * 100 : 0,
  }));
}

export async function getSeverityBreakdown(userId: string): Promise<SeverityBreakdown[]> {
  const result = await query<{ severity: string; count: string }>(
    `SELECT i.severity, COUNT(*) as count
     FROM issues i
     JOIN reviews r ON r.id = i.review_id
     WHERE r.user_id = $1 AND r.status = 'completed'
     GROUP BY i.severity
     ORDER BY 
       CASE i.severity
         WHEN 'critical' THEN 1
         WHEN 'warning' THEN 2
         WHEN 'info' THEN 3
       END`,
    [userId]
  );

  const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

  return result.rows.map((row) => ({
    severity: row.severity,
    count: parseInt(row.count, 10),
    percentage: total > 0 ? (parseInt(row.count, 10) / total) * 100 : 0,
  }));
}

export async function getReviewTimeSeries(
  userId: string,
  days: number = 30
): Promise<TimeSeriesPoint[]> {
  const result = await query<{ date: Date; reviews: string; issues: string }>(
    `SELECT 
      DATE(r.created_at) as date,
      COUNT(DISTINCT r.id) as reviews,
      COALESCE(SUM(r.total_issues), 0) as issues
     FROM reviews r
     WHERE r.user_id = $1 
       AND r.status = 'completed'
       AND r.created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(r.created_at)
     ORDER BY date`,
    [userId]
  );

  return result.rows.map((row) => ({
    date: row.date.toISOString().split('T')[0]!,
    reviews: parseInt(row.reviews, 10),
    issues: parseInt(row.issues, 10),
  }));
}

export async function getRepositoryStats(userId: string): Promise<RepositoryStats[]> {
  const result = await query<{
    repository_id: string;
    repository_name: string;
    total_reviews: string;
    total_issues: string;
    last_review_date: Date | null;
  }>(
    `SELECT 
      repo.id as repository_id,
      repo.full_name as repository_name,
      COUNT(DISTINCT r.id) as total_reviews,
      COALESCE(SUM(r.total_issues), 0) as total_issues,
      MAX(r.completed_at) as last_review_date
     FROM repositories repo
     LEFT JOIN reviews r ON r.repository_id = repo.id AND r.status = 'completed'
     WHERE repo.user_id = $1
     GROUP BY repo.id, repo.full_name
     ORDER BY total_reviews DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    repositoryId: row.repository_id,
    repositoryName: row.repository_name,
    totalReviews: parseInt(row.total_reviews, 10),
    totalIssues: parseInt(row.total_issues, 10),
    lastReviewDate: row.last_review_date,
  }));
}

export async function getTopIssueTypes(
  userId: string,
  limit: number = 10
): Promise<{ title: string; count: number }[]> {
  const result = await query<{ title: string; count: string }>(
    `SELECT i.title, COUNT(*) as count
     FROM issues i
     JOIN reviews r ON r.id = i.review_id
     WHERE r.user_id = $1 AND r.status = 'completed'
     GROUP BY i.title
     ORDER BY count DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map((row) => ({
    title: row.title,
    count: parseInt(row.count, 10),
  }));
}

export async function getResolutionRate(userId: string): Promise<{
  resolved: number;
  unresolved: number;
  rate: number;
}> {
  const result = await query<{ resolved: string; unresolved: string }>(
    `SELECT 
      COUNT(*) FILTER (WHERE i.is_resolved = true) as resolved,
      COUNT(*) FILTER (WHERE i.is_resolved = false) as unresolved
     FROM issues i
     JOIN reviews r ON r.id = i.review_id
     WHERE r.user_id = $1 AND r.status = 'completed'`,
    [userId]
  );

  const resolved = parseInt(result.rows[0]?.resolved ?? '0', 10);
  const unresolved = parseInt(result.rows[0]?.unresolved ?? '0', 10);
  const total = resolved + unresolved;

  return {
    resolved,
    unresolved,
    rate: total > 0 ? (resolved / total) * 100 : 0,
  };
}
