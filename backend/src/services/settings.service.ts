import { query } from '../database/connection.js';
import { ReviewSettings, Setting } from '../types/index.js';

interface SettingRow {
  id: string;
  user_id: string | null;
  repository_id: string | null;
  setting_key: string;
  setting_value: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

function mapRowToSetting(row: SettingRow): Setting {
  return {
    id: row.id,
    userId: row.user_id,
    repositoryId: row.repository_id,
    settingKey: row.setting_key,
    settingValue: row.setting_value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  enabledCategories: ['security', 'performance', 'style', 'bug', 'best_practice'],
  severityThreshold: 'info',
  ignoredFiles: [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '*.min.js',
    '*.min.css',
    '*.map',
    'dist/*',
    'build/*',
    'node_modules/*',
  ],
  ignoredPatterns: [
    '\\.test\\.',
    '\\.spec\\.',
    '__tests__',
    '__mocks__',
  ],
  customRules: [],
  languageSettings: {
    javascript: {
      enabled: true,
      lintingEnabled: true,
      maxFileSize: 100000,
      excludePatterns: [],
    },
    typescript: {
      enabled: true,
      lintingEnabled: true,
      maxFileSize: 100000,
      excludePatterns: [],
    },
    python: {
      enabled: true,
      lintingEnabled: true,
      maxFileSize: 100000,
      excludePatterns: [],
    },
    java: {
      enabled: true,
      lintingEnabled: true,
      maxFileSize: 150000,
      excludePatterns: [],
    },
  },
};

export async function getSetting(
  userId: string | null,
  repositoryId: string | null,
  key: string
): Promise<Setting | null> {
  let queryText: string;
  let params: (string | null)[];

  if (userId && repositoryId) {
    queryText = `SELECT * FROM settings 
                 WHERE user_id = $1 AND repository_id = $2 AND setting_key = $3`;
    params = [userId, repositoryId, key];
  } else if (userId) {
    queryText = `SELECT * FROM settings 
                 WHERE user_id = $1 AND repository_id IS NULL AND setting_key = $2`;
    params = [userId, key];
  } else if (repositoryId) {
    queryText = `SELECT * FROM settings 
                 WHERE user_id IS NULL AND repository_id = $1 AND setting_key = $2`;
    params = [repositoryId, key];
  } else {
    return null;
  }

  const result = await query<SettingRow>(queryText, params);
  const row = result.rows[0];
  return row ? mapRowToSetting(row) : null;
}

export async function setSetting(
  userId: string | null,
  repositoryId: string | null,
  key: string,
  value: Record<string, unknown>
): Promise<Setting> {
  const result = await query<SettingRow>(
    `INSERT INTO settings (user_id, repository_id, setting_key, setting_value)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, repository_id, setting_key) 
     DO UPDATE SET setting_value = EXCLUDED.setting_value
     RETURNING *`,
    [userId, repositoryId, key, JSON.stringify(value)]
  );

  return mapRowToSetting(result.rows[0]!);
}

export async function deleteSetting(
  userId: string | null,
  repositoryId: string | null,
  key: string
): Promise<void> {
  let queryText: string;
  let params: (string | null)[];

  if (userId && repositoryId) {
    queryText = `DELETE FROM settings 
                 WHERE user_id = $1 AND repository_id = $2 AND setting_key = $3`;
    params = [userId, repositoryId, key];
  } else if (userId) {
    queryText = `DELETE FROM settings 
                 WHERE user_id = $1 AND repository_id IS NULL AND setting_key = $2`;
    params = [userId, key];
  } else if (repositoryId) {
    queryText = `DELETE FROM settings 
                 WHERE user_id IS NULL AND repository_id = $1 AND setting_key = $2`;
    params = [repositoryId, key];
  } else {
    return;
  }

  await query(queryText, params);
}

export async function listSettings(
  userId: string | null,
  repositoryId: string | null
): Promise<Setting[]> {
  let queryText: string;
  let params: (string | null)[];

  if (userId && repositoryId) {
    queryText = `SELECT * FROM settings 
                 WHERE (user_id = $1 AND repository_id IS NULL)
                    OR (user_id IS NULL AND repository_id = $2)
                    OR (user_id = $1 AND repository_id = $2)
                 ORDER BY setting_key`;
    params = [userId, repositoryId];
  } else if (userId) {
    queryText = `SELECT * FROM settings 
                 WHERE user_id = $1 AND repository_id IS NULL
                 ORDER BY setting_key`;
    params = [userId];
  } else if (repositoryId) {
    queryText = `SELECT * FROM settings 
                 WHERE user_id IS NULL AND repository_id = $1
                 ORDER BY setting_key`;
    params = [repositoryId];
  } else {
    return [];
  }

  const result = await query<SettingRow>(queryText, params);
  return result.rows.map(mapRowToSetting);
}

// Get merged settings (user + repository with repo taking precedence)
export async function getSettings(
  userId: string,
  repositoryId?: string
): Promise<ReviewSettings> {
  // Start with defaults
  let settings = { ...DEFAULT_REVIEW_SETTINGS };

  // Get user-level settings
  const userSetting = await getSetting(userId, null, 'review');
  if (userSetting) {
    settings = {
      ...settings,
      ...(userSetting.settingValue as Partial<ReviewSettings>),
    };
  }

  // Get repository-level settings (override user settings)
  if (repositoryId) {
    const repoSetting = await getSetting(null, repositoryId, 'review');
    if (repoSetting) {
      settings = {
        ...settings,
        ...(repoSetting.settingValue as Partial<ReviewSettings>),
      };
    }

    // Get user+repo specific settings (highest priority)
    const userRepoSetting = await getSetting(userId, repositoryId, 'review');
    if (userRepoSetting) {
      settings = {
        ...settings,
        ...(userRepoSetting.settingValue as Partial<ReviewSettings>),
      };
    }
  }

  return settings;
}

// Update user settings
export async function updateUserSettings(
  userId: string,
  settings: Partial<ReviewSettings>
): Promise<ReviewSettings> {
  const current = await getSettings(userId);
  const merged = { ...current, ...settings };
  
  await setSetting(userId, null, 'review', merged as unknown as Record<string, unknown>);
  
  return merged;
}

// Update repository settings
export async function updateRepositorySettings(
  repositoryId: string,
  settings: Partial<ReviewSettings>
): Promise<void> {
  const existingSetting = await getSetting(null, repositoryId, 'review');
  const current = (existingSetting?.settingValue ?? DEFAULT_REVIEW_SETTINGS) as ReviewSettings;
  const merged = { ...current, ...settings };
  
  await setSetting(null, repositoryId, 'review', merged as unknown as Record<string, unknown>);
}
