import { create } from 'zustand';
import type { CardWithProgress, CardMode, Proficiency } from '../types';

export interface AnswerRecord {
  cardId: number;
  correct: boolean;
  question: string;
  answer: string;
  options: string | null;
  mode: CardMode;
  /** MCQ: the option string the user selected */
  userChoice?: string;
}

interface SessionState {
  // Session config
  sessionId: string | null;
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
  answers: AnswerRecord[];

  // Actions
  setSessionConfig: (topicId: number, topicName: string, mode: CardMode, proficiency: Proficiency) => void;
  setQueue: (cards: CardWithProgress[]) => void;
  answerCard: (correct: boolean, card: CardWithProgress, userChoice?: string) => void;
  nextCard: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
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
    set({ 
      sessionId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      topicId, 
      topicName, 
      mode, 
      proficiency, 
      startedAt: Date.now() 
    }),

  setQueue: (cards) =>
    set({ queue: cards, currentIndex: 0, score: 0, answers: [] }),

  answerCard: (correct, card, userChoice?) => {
    const state = get();
    if (!card) return;

    const record: AnswerRecord = {
      cardId: card.id,
      correct,
      question: card.question,
      answer: card.answer,
      options: card.options,
      mode: card.mode,
      userChoice,
    };

    set({
      score: correct ? state.score + 1 : state.score,
      answers: [...state.answers, record],
    });
  },

  nextCard: () => {
    const state = get();
    set({ currentIndex: state.currentIndex + 1 });
  },

  resetSession: () =>
    set({
      sessionId: null,
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
