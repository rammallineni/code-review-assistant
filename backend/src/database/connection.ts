import { Pool, PoolClient, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

let pool: Pool | null = null;

export async function connectDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (error) => {
    logger.error('Unexpected database error:', error);
  });

  // Test the connection
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    logger.debug('Database connection test successful');

    // Apply schema (idempotent: uses IF NOT EXISTS)
    try {
      const sqlPath = path.join(process.cwd(), 'src', 'database', 'init.sql');
      const initSql = fs.readFileSync(sqlPath, 'utf8');

      // Split statements on ';' lines (simple + good enough for this init.sql)
      const statements = initSql
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(Boolean)
        .filter(s => !s.startsWith('--'));

      for (const stmt of statements) {
        await client.query(stmt);
      }

      logger.info('✅ Database schema ensured (init.sql applied)');
    } catch (e) {
      logger.error('❌ Failed applying init.sql schema:', e);
      throw e;
    }
  } finally {
    client.release();
  }

  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

export async function query<T>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  
  logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
  
  return result;
}

export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}
