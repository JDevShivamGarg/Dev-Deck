import { getDatabase } from '../client';

export async function getProgress(topicId: number): Promise<{
  total: number;
  mastered: number;
  accuracy: number;
}> {
  const db = await getDatabase();

  const totalResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM Card WHERE topic_id = ?`, topicId);

  const masteredResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM CardProgress cp
     JOIN Card c ON c.id = cp.card_id
     WHERE c.topic_id = ? AND cp.retired = 1`, topicId);

  const accuracyResult = await db.getFirstAsync<{ seen: number; correct: number }>(
    `SELECT COALESCE(SUM(cp.times_seen), 0) as seen,
            COALESCE(SUM(cp.times_correct), 0) as correct
     FROM CardProgress cp
     JOIN Card c ON c.id = cp.card_id
     WHERE c.topic_id = ?`, topicId);

  const total = totalResult?.count ?? 0;
  const mastered = masteredResult?.count ?? 0;
  const seen = accuracyResult?.seen ?? 0;
  const correct = accuracyResult?.correct ?? 0;
  const accuracy = seen > 0 ? (correct / seen) * 100 : 0;

  return { total, mastered, accuracy };
}

export async function getOverallProgress(): Promise<{
  totalCards: number;
  mastered: number;
  totalSessions: number;
  currentStreak: number;
  accuracy: number;
}> {
  const db = await getDatabase();

  const totalResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM Card`
  );

  const masteredResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM CardProgress WHERE retired = 1`
  );

  const sessionResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM Session`
  );

  const accuracyResult = await db.getFirstAsync<{ seen: number; correct: number }>(
    `SELECT COALESCE(SUM(times_seen), 0) as seen,
            COALESCE(SUM(times_correct), 0) as correct
     FROM CardProgress`
  );

  // Calculate streak: consecutive days with at least one session
  const sessions = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT date(started_at / 1000, 'unixepoch', 'localtime') as day
     FROM Session
     ORDER BY day DESC`
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  if (sessions.length > 0) {
    const firstSessionDate = parseLocalDate(sessions[0].day);
    if (firstSessionDate.getTime() === today.getTime() || firstSessionDate.getTime() === yesterday.getTime()) {
      let currentDateToMatch = firstSessionDate;
      for (let i = 0; i < sessions.length; i++) {
        const sessionDate = parseLocalDate(sessions[i].day);
        if (sessionDate.getTime() === currentDateToMatch.getTime()) {
          streak++;
          currentDateToMatch.setDate(currentDateToMatch.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  const seen = accuracyResult?.seen ?? 0;
  const correct = accuracyResult?.correct ?? 0;

  return {
    totalCards: totalResult?.count ?? 0,
    mastered: masteredResult?.count ?? 0,
    totalSessions: sessionResult?.count ?? 0,
    currentStreak: streak,
    accuracy: seen > 0 ? (correct / seen) * 100 : 0,
  };
}

export async function getStreakDays(): Promise<number> {
  const overall = await getOverallProgress();
  return overall.currentStreak;
}

export async function getTopicAccuracy(topicId: number): Promise<number> {
  const db = await getDatabase();
  try {
    const result = await db.getFirstAsync<{ seen: number; correct: number }>(
      `SELECT COALESCE(SUM(cp.times_seen), 0) as seen,
              COALESCE(SUM(cp.times_correct), 0) as correct
       FROM CardProgress cp
       JOIN Card c ON c.id = cp.card_id
       WHERE c.topic_id = ?`, topicId);
    const seen = result?.seen ?? 0;
    const correct = result?.correct ?? 0;
    if (seen === 0) return -1; // no data
    return correct / seen;
  } catch (error) {
    console.error('Database Error in getTopicAccuracy:', error);
    throw error;
  }
}
