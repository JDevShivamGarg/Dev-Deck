import { getDatabase } from '../client';
import type { Topic } from '../../types';

export async function getActiveTopics(): Promise<Topic[]> {
  const db = await getDatabase();
  try {
    return db.getAllAsync<Topic>(
      `SELECT *, (CASE WHEN source = 'builtin' THEN 1 ELSE 0 END) as is_builtin
       FROM Topic WHERE active = 1 ORDER BY source ASC, display_name ASC`
    );
  } catch (error) {
    console.error('Database Error in getActiveTopics:', error);
    throw error;
  }
}

export async function getAllTopics(): Promise<Topic[]> {
  const db = await getDatabase();
  try {
    return db.getAllAsync<Topic>(
      `SELECT *, (CASE WHEN source = 'builtin' THEN 1 ELSE 0 END) as is_builtin
       FROM Topic ORDER BY source ASC, display_name ASC`
    );
  } catch (error) {
    console.error('Database Error in getAllTopics:', error);
    throw error;
  }
}

export async function getTopicById(id: number): Promise<Topic | null> {
  const db = await getDatabase();
  try {
    return db.getFirstAsync<Topic>(
      `SELECT *, (CASE WHEN source = 'builtin' THEN 1 ELSE 0 END) as is_builtin
       FROM Topic WHERE id = ?`, id);
  } catch (error) {
    console.error('Database Error in getTopicById:', error);
    throw error;
  }
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const db = await getDatabase();
  try {
    return db.getFirstAsync<Topic>(
      `SELECT *, (CASE WHEN source = 'builtin' THEN 1 ELSE 0 END) as is_builtin
       FROM Topic WHERE slug = ?`, slug);
  } catch (error) {
    console.error('Database Error in getTopicBySlug:', error);
    throw error;
  }
}

export async function insertCustomTopic(
  slug: string,
  display: string,
  icon: string = '📌',
  material: string = ''
): Promise<number> {
  const db = await getDatabase();
  try {
    const existing = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM Topic WHERE slug = ?`, slug
    );
    if (existing) {
      if (material) {
        await db.runAsync(
          `UPDATE Topic SET material = ?, display_name = ? WHERE id = ?`,
          material, display, existing.id
        );
      }
      return existing.id;
    }

    const result = await db.runAsync(
      `INSERT OR IGNORE INTO Topic (slug, display_name, icon, source, material, created_at)
       VALUES (?, ?, ?, 'custom', ?, ?)`, slug, display, icon, material, Date.now());

    if (result.lastInsertRowId === 0) {
      const fallback = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM Topic WHERE slug = ?`, slug
      );
      return fallback?.id ?? 0;
    }
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Database Error in insertCustomTopic:', error);
    throw error;
  }
}

export async function toggleTopicActive(topicId: number, active: 0 | 1): Promise<void> {
  const db = await getDatabase();
  try {
    await db.runAsync(`UPDATE Topic SET active = ? WHERE id = ?`, active, topicId);
  } catch (error) {
    console.error('Database Error in toggleTopicActive:', error);
    throw error;
  }
}

export async function deleteTopic(topicId: number): Promise<void> {
  const db = await getDatabase();
  try {
    // 1. Delete CardProgress for all cards in this topic
    await db.runAsync(
      `DELETE FROM CardProgress WHERE card_id IN (SELECT id FROM Card WHERE topic_id = ?)`,
      topicId
    );
    // 2. Delete Cards in this topic
    await db.runAsync(`DELETE FROM Card WHERE topic_id = ?`, topicId);
    // 3. Delete UserTopicConfig for this topic
    await db.runAsync(`DELETE FROM UserTopicConfig WHERE topic_id = ?`, topicId);
    // 4. Delete Session records for this topic
    await db.runAsync(`DELETE FROM Session WHERE topic_id = ?`, topicId);
    // 5. Delete Topic itself
    await db.runAsync(`DELETE FROM Topic WHERE id = ?`, topicId);
  } catch (error) {
    console.error('Database Error in deleteTopic:', error);
    throw error;
  }
}
