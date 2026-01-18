import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

/**
 * Embedded schema SQL
 * (Bundled via tsup so it works on Render / prod)
 */
const INIT_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(512) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    default_branch VARCHAR(255) DEFAULT 'main',
    language VARCHAR(100),
    webhook_id VARCHAR(255),
    webhook_active BOOLEAN DEFAULT false,
    auto_review BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pr_number INTEGER NOT NULL,
    pr_title VARCHAR(512),
    pr_url TEXT,
    pr_author VARCHAR(255),
    head_sha VARCHAR(40),
    base_sha VARCHAR(40),
    status VARCHAR(50) DEFAULT 'pending'
      CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    summary TEXT,
    total_issues INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    info_count INTEGER DEFAULT 0,
    files_reviewed INTEGER DEFAULT 0,
    lines_reviewed INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(repository_id, pr_number, head_sha)
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    file_path VARCHAR(1024) NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    severity VARCHAR(50) NOT NULL
      CHECK (severity IN ('critical', 'warning', 'info')),
    category VARCHAR(100) NOT NULL
      CHECK (category IN ('security', 'performance', 'style', 'bug', 'best_practice', 'other')),
    title VARCHAR(512) NOT NULL,
    description TEXT NOT NULL,
    suggestion TEXT,
    code_snippet TEXT,
    language VARCHAR(50),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, repository_id, setting_key),
    CHECK (
        (user_id IS NOT NULL AND repository_id IS NULL) OR
        (user_id IS NULL AND repository_id IS NOT NULL) OR
        (user_id IS NOT NULL AND repository_id IS NOT NULL)
    )
);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(100),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_github_id ON repositories(github_id);
CREATE INDEX IF NOT EXISTS idx_reviews_repository_id ON reviews(repository_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_review_id ON issues(review_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_repository_id ON settings(repository_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_repository_id ON webhook_events(repository_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repositories_updated_at ON repositories;
CREATE TRIGGER update_repositories_updated_at
    BEFORE UPDATE ON repositories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

let pool: Pool | null = null;

/**
 * Connect to DB and ensure schema exists
 */
export async function connectDatabase(): Promise<Pool> {
  if (pool) return pool;

  pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (error) => {
    logger.error('Unexpected database error:', error);
  });

  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger.debug('Database connection test successful');

    // 🔑 FIX: remove comment lines BEFORE splitting statements
    const sqlNoComments = INIT_SQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = sqlNoComments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await client.query(stmt);
    }

    logger.info('✅ Database schema ensured');
  } catch (err) {
    logger.error('❌ Failed initializing database schema:', err);
    throw err;
  } finally {
    client.release();
  }

  return pool;
}

/**
 * Get pool (after connectDatabase)
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

/**
 * Query helper
 */
export async function query<T>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  logger.debug(`Query executed in ${duration}ms`);
  return result;
}

/**
 * Get raw client
 */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Transaction helper
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Graceful shutdown
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}
