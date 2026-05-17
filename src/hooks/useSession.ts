import { useState, useEffect, useCallback } from 'react';
import { getCardsDue, getCardsDueCount, insertCard, updateCardProgress, getExistingQuestionsForTopic } from '../db/queries/cards';
import { generateAdditionalCards } from '../ai/generator';
import { grade } from '../srs/scheduler';
import { shuffle } from '../utils/shuffle';
import { PROFICIENCY_DIFFICULTY_MAP } from '../utils/proficiencyMap';
import { useSessionStore } from '../store/session';
import type { CardMode, Proficiency } from '../types';
import Constants from 'expo-constants';

const AI_THRESHOLD = 5;

export function useSession(topicId: number, topicName: string, mode: CardMode, proficiency: Proficiency) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const store = useSessionStore();

  const loadCards = useCallback(async () => {
    try {
      store.resetSession();
      setLoading(true);
      setError(null);

      const [diffMin, diffMax] = PROFICIENCY_DIFFICULTY_MAP[proficiency];

      // Check if we need AI generation
      const dueCount = await getCardsDueCount(topicId);
      if (dueCount < AI_THRESHOLD) {
        const apiKey = Constants.expoConfig?.extra?.groqApiKey
          ?? process.env.EXPO_PUBLIC_GROQ_API_KEY
          ?? '';

        if (apiKey) {
          try {
            const existingQs = await getExistingQuestionsForTopic(topicId);
            const result = await generateAdditionalCards(topicName, existingQs, apiKey);
            for (const card of result.cards) {
              await insertCard(topicId, card._mappedMode as any, card, 'ai');
            }
          } catch {
            __DEV__ && console.log('AI background generation unavailable, using stored cards');
          }
        }
      }

      const cards = await getCardsDue(topicId, mode, diffMin, diffMax);
      const shuffled = shuffle(cards);

      store.setSessionConfig(topicId, topicName, mode, proficiency);
      store.setQueue(shuffled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, [topicId, topicName, mode, proficiency]);

  const gradeCard = useCallback(async (correct: boolean) => {
    const currentCard = store.queue[store.currentIndex];
    if (!currentCard) return;

    const updated = grade(
      {
        card_id: currentCard.id,
        interval_days: currentCard.interval_days,
        ease_factor: currentCard.ease_factor,
        consecutive_correct: currentCard.consecutive_correct,
        times_seen: currentCard.times_seen,
        times_correct: currentCard.times_correct,
        next_due: currentCard.next_due,
        retired: currentCard.retired,
      },
      correct
    );

    try {
      await updateCardProgress(currentCard.id, updated);
    } catch (err) {
      console.error('Failed to update card progress:', err);
    }

    store.answerCard(correct);
  }, [store.queue, store.currentIndex]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  return {
    loading,
    error,
    queue: store.queue,
    currentIndex: store.currentIndex,
    score: store.score,
    answers: store.answers,
    currentCard: store.queue[store.currentIndex] ?? null,
    isComplete: store.currentIndex >= store.queue.length,
    totalCards: store.queue.length,
    gradeCard,
    nextCard: store.nextCard,
    reload: loadCards,
  };
}
