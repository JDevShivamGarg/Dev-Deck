import { useState, useEffect, useRef, useCallback } from 'react';
import { getCardsDue, getCardsDueCount, insertCard, updateCardProgress, getExistingQuestionsForTopic } from '../db/queries/cards';
import { generateAdditionalCards } from '../ai/generator';
import { grade } from '../srs/scheduler';
import { shuffle } from '../utils/shuffle';
import { PROFICIENCY_DIFFICULTY_MAP } from '../utils/proficiencyMap';
import { useSessionStore } from '../store/session';
import { triggerRemediation } from '../srs/remediation';
import type { CardMode, Proficiency } from '../types';
import Constants from 'expo-constants';

const AI_THRESHOLD = 5;

export function useSession(
  topicId: number,
  topicName: string,
  mode: CardMode,
  proficiency: Proficiency,
  timeLimitSecs?: number
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const store = useSessionStore();
  const [cardStartedAt, setCardStartedAt] = useState<number>(Date.now());
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [cardElapsed, setCardElapsed] = useState(0);
  const cardStartRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    setCardStartedAt(now);
    cardStartRef.current = now;
    setCardElapsed(0);
  }, [store.currentIndex]);

  // Live session elapsed
  useEffect(() => {
    if (store.startedAt) {
      sessionStartRef.current = store.startedAt;
    }
    const interval = setInterval(() => {
      if (sessionStartRef.current) {
        setSessionElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }
      setCardElapsed(Math.floor((Date.now() - cardStartRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [store.startedAt]);

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

  const gradeCard = useCallback(async (correct: boolean, userChoice?: string) => {
    const currentCard = store.queue[store.currentIndex];
    if (!currentCard) return;

    const elapsed = Date.now() - cardStartedAt;

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
        last_response_time_ms: currentCard.last_response_time_ms,
        incorrect_streak: currentCard.incorrect_streak,
      },
      correct,
      elapsed
    );

    try {
      await updateCardProgress(currentCard.id, updated);

      if (!correct && updated.incorrect_streak !== undefined && updated.incorrect_streak >= 3) {
        let weakTag = topicName;
        if (currentCard.tags) {
          try {
            const parsedTags = JSON.parse(currentCard.tags);
            if (Array.isArray(parsedTags) && parsedTags.length > 0) {
              weakTag = parsedTags[0];
            }
          } catch {
            if (typeof currentCard.tags === 'string' && currentCard.tags.trim()) {
              weakTag = currentCard.tags;
            }
          }
        }
        triggerRemediation(topicId, topicName, weakTag);
      }
    } catch (err) {
      console.error('Failed to update card progress:', err);
    }

    store.answerCard(correct, currentCard, userChoice);
  }, [store.queue, store.currentIndex, cardStartedAt, topicId, topicName]);

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
    sessionElapsed,
    cardElapsed,
    timeLimitSecs,
  };
}
