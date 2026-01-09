import { query, withTransaction } from '../database/connection.js';
import { Repository } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';

interface RepositoryRow {
  id: string;
  github_id: string;
  user_id: string;
  name: string;
  full_name: string;
  description: string | null;
  is_private: boolean;
  default_branch: string;
  language: string | null;
  webhook_id: string | null;
  webhook_active: boolean;
  auto_review: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRowToRepository(row: RepositoryRow): Repository {
  return {
    id: row.id,
    githubId: row.github_id,
    userId: row.user_id,
    name: row.name,
    fullName: row.full_name,
    description: row.description,
    isPrivate: row.is_private,
    defaultBranch: row.default_branch,
    language: row.language,
    webhookId: row.webhook_id,
    webhookActive: row.webhook_active,
    autoReview: row.auto_review,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findRepositoryById(id: string): Promise<Repository | null> {
  const result = await query<RepositoryRow>(
    'SELECT * FROM repositories WHERE id = $1',
    [id]
  );
  
  const row = result.rows[0];
  return row ? mapRowToRepository(row) : null;
}

export async function findRepositoryByGitHubId(githubId: string): Promise<Repository | null> {
  const result = await query<RepositoryRow>(
    'SELECT * FROM repositories WHERE github_id = $1',
    [githubId]
  );
  
  const row = result.rows[0];
  return row ? mapRowToRepository(row) : null;
}

export async function findRepositoryByFullName(fullName: string): Promise<Repository | null> {
  const result = await query<RepositoryRow>(
    'SELECT * FROM repositories WHERE full_name = $1',
    [fullName]
  );
  
  const row = result.rows[0];
  return row ? mapRowToRepository(row) : null;
}

export async function listUserRepositories(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ repositories: Repository[]; total: number }> {
  const offset = (page - 1) * limit;
  
  const [dataResult, countResult] = await Promise.all([
    query<RepositoryRow>(
      `SELECT * FROM repositories WHERE user_id = $1 
       ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    query<{ count: string }>(
      'SELECT COUNT(*) as count FROM repositories WHERE user_id = $1',
      [userId]
    ),
  ]);

  return {
    repositories: dataResult.rows.map(mapRowToRepository),
    total: parseInt(countResult.rows[0]?.count ?? '0', 10),
  };
}

export interface CreateRepositoryData {
  githubId: string;
  userId: string;
  name: string;
  fullName: string;
  description?: string | null;
  isPrivate?: boolean;
  defaultBranch?: string;
  language?: string | null;
}

export async function createRepository(data: CreateRepositoryData): Promise<Repository> {
  const result = await query<RepositoryRow>(
    `INSERT INTO repositories (
      github_id, user_id, name, full_name, description,
      is_private, default_branch, language
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (github_id) DO UPDATE SET
      name = EXCLUDED.name,
      full_name = EXCLUDED.full_name,
      description = EXCLUDED.description,
      is_private = EXCLUDED.is_private,
      default_branch = EXCLUDED.default_branch,
      language = EXCLUDED.language
    RETURNING *`,
    [
      data.githubId,
      data.userId,
      data.name,
      data.fullName,
      data.description ?? null,
      data.isPrivate ?? false,
      data.defaultBranch ?? 'main',
      data.language ?? null,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create repository');
  }
  
  return mapRowToRepository(row);
}

export async function updateRepository(
  id: string,
  data: Partial<{
    description: string | null;
    defaultBranch: string;
    webhookId: string | null;
    webhookActive: boolean;
    autoReview: boolean;
  }>
): Promise<Repository> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.defaultBranch !== undefined) {
    fields.push(`default_branch = $${paramIndex++}`);
    values.push(data.defaultBranch);
  }
  if (data.webhookId !== undefined) {
    fields.push(`webhook_id = $${paramIndex++}`);
    values.push(data.webhookId);
  }
  if (data.webhookActive !== undefined) {
    fields.push(`webhook_active = $${paramIndex++}`);
    values.push(data.webhookActive);
  }
  if (data.autoReview !== undefined) {
    fields.push(`auto_review = $${paramIndex++}`);
    values.push(data.autoReview);
  }

  if (fields.length === 0) {
    const repo = await findRepositoryById(id);
    if (!repo) throw new NotFoundError('Repository not found');
    return repo;
  }

  values.push(id);

  const result = await query<RepositoryRow>(
    `UPDATE repositories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError('Repository not found');
  }
  
  return mapRowToRepository(row);
}

export async function deleteRepository(id: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM repositories WHERE id = $1', [id]);
  });
}

export async function findOrCreateRepository(
  data: CreateRepositoryData
): Promise<Repository> {
  const existing = await findRepositoryByGitHubId(data.githubId);
  
  if (existing) {
    // Update if needed
    if (existing.userId !== data.userId) {
      // Transfer ownership
      return updateRepository(existing.id, {});
    }
    return existing;
  }
  
  return createRepository(data);
}
