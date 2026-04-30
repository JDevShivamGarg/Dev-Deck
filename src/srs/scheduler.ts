import { addDays } from 'date-fns';
import type { CardProgress } from '../types';

export function grade(
  progress: CardProgress,
  correct: boolean
): Omit<CardProgress, 'card_id'> & { card_id: number } {
  if (correct) {
    const newInterval = Math.min(progress.interval_days * 2, 30);
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
    };
  }
}
