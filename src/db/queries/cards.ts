import { getDatabase } from '../client';
import type { CardWithProgress, RawCard } from '../../types';

export async function getCardsDue(
  topicId: number,
  mode: string,
  diffMin: number,
  diffMax: number,
  limit: number = 20
): Promise<CardWithProgress[]> {
  const db = await getDatabase();
  try {
    const now = Date.now();
    return db.getAllAsync<CardWithProgress>(
      `SELECT c.*, cp.interval_days, cp.ease_factor, cp.consecutive_correct,
              cp.times_seen, cp.times_correct, cp.next_due, cp.retired,
              cp.last_response_time_ms, cp.incorrect_streak
       FROM Card c
       JOIN CardProgress cp ON cp.card_id = c.id
       WHERE c.topic_id = ?
         AND c.mode = ?
         AND c.difficulty BETWEEN ? AND ?
         AND cp.retired = 0
         AND cp.next_due <= ?
       ORDER BY cp.next_due ASC
       LIMIT ?`, topicId, mode, diffMin, diffMax, now, limit);
  } catch (error) {
    console.error('Database Error in getCardsDue:', error);
    throw error;
  }
}

export async function getCardsDueCount(topicId: number): Promise<number> {
  const db = await getDatabase();
  try {
    const now = Date.now();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM Card c
       JOIN CardProgress cp ON cp.card_id = c.id
       WHERE c.topic_id = ?
         AND cp.retired = 0
         AND cp.next_due <= ?`, topicId, now);
    return result?.count ?? 0;
  } catch (error) {
    console.error('Database Error in getCardsDueCount:', error);
    throw error;
  }
}

export async function getAllCardsDueCount(): Promise<number> {
  const db = await getDatabase();
  try {
    const now = Date.now();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM CardProgress
       WHERE retired = 0 AND next_due <= ?`, now);
    return result?.count ?? 0;
  } catch (error) {
    console.error('Database Error in getAllCardsDueCount:', error);
    throw error;
  }
}

export async function insertCard(
  topicId: number,
  mode: string,
  card: RawCard,
  source: 'static' | 'ai'
): Promise<number> {
  const db = await getDatabase();
  try {
    const now = Date.now();
    const result = await db.runAsync(
      `INSERT INTO Card (topic_id, mode, difficulty, question, answer, options, code_snippet, explanation, tags, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        topicId,
        mode,
        card.difficulty,
        card.question,
        card.answer,
        card.options ? JSON.stringify(card.options) : null,
        card.code_snippet ?? null,
        card.explanation ?? null,
        card.tags ? JSON.stringify(card.tags) : null,
        source,
        now,
      );
  
    const cardId = result.lastInsertRowId;
  
    // Create initial progress entry
    await db.runAsync(
      `INSERT INTO CardProgress (card_id, interval_days, ease_factor, consecutive_correct, times_seen, times_correct, next_due, retired)
       VALUES (?, 1, 2.5, 0, 0, 0, ?, 0)`, cardId, now);
  
    return cardId;
  } catch (error) {
    console.error('Database Error in insertCard:', error);
    throw error;
  }
}

export async function updateCardProgress(
  cardId: number,
  progress: {
    interval_days: number;
    ease_factor: number;
    consecutive_correct: number;
    times_seen: number;
    times_correct: number;
    next_due: number;
    retired: number;
    last_response_time_ms?: number;
    incorrect_streak?: number;
  }
): Promise<void> {
  const db = await getDatabase();
  try {
    await db.runAsync(
      `UPDATE CardProgress
       SET interval_days = ?, ease_factor = ?, consecutive_correct = ?,
           times_seen = ?, times_correct = ?, next_due = ?, retired = ?,
           last_response_time_ms = ?, incorrect_streak = ?
       WHERE card_id = ?`, 
        progress.interval_days,
        progress.ease_factor,
        progress.consecutive_correct,
        progress.times_seen,
        progress.times_correct,
        progress.next_due,
        progress.retired,
        progress.last_response_time_ms ?? 0,
        progress.incorrect_streak ?? 0,
        cardId,
      );
  } catch (error) {
    console.error('Database Error in updateCardProgress:', error);
    throw error;
  }
}

export async function getCardCountByTopicAndMode(
  topicId: number,
  mode: string
): Promise<number> {
  const db = await getDatabase();
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM Card WHERE topic_id = ? AND mode = ?`, topicId, mode);
    return result?.count ?? 0;
  } catch (error) {
    console.error('Database Error in getCardCountByTopicAndMode:', error);
    throw error;
  }
}

export async function retireCard(cardId: number): Promise<void> {
  const db = await getDatabase();
  try {
    await db.runAsync(
      `UPDATE CardProgress SET retired = 1 WHERE card_id = ?`, cardId);
  } catch (error) {
    console.error('Database Error in retireCard:', error);
    throw error;
  }
}

export async function unretireCard(cardId: number): Promise<void> {
  const db = await getDatabase();
  try {
    await db.runAsync(
      `UPDATE CardProgress SET retired = 0, consecutive_correct = 0, next_due = ? WHERE card_id = ?`, Date.now(), cardId);
  } catch (error) {
    console.error('Database Error in unretireCard:', error);
    throw error;
  }
}

export async function getExistingQuestionsForTopic(topicId: number): Promise<string[]> {
  const db = await getDatabase();
  try {
    const cards = await db.getAllAsync<{ question: string }>(
      `SELECT question FROM Card WHERE topic_id = ?`, topicId);
    return cards.map(c => c.question);
  } catch (error) {
    console.error('Database Error in getExistingQuestionsForTopic:', error);
    throw error;
  }
}
