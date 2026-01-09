import { Octokit } from 'octokit';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { cache, CACHE_TTL } from '../config/redis.js';
import { decrypt } from '../utils/encryption.js';
import { 
  GitHubRepository, 
  GitHubPullRequest, 
  GitHubFile 
} from '../types/index.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    const decryptedToken = decrypt(accessToken);
    this.octokit = new Octokit({ auth: decryptedToken });
  }

  // Get authenticated user info
  async getUser(): Promise<{
    id: number;
    login: string;
    email: string | null;
    name: string | null;
    avatar_url: string;
  }> {
    const { data } = await this.octokit.rest.users.getAuthenticated();
    return {
      id: data.id,
      login: data.login,
      email: data.email,
      name: data.name,
      avatar_url: data.avatar_url,
    };
  }

  // List repositories for authenticated user
  async listRepositories(
    page: number = 1,
    perPage: number = 30
  ): Promise<GitHubRepository[]> {
    const cacheKey = cache.generateKey('github', 'repos', String(page), String(perPage));
    
    const cached = await cache.get<GitHubRepository[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      direction: 'desc',
      per_page: perPage,
      page,
    });

    const repos: GitHubRepository[] = data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      defaultBranch: repo.default_branch,
      language: repo.language,
      htmlUrl: repo.html_url,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
    }));

    await cache.set(cacheKey, repos, CACHE_TTL.REPO_LIST);
    return repos;
  }

  // Get single repository
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const cacheKey = cache.generateKey('github', 'repo', owner, repo);
    
    const cached = await cache.get<GitHubRepository>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data } = await this.octokit.rest.repos.get({ owner, repo });
      
      const repository: GitHubRepository = {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        private: data.private,
        defaultBranch: data.default_branch,
        language: data.language,
        htmlUrl: data.html_url,
        owner: {
          login: data.owner.login,
          avatarUrl: data.owner.avatar_url,
        },
      };

      await cache.set(cacheKey, repository, CACHE_TTL.MEDIUM);
      return repository;
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        throw new NotFoundError(`Repository ${owner}/${repo} not found`);
      }
      throw error;
    }
  }

  // List pull requests for a repository
  async listPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open',
    page: number = 1,
    perPage: number = 30
  ): Promise<GitHubPullRequest[]> {
    const cacheKey = cache.generateKey('github', 'prs', owner, repo, state, String(page));
    
    const cached = await cache.get<GitHubPullRequest[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state,
      sort: 'updated',
      direction: 'desc',
      per_page: perPage,
      page,
    });

    const prs: GitHubPullRequest[] = data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      htmlUrl: pr.html_url,
      user: {
        login: pr.user?.login ?? 'unknown',
        avatarUrl: pr.user?.avatar_url ?? '',
      },
      head: {
        sha: pr.head.sha,
        ref: pr.head.ref,
      },
      base: {
        sha: pr.base.sha,
        ref: pr.base.ref,
      },
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      changedFiles: pr.changed_files ?? 0,
    }));

    await cache.set(cacheKey, prs, CACHE_TTL.PR_DATA);
    return prs;
  }

  // Get single pull request
  async getPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<GitHubPullRequest> {
    const cacheKey = cache.generateKey('github', 'pr', owner, repo, String(prNumber));
    
    const cached = await cache.get<GitHubPullRequest>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data } = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      const pr: GitHubPullRequest = {
        number: data.number,
        title: data.title,
        body: data.body,
        state: data.state,
        htmlUrl: data.html_url,
        user: {
          login: data.user?.login ?? 'unknown',
          avatarUrl: data.user?.avatar_url ?? '',
        },
        head: {
          sha: data.head.sha,
          ref: data.head.ref,
        },
        base: {
          sha: data.base.sha,
          ref: data.base.ref,
        },
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        additions: data.additions,
        deletions: data.deletions,
        changedFiles: data.changed_files,
      };

      await cache.set(cacheKey, pr, CACHE_TTL.PR_DATA);
      return pr;
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        throw new NotFoundError(`Pull request #${prNumber} not found in ${owner}/${repo}`);
      }
      throw error;
    }
  }

  // Get files changed in a pull request
  async getPullRequestFiles(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<GitHubFile[]> {
    const cacheKey = cache.generateKey('github', 'pr-files', owner, repo, String(prNumber));
    
    const cached = await cache.get<GitHubFile[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { data } = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    const files: GitHubFile[] = data.map((file) => ({
      filename: file.filename,
      status: file.status as GitHubFile['status'],
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
      rawUrl: file.raw_url,
    }));

    await cache.set(cacheKey, files, CACHE_TTL.PR_DATA);
    return files;
  }

  // Get file content
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      
      throw new AppError('File content not available');
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        throw new NotFoundError(`File ${path} not found`);
      }
      throw error;
    }
  }

  // Create webhook for repository
  async createWebhook(
    owner: string,
    repo: string,
    webhookUrl: string
  ): Promise<number> {
    const { data } = await this.octokit.rest.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret: config.github.webhookSecret,
      },
      events: ['pull_request'],
      active: true,
    });

    logger.info(`Created webhook ${data.id} for ${owner}/${repo}`);
    return data.id;
  }

  // Delete webhook
  async deleteWebhook(
    owner: string,
    repo: string,
    hookId: number
  ): Promise<void> {
    await this.octokit.rest.repos.deleteWebhook({
      owner,
      repo,
      hook_id: hookId,
    });

    logger.info(`Deleted webhook ${hookId} for ${owner}/${repo}`);
  }

  // Create a review comment on a PR
  async createReviewComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
    commitId: string,
    path: string,
    line: number
  ): Promise<void> {
    await this.octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: prNumber,
      body,
      commit_id: commitId,
      path,
      line,
    });
  }

  // Create a PR review
  async createReview(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' = 'COMMENT'
  ): Promise<void> {
    await this.octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      body,
      event,
    });
  }
}

// OAuth helper functions
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  scope: string;
}> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new AppError('Failed to exchange code for token');
  }

  const data = await response.json() as { 
    access_token?: string; 
    token_type?: string; 
    scope?: string;
    error?: string;
  };
  
  if (data.error) {
    throw new AppError(`GitHub OAuth error: ${data.error}`);
  }

  return {
    access_token: data.access_token ?? '',
    token_type: data.token_type ?? 'bearer',
    scope: data.scope ?? '',
  };
}

export function getGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: 'read:user user:email repo',
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}
