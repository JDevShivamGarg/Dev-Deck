import { getDatabase } from '../client';
import type { Topic } from '../../types';

export async function getActiveTopics(): Promise<Topic[]> {
  const db = await getDatabase();
  return db.getAllAsync<Topic>(
    `SELECT *, (CASE WHEN source = 'builtin' THEN 1 ELSE 0 END) as is_builtin
     FROM Topic WHERE active = 1 ORDER BY source ASC, display_name ASC`
  );
}

export async function getAllTopics(): Promise<Topic[]> {
  const db = await getDatabase();
  return db.getAllAsync<Topic>(
    `SELECT *, (CASE WHEN source = 'builtin' THEN 1 ELSE 0 END) as is_builtin
     FROM Topic ORDER BY source ASC, display_name ASC`
  );
}

export async function getTopicById(id: number): Promise<Topic | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Topic>(
    `SELECT *, (CASE WHEN source = 'builtin' THEN 1 ELSE 0 END) as is_builtin
     FROM Topic WHERE id = ?`,
    [id]
  );
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Topic>(
    `SELECT *, (CASE WHEN source = 'builtin' THEN 1 ELSE 0 END) as is_builtin
     FROM Topic WHERE slug = ?`,
    [slug]
  );
}

export async function insertCustomTopic(
  slug: string,
  display: string,
  icon: string = '📌'
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO Topic (slug, display_name, icon, source, created_at)
     VALUES (?, ?, ?, 'custom', ?)`,
    [slug, display, icon, Date.now()]
  );
  return result.lastInsertRowId;
}

export async function toggleTopicActive(topicId: number, active: 0 | 1): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE Topic SET active = ? WHERE id = ?`, [active, topicId]);
}
