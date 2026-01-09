// User types
export interface User {
  id: string;
  githubId: string;
  username: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Repository types
export interface Repository {
  id: string;
  githubId: string;
  userId: string;
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  defaultBranch: string;
  language: string | null;
  webhookId: string | null;
  webhookActive: boolean;
  autoReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  language: string | null;
  htmlUrl: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

// Pull Request types
export interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  state: string;
  htmlUrl: string;
  user: {
    login: string;
    avatarUrl: string;
  };
  head: {
    sha: string;
    ref: string;
  };
  base: {
    sha: string;
    ref: string;
  };
  createdAt: string;
  updatedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
}

// Review types
export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Review {
  id: string;
  repositoryId: string;
  userId: string;
  prNumber: number;
  prTitle: string | null;
  prUrl: string | null;
  prAuthor: string | null;
  headSha: string | null;
  baseSha: string | null;
  status: ReviewStatus;
  summary: string | null;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  filesReviewed: number;
  linesReviewed: number;
  processingTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

// Issue types
export type IssueSeverity = 'critical' | 'warning' | 'info';
export type IssueCategory = 'security' | 'performance' | 'style' | 'bug' | 'best_practice' | 'other';

export interface Issue {
  id: string;
  reviewId: string;
  filePath: string;
  lineStart: number | null;
  lineEnd: number | null;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  suggestion: string | null;
  codeSnippet: string | null;
  language: string | null;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

// Settings types
export interface ReviewSettings {
  enabledCategories: IssueCategory[];
  severityThreshold: IssueSeverity;
  ignoredFiles: string[];
  ignoredPatterns: string[];
  customRules: CustomRule[];
  languageSettings: Record<string, LanguageSettings>;
}

export interface CustomRule {
  id: string;
  name: string;
  pattern: string;
  message: string;
  severity: IssueSeverity;
  category: IssueCategory;
  enabled: boolean;
}

export interface LanguageSettings {
  enabled: boolean;
  lintingEnabled: boolean;
  maxFileSize: number;
  excludePatterns: string[];
}

// Analytics types
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
  lastReviewDate: string | null;
}

export interface DashboardData {
  overview: OverviewStats;
  categories: CategoryBreakdown[];
  severity: SeverityBreakdown[];
  timeline: TimeSeriesPoint[];
  repositories: RepositoryStats[];
  topIssues: { title: string; count: number }[];
  resolutionRate: {
    resolved: number;
    unresolved: number;
    rate: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
