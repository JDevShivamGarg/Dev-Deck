import { addDays } from 'date-fns';
import type { CardProgress } from '../types';

export function grade(
  progress: CardProgress,
  correct: boolean,
  responseTimeMs: number = 0
): Omit<CardProgress, 'card_id'> & { card_id: number } {
  if (correct) {
    let speedFactor = 1.0;
    if (responseTimeMs > 0) {
      if (responseTimeMs < 4000) {
        speedFactor = 1.1; // Fast response: slight acceleration
      } else if (responseTimeMs < 8000) {
        speedFactor = 1.0; // Normal response
      } else if (responseTimeMs < 15000) {
        speedFactor = 0.7; // Moderate hesitation: decelerate interval growth
      } else {
        speedFactor = 0.5; // Significant hesitation: keep interval short
      }
    }

    const multiplier = 2.0 * speedFactor;
    const newInterval = Math.max(1, Math.min(progress.interval_days * multiplier, 30));
    const consecutive = progress.consecutive_correct + 1;

    return {
      card_id: progress.card_id,
      interval_days: newInterval,
      ease_factor: progress.ease_factor,
      consecutive_correct: consecutive,
      retired: consecutive >= 5 ? 1 : 0,
      next_due: addDays(new Date(), newInterval).getTime(),
      times_correct: progress.times_correct + 1,
      times_seen: progress.times_seen + 1,
      last_response_time_ms: responseTimeMs,
      incorrect_streak: 0,
    };
  } else {
    return {
      card_id: progress.card_id,
      interval_days: 1,
      ease_factor: Math.max(1.3, progress.ease_factor - 0.2),
      consecutive_correct: 0,
      retired: 0,
      next_due: addDays(new Date(), 1).getTime(),
      times_correct: progress.times_correct,
      times_seen: progress.times_seen + 1,
      last_response_time_ms: responseTimeMs,
      incorrect_streak: (progress.incorrect_streak ?? 0) + 1,
    };
  }
}
