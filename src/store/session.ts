import { create } from 'zustand';
import type { CardWithProgress, CardMode, Proficiency } from '../types';

interface SessionState {
  // Session config
  topicId: number | null;
  topicName: string;
  mode: CardMode | null;
  proficiency: Proficiency;

  // Queue
  queue: CardWithProgress[];
  currentIndex: number;
  score: number;
  startedAt: number | null;

  // Answers tracking
  answers: { cardId: number; correct: boolean }[];

  // Actions
  setSessionConfig: (topicId: number, topicName: string, mode: CardMode, proficiency: Proficiency) => void;
  setQueue: (cards: CardWithProgress[]) => void;
  answerCard: (correct: boolean) => void;
  nextCard: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  topicId: null,
  topicName: '',
  mode: null,
  proficiency: 'intermediate',
  queue: [],
  currentIndex: 0,
  score: 0,
  startedAt: null,
  answers: [],

  setSessionConfig: (topicId, topicName, mode, proficiency) =>
    set({ topicId, topicName, mode, proficiency, startedAt: Date.now() }),

  setQueue: (cards) =>
    set({ queue: cards, currentIndex: 0, score: 0, answers: [] }),

  answerCard: (correct) => {
    const state = get();
    const currentCard = state.queue[state.currentIndex];
    if (!currentCard) return;

    set({
      score: correct ? state.score + 1 : state.score,
      answers: [...state.answers, { cardId: currentCard.id, correct }],
    });
  },

  nextCard: () => {
    const state = get();
    set({ currentIndex: state.currentIndex + 1 });
  },

  resetSession: () =>
    set({
      topicId: null,
      topicName: '',
      mode: null,
      proficiency: 'intermediate',
      queue: [],
      currentIndex: 0,
      score: 0,
      startedAt: null,
      answers: [],
    }),
}));
