import { getDatabase } from '../client';
import { CREATE_TABLES_SQL } from '../schema';
import { BUILTIN_TOPICS } from '../../data/topics';

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  // Create tables
  await db.execAsync(CREATE_TABLES_SQL);

  // Add material column if it doesn't exist
  try {
    await db.execAsync(`ALTER TABLE Topic ADD COLUMN material TEXT;`);
  } catch (err) {
    // Column might already exist
  }

  // Seed builtin topics if not present
  for (const topic of BUILTIN_TOPICS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO Topic (slug, display_name, icon, source, created_at)
       VALUES (?, ?, ?, 'builtin', ?)`, topic.slug, topic.display, topic.icon, Date.now());
  }
}
