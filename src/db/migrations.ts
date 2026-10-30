import type { SQLiteDatabase } from 'expo-sqlite'

export const DATABASE_NAME = 'gabai.db'

/**
 * Ordered, append-only list of schema migrations. Never edit a migration that has shipped;
 * add a new entry instead. `PRAGMA user_version` tracks how many have been applied.
 */
const migrations: ((db: SQLiteDatabase) => Promise<void>)[] = [
  async (db) => {
    await db.execAsync(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE profile (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL UNIQUE,
        width INTEGER,
        height INTEGER,
        created_at INTEGER NOT NULL
      );
    `)
  },
  async (db) => {
    await db.execAsync(`
      CREATE TABLE token_usage (
        source TEXT PRIMARY KEY NOT NULL CHECK (source IN ('gemini', 'local')),
        requests INTEGER NOT NULL DEFAULT 0,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0
      );
    `)
  },
  // Photo attachments on chat messages. `photo` holds the same reference the photos
  // table uses: a file name on native, a data URI on web.
  async (db) => {
    await db.execAsync(`
      ALTER TABLE chat_messages ADD COLUMN photo TEXT;
      ALTER TABLE chat_messages ADD COLUMN photo_mime TEXT;
    `)
  },
  // Widen the token_usage.source CHECK so the custom backend can record usage.
  // SQLite cannot alter a CHECK constraint, so the table is rebuilt and counters copied.
  async (db) => {
    await db.execAsync(`
      CREATE TABLE token_usage_new (
        source TEXT PRIMARY KEY NOT NULL CHECK (source IN ('gemini', 'local', 'custom')),
        requests INTEGER NOT NULL DEFAULT 0,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO token_usage_new (source, requests, prompt_tokens, completion_tokens)
        SELECT source, requests, prompt_tokens, completion_tokens FROM token_usage;
      DROP TABLE token_usage;
      ALTER TABLE token_usage_new RENAME TO token_usage;
    `)
  },
]

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;')
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const current = row?.user_version ?? 0
  for (let version = current; version < migrations.length; version++) {
    const migrate = migrations[version]
    await db.withTransactionAsync(async () => {
      await migrate(db)
      await db.execAsync(`PRAGMA user_version = ${version + 1}`)
    })
  }
}
