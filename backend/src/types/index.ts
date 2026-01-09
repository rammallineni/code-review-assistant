// User types
export interface User {
  id: string;
  githubId: string;
  username: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithTokens extends User {
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
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
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  completedAt: Date | null;
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
  resolvedAt: Date | null;
  createdAt: Date;
}

// Settings types
export interface Setting {
  id: string;
  userId: string | null;
  repositoryId: string | null;
  settingKey: string;
  settingValue: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

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

// GitHub types
export interface GitHubPullRequest {
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

export interface GitHubFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  rawUrl?: string;
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

// AI Analysis types
export interface CodeAnalysisRequest {
  files: FileAnalysis[];
  language: string;
  prContext: {
    title: string;
    description: string | null;
    author: string;
  };
  settings: ReviewSettings;
}

export interface FileAnalysis {
  filename: string;
  patch: string;
  language: string;
  fullContent?: string;
}

export interface AnalysisResult {
  summary: string;
  issues: AnalyzedIssue[];
  metrics: {
    filesAnalyzed: number;
    linesAnalyzed: number;
    processingTimeMs: number;
  };
}

export interface AnalyzedIssue {
  filePath: string;
  lineStart: number;
  lineEnd?: number;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  suggestion?: string;
  codeSnippet?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthPayload {
  userId: string;
  githubId: string;
  username: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
