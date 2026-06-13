import { getDatabase } from '../client';
import type { SessionRecord } from '../../types';

export async function insertSession(session: {
  topic_id: number;
  mode: string;
  proficiency: string;
  total_cards: number;
  correct: number;
  started_at: number;
  ended_at: number;
}): Promise<number> {
  const db = await getDatabase();
  try {
    const result = await db.runAsync(
      `INSERT INTO Session (topic_id, mode, proficiency, total_cards, correct, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        session.topic_id,
        session.mode,
        session.proficiency,
        session.total_cards,
        session.correct,
        session.started_at,
        session.ended_at,
      );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Database Error in insertSession:', error);
    throw error;
  }
}

export async function getSessionHistory(limit: number = 20): Promise<SessionRecord[]> {
  const db = await getDatabase();
  try {
    return db.getAllAsync<SessionRecord>(
      `SELECT s.*, t.display_name as topic_name
       FROM Session s
       JOIN Topic t ON t.id = s.topic_id
       ORDER BY s.ended_at DESC
       LIMIT ?`, limit);
  } catch (error) {
    console.error('Database Error in getSessionHistory:', error);
    throw error;
  }
}

export async function getSessionsByTopic(topicId: number): Promise<SessionRecord[]> {
  const db = await getDatabase();
  try {
    return db.getAllAsync<SessionRecord>(
      `SELECT * FROM Session WHERE topic_id = ? ORDER BY ended_at DESC`, topicId);
  } catch (error) {
    console.error('Database Error in getSessionsByTopic:', error);
    throw error;
  }
}

export async function getRecentSessions(limit: number = 4): Promise<(SessionRecord & { topic_name?: string })[]> {
  const db = await getDatabase();
  try {
    return db.getAllAsync<SessionRecord & { topic_name?: string }>(
      `SELECT s.*, t.display_name as topic_name
       FROM Session s
       LEFT JOIN Topic t ON t.id = s.topic_id
       ORDER BY s.ended_at DESC
       LIMIT ?`, limit);
  } catch (error) {
    console.error('Database Error in getRecentSessions:', error);
    throw error;
  }
}

export async function getCardsReviewedToday(): Promise<number> {
  const db = await getDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startMs = startOfDay.getTime();
  
  try {
    const result = await db.getFirstAsync<{ sum: number }>(
      `SELECT SUM(total_cards) as sum FROM Session WHERE ended_at >= ?`, startMs
    );
    return result?.sum || 0;
  } catch (error) {
    console.error('Database Error in getCardsReviewedToday:', error);
    return 0;
  }
}
