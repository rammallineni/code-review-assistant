import { query, withTransaction } from '../database/connection.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { User, UserWithTokens } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';

// Database row types
interface UserRow {
  id: string;
  github_id: string;
  username: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    githubId: row.github_id,
    username: row.username,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToUserWithTokens(row: UserRow): UserWithTokens {
  return {
    ...mapRowToUser(row),
    accessTokenEncrypted: row.access_token_encrypted,
    refreshTokenEncrypted: row.refresh_token_encrypted,
    tokenExpiresAt: row.token_expires_at,
  };
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  const row = result.rows[0];
  return row ? mapRowToUser(row) : null;
}

export async function findUserByIdWithTokens(id: string): Promise<UserWithTokens | null> {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  const row = result.rows[0];
  return row ? mapRowToUserWithTokens(row) : null;
}

export async function findUserByGitHubId(githubId: string): Promise<User | null> {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE github_id = $1',
    [githubId]
  );
  
  const row = result.rows[0];
  return row ? mapRowToUser(row) : null;
}

export async function getUserAccessToken(userId: string): Promise<string> {
  const result = await query<{ access_token_encrypted: string }>(
    'SELECT access_token_encrypted FROM users WHERE id = $1',
    [userId]
  );
  
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError('User not found');
  }
  
  return row.access_token_encrypted;
}

export interface CreateUserData {
  githubId: string;
  username: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export async function createUser(data: CreateUserData): Promise<User> {
  const encryptedAccessToken = encrypt(data.accessToken);
  const encryptedRefreshToken = data.refreshToken ? encrypt(data.refreshToken) : null;

  const result = await query<UserRow>(
    `INSERT INTO users (
      github_id, username, email, name, avatar_url,
      access_token_encrypted, refresh_token_encrypted, token_expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      data.githubId,
      data.username,
      data.email,
      data.name,
      data.avatarUrl,
      encryptedAccessToken,
      encryptedRefreshToken,
      data.tokenExpiresAt ?? null,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create user');
  }
  
  return mapRowToUser(row);
}

export async function updateUserTokens(
  userId: string,
  accessToken: string,
  refreshToken?: string,
  tokenExpiresAt?: Date
): Promise<void> {
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

  await query(
    `UPDATE users SET
      access_token_encrypted = $1,
      refresh_token_encrypted = COALESCE($2, refresh_token_encrypted),
      token_expires_at = COALESCE($3, token_expires_at)
    WHERE id = $4`,
    [encryptedAccessToken, encryptedRefreshToken, tokenExpiresAt, userId]
  );
}

export async function updateUser(
  userId: string,
  data: Partial<{
    username: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  }>
): Promise<User> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.username !== undefined) {
    fields.push(`username = $${paramIndex++}`);
    values.push(data.username);
  }
  if (data.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(data.email);
  }
  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.avatarUrl !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(data.avatarUrl);
  }

  if (fields.length === 0) {
    const user = await findUserById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  values.push(userId);

  const result = await query<UserRow>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError('User not found');
  }
  
  return mapRowToUser(row);
}

export async function deleteUser(userId: string): Promise<void> {
  await withTransaction(async (client) => {
    // Delete user (cascades to related tables)
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
  });
}

export async function findOrCreateUser(data: CreateUserData): Promise<User> {
  const existing = await findUserByGitHubId(data.githubId);
  
  if (existing) {
    // Update tokens and return
    await updateUserTokens(
      existing.id,
      data.accessToken,
      data.refreshToken,
      data.tokenExpiresAt
    );
    
    // Update profile info if changed
    await updateUser(existing.id, {
      username: data.username,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
    });
    
    const updated = await findUserById(existing.id);
    return updated!;
  }
  
  return createUser(data);
}
